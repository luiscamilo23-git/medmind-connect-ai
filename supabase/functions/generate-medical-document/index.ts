import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { medicalRecordId, documentType, templateId } = await req.json();

    // Obtener registro médico
    const { data: record, error: recordError } = await supabaseClient
      .from('medical_records')
      .select('*, patients(*), profiles(*)')
      .eq('id', medicalRecordId)
      .single();

    if (recordError || !record) {
      return new Response(JSON.stringify({ error: 'Historia clínica no encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get custom template if provided
    let customTemplate = null;
    if (templateId) {
      const { data: template } = await supabaseClient
        .from('document_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      customTemplate = template;
    }

    // Generar documento con IA
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY no configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const documentData = await generateDocumentWithAI(record, documentType, LOVABLE_API_KEY, customTemplate);

    // Guardar en BD
    const { data: savedDoc, error: saveError } = await supabaseClient
      .from('medical_documents')
      .insert({
        doctor_id: user.id,
        patient_id: record.patient_id,
        medical_record_id: medicalRecordId,
        document_type: documentType,
        document_data: documentData,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving document:', saveError);
      return new Response(JSON.stringify({ error: 'Error guardando documento' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ document: savedDoc }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateDocumentWithAI(record: any, documentType: string, apiKey: string, customTemplate: any = null) {
  const prompts: Record<string, string> = {
    prescription: `Analiza la siguiente historia clínica y extrae SOLO los medicamentos prescritos en formato JSON estructurado.

HISTORIA CLÍNICA:
- Diagnóstico: ${record.diagnosis || 'No especificado'}
- Plan de tratamiento: ${record.treatment || 'No especificado'}
- Notas: ${record.voice_transcript || record.notes || 'No especificado'}

Responde SOLO con un JSON válido con esta estructura exacta:
{
  "medications": [
    {
      "name": "Nombre del medicamento",
      "dose": "Dosis (ej: 500mg)",
      "frequency": "Frecuencia (ej: Cada 8 horas)",
      "duration": "Duración (ej: 7 días)",
      "instructions": "Instrucciones especiales"
    }
  ],
  "generalInstructions": "Recomendaciones generales",
  "warnings": ["advertencias importantes"]
}`,

    lab_order: `Analiza la siguiente historia clínica y extrae SOLO los exámenes de laboratorio solicitados.

HISTORIA CLÍNICA:
- Diagnóstico: ${record.diagnosis || 'No especificado'}
- Ayudas diagnósticas: ${record.diagnostic_aids || 'No especificado'}
- Notas: ${record.notes || 'No especificado'}

Responde SOLO con un JSON válido:
{
  "tests": [
    {
      "name": "Nombre del examen",
      "type": "LABORATORIO",
      "urgency": "RUTINA o URGENTE",
      "instructions": "Instrucciones (ej: ayuno 8 horas)"
    }
  ],
  "clinicalIndication": "Indicación clínica para los exámenes"
}`,

    image_order: `Analiza la siguiente historia clínica y extrae SOLO los estudios de imagen solicitados.

HISTORIA CLÍNICA:
- Diagnóstico: ${record.diagnosis || 'No especificado'}
- Ayudas diagnósticas: ${record.diagnostic_aids || 'No especificado'}
- Notas: ${record.notes || 'No especificado'}

Responde SOLO con un JSON válido:
{
  "studies": [
    {
      "name": "Tipo de estudio (ej: Radiografía de tórax)",
      "bodyPart": "Parte del cuerpo",
      "urgency": "RUTINA o URGENTE",
      "specialInstructions": "Instrucciones"
    }
  ],
  "clinicalIndication": "Indicación clínica"
}`,

    certificate: `Genera un certificado médico básico basado en esta consulta.

HISTORIA CLÍNICA:
- Motivo: ${record.chief_complaint || 'No especificado'}
- Diagnóstico: ${record.diagnosis || 'No especificado'}

Responde SOLO con un JSON válido:
{
  "purpose": "Propósito del certificado",
  "findings": "Hallazgos relevantes",
  "conclusion": "Conclusión médica"
}`,

    referral: `Extrae información para remisión a especialista.

HISTORIA CLÍNICA:
- Diagnóstico: ${record.diagnosis || 'No especificado'}
- Plan: ${record.treatment_plan || 'No especificado'}

Responde SOLO con un JSON válido:
{
  "specialty": "Especialidad requerida",
  "reason": "Motivo de remisión",
  "urgency": "RUTINA o URGENTE",
  "clinicalSummary": "Resumen clínico"
}`,

    disability: `Determina incapacidad médica si aplica.

HISTORIA CLÍNICA:
- Diagnóstico: ${record.diagnosis || 'No especificado'}
- Tratamiento: ${record.treatment || 'No especificado'}

Responde SOLO con un JSON válido:
{
  "days": 0,
  "diagnosis": "Diagnóstico CIE-10",
  "justification": "Justificación médica",
  "restrictions": ["restricciones"]
}`
  };

  let prompt = prompts[documentType] || prompts.certificate;
  
  // Add custom template fields to prompt if provided
  if (customTemplate && customTemplate.custom_fields && customTemplate.custom_fields.length > 0) {
    const customFieldsDesc = customTemplate.custom_fields
      .map((f: any) => `- ${f.label} (${f.type})${f.required ? ' [REQUERIDO]' : ''}`)
      .join('\n');
    
    prompt += `\n\nCAMPOS PERSONALIZADOS ADICIONALES:\n${customFieldsDesc}\n\nIncluye estos campos adicionales en el JSON bajo una clave "customFields" con valores apropiados basados en la historia clínica.`;
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'system', 
          content: 'Eres un asistente médico experto en documentos clínicos colombianos. Responde SOLO con JSON válido, sin texto adicional.' 
        },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Error en IA: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Error parsing AI response:', content);
    return { error: 'No se pudo generar el documento', rawContent: content };
  }
}