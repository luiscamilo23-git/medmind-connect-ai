import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface ValidationError {
  field: string
  error: string
  currentValue: any
}

interface Suggestion {
  field: string
  issue: string
  suggestion: string
  suggestedValue?: any
  priority: 'high' | 'medium' | 'low'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { invoiceId } = await req.json()

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'invoiceId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch invoice with related data
    const { data: invoice, error: invError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        patients(full_name, email, phone, address),
        invoice_items(*)
      `)
      .eq('id', invoiceId)
      .eq('doctor_id', user.id)
      .single()

    if (invError || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (invoice.estado !== 'RECHAZADA') {
      return new Response(
        JSON.stringify({ error: 'Invoice is not rejected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get latest emission log
    const { data: logs, error: logsError } = await supabaseClient
      .from('dian_emission_logs')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (logsError || !logs || logs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No emission logs found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const latestLog = logs[0]
    const validationErrors = invoice.errores_validacion as ValidationError[] || []
    
    // Analyze errors and generate suggestions using Lovable AI
    const suggestions = await analyzeErrorsWithAI(
      invoice,
      validationErrors,
      latestLog.error_message || '',
      latestLog.response_payload as any
    )

    return new Response(
      JSON.stringify({
        invoice,
        validationErrors,
        suggestions,
        errorMessage: latestLog.error_message,
        provider: latestLog.provider,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error analyzing invoice errors:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function analyzeErrorsWithAI(
  invoice: any,
  validationErrors: ValidationError[],
  errorMessage: string,
  responsePayload: any
): Promise<Suggestion[]> {
  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      console.warn('LOVABLE_API_KEY not configured, returning basic suggestions')
      return generateBasicSuggestions(validationErrors)
    }

    const prompt = `Analiza los siguientes errores de validación de una factura electrónica DIAN rechazada y proporciona sugerencias específicas para corregirlos:

DATOS DE LA FACTURA:
- Número DIAN: ${invoice.numero_factura_dian || 'Sin asignar'}
- Subtotal: ${invoice.subtotal}
- Impuestos: ${invoice.impuestos}
- Total: ${invoice.total}
- Fecha emisión: ${invoice.fecha_emision}
- Fecha vencimiento: ${invoice.fecha_vencimiento}
- Proveedor DIAN: ${invoice.proveedor_dian}

ERRORES DE VALIDACIÓN:
${JSON.stringify(validationErrors, null, 2)}

MENSAJE DE ERROR:
${errorMessage}

RESPUESTA DEL PROVEEDOR:
${JSON.stringify(responsePayload, null, 2)}

Por favor, proporciona para cada error:
1. El campo afectado
2. Una descripción clara del problema
3. Una sugerencia específica de corrección
4. Un valor sugerido si es aplicable
5. Prioridad (high, medium, low)

Responde SOLO con un JSON válido en el siguiente formato:
[
  {
    "field": "campo_afectado",
    "issue": "descripción del problema",
    "suggestion": "sugerencia de corrección específica",
    "suggestedValue": "valor sugerido o null",
    "priority": "high"
  }
]`

    const response = await fetch('https://api.lovable.app/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en facturación electrónica colombiana y normativa DIAN. Analiza errores y proporciona soluciones precisas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      console.error('AI API error:', await response.text())
      return generateBasicSuggestions(validationErrors)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return generateBasicSuggestions(validationErrors)
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('No JSON found in AI response')
      return generateBasicSuggestions(validationErrors)
    }

    const suggestions = JSON.parse(jsonMatch[0])
    return suggestions as Suggestion[]
  } catch (error) {
    console.error('Error in AI analysis:', error)
    return generateBasicSuggestions(validationErrors)
  }
}

function generateBasicSuggestions(validationErrors: ValidationError[]): Suggestion[] {
  const suggestions: Suggestion[] = []

  for (const error of validationErrors) {
    let suggestion: Suggestion = {
      field: error.field,
      issue: error.error,
      suggestion: '',
      priority: 'medium'
    }

    // Generate basic suggestions based on common error patterns
    const errorLower = error.error.toLowerCase()

    if (errorLower.includes('requerido') || errorLower.includes('obligatorio')) {
      suggestion.suggestion = `El campo ${error.field} es obligatorio y debe ser completado`
      suggestion.priority = 'high'
    } else if (errorLower.includes('formato') || errorLower.includes('inválido')) {
      suggestion.suggestion = `Verificar el formato del campo ${error.field} según especificaciones DIAN`
      suggestion.priority = 'high'
    } else if (errorLower.includes('nit') || errorLower.includes('identificación')) {
      suggestion.suggestion = 'Verificar que el NIT o identificación sea válido y esté correctamente digitado'
      suggestion.priority = 'high'
    } else if (errorLower.includes('fecha')) {
      suggestion.suggestion = 'Verificar que las fechas estén en formato correcto (YYYY-MM-DD) y sean válidas'
      suggestion.priority = 'medium'
    } else if (errorLower.includes('total') || errorLower.includes('valor')) {
      suggestion.suggestion = 'Recalcular los totales asegurando que subtotal + impuestos = total'
      suggestion.priority = 'high'
    } else if (errorLower.includes('cups')) {
      suggestion.suggestion = 'Verificar que el código CUPS sea válido según la tabla oficial'
      suggestion.priority = 'medium'
    } else {
      suggestion.suggestion = `Revisar y corregir el campo ${error.field} según los estándares DIAN`
      suggestion.priority = 'medium'
    }

    suggestions.push(suggestion)
  }

  return suggestions
}
