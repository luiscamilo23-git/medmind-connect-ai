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

    console.log('Generating document for record:', medicalRecordId, 'type:', documentType);

    // Obtener registro médico con información del paciente
    const { data: record, error: recordError } = await supabaseClient
      .from('medical_records')
      .select(`
        *,
        patients (
          full_name,
          date_of_birth,
          allergies,
          phone,
          email
        )
      `)
      .eq('id', medicalRecordId)
      .maybeSingle();

    if (recordError) {
      console.error('Error fetching medical record:', recordError);
      return new Response(JSON.stringify({ error: `Error al obtener historia: ${recordError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!record) {
      console.error('Medical record not found:', medicalRecordId);
      return new Response(JSON.stringify({ error: 'Historia clínica no encontrada. Verifica que esté guardada.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Medical record found:', record.id, 'Patient:', record.patients?.full_name);

    // Get custom template if provided
    let customTemplate = null;
    if (templateId) {
      const { data: template } = await supabaseClient
        .from('document_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();
      
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
  const patientInfo = `
INFORMACIÓN DEL PACIENTE:
- Nombre: ${record.patients?.full_name || 'No especificado'}
- Identificación: ${record.patient_identification || 'No especificado'}
- Edad/Fecha Nacimiento: ${record.patients?.date_of_birth || 'No especificado'}
- Alergias: ${record.patients?.allergies?.join(', ') || 'No registradas'}
`;

  // Incluir la transcripción original si existe - ES CLAVE para que la IA extraiga los datos exactos
  const transcriptContext = record.voice_transcript 
    ? `\n\nTRANSCRIPCIÓN ORIGINAL DE LA CONSULTA (usa esta información como fuente principal):\n"""${record.voice_transcript}"""\n`
    : '';

  const medicalContext = `
HISTORIA CLÍNICA ESTRUCTURADA:
- Motivo de consulta: ${record.chief_complaint || 'No especificado'}
- Enfermedad actual: ${record.current_illness || 'No especificado'}
- Diagnóstico: ${record.diagnosis || 'No especificado'}
- Código CIE-10: ${record.cie10_code || 'No especificado'}
- Examen físico: ${record.physical_exam || 'No especificado'}
- Plan de tratamiento: ${record.treatment || 'No especificado'}
- Medicamentos: ${record.medications?.join(', ') || 'No especificados'}
- Ayudas diagnósticas: ${record.diagnostic_aids || 'No especificado'}
- Educación: ${record.education || 'No especificado'}
- Seguimiento: ${record.followup || 'No especificado'}
`;

  const prompts: Record<string, string> = {
    prescription: `Genera una FÓRMULA MÉDICA profesional completa.

INSTRUCCIÓN CRÍTICA: Extrae TODOS los medicamentos que el médico mencionó en la transcripción o historia. Incluye dosis, frecuencia y duración EXACTAMENTE como fueron dictados.

${patientInfo}
${transcriptContext}
${medicalContext}

Genera un JSON con esta estructura exacta:
{
  "medications": [
    {
      "name": "Nombre del medicamento (genérico y/o comercial)",
      "presentation": "Presentación (tabletas 500mg, jarabe 5ml, etc)",
      "dose": "Dosis exacta como la dictó el médico",
      "frequency": "Frecuencia exacta (cada 8 horas, 2 veces al día, etc)",
      "duration": "Duración exacta (7 días, 2 semanas, etc)",
      "route": "Vía de administración",
      "instructions": "Instrucciones especiales (con alimentos, antes de dormir, etc)"
    }
  ],
  "generalInstructions": "Recomendaciones generales del médico",
  "warnings": ["Advertencias mencionadas"],
  "followUpDate": "Fecha de control si se mencionó"
}`,

    lab_order: `Genera una ORDEN DE LABORATORIO profesional.

INSTRUCCIÓN CRÍTICA: Extrae TODOS los exámenes de laboratorio que el médico solicitó en la transcripción. Incluye los nombres exactos de los exámenes.

${patientInfo}
${transcriptContext}
${medicalContext}

Genera un JSON profesional:
{
  "tests": [
    {
      "name": "Nombre exacto del examen solicitado",
      "code": "Código CUPS si aplica",
      "type": "LABORATORIO CLÍNICO",
      "urgency": "RUTINA o URGENTE",
      "specialInstructions": "Preparación requerida",
      "expectedUse": "Para qué se solicita"
    }
  ],
  "clinicalIndication": "Indicación clínica que justifica los exámenes",
  "relevantHistory": "Antecedentes relevantes",
  "urgency": "Nivel de urgencia general"
}`,

    image_order: `Genera una ORDEN DE IMÁGENES DIAGNÓSTICAS profesional.

INSTRUCCIÓN CRÍTICA: Extrae TODOS los estudios de imagen que el médico solicitó en la transcripción (radiografías, ecografías, TAC, resonancia, etc).

${patientInfo}
${transcriptContext}
${medicalContext}

Genera un JSON profesional:
{
  "studies": [
    {
      "name": "Nombre exacto del estudio solicitado",
      "code": "Código CUPS si aplica",
      "modality": "Modalidad (Rayos X, TAC, RMN, Ecografía, etc)",
      "bodyPart": "Región anatómica",
      "projection": "Proyecciones requeridas",
      "contrast": "Con/sin contraste",
      "urgency": "RUTINA o URGENTE",
      "specialInstructions": "Preparación necesaria",
      "clinicalQuestion": "Pregunta clínica a resolver"
    }
  ],
  "clinicalIndication": "Indicación clínica detallada",
  "relevantFindings": "Hallazgos que motivan el estudio",
  "urgency": "Nivel de urgencia"
}`,

    certificate: `Genera un CERTIFICADO MÉDICO profesional.

INSTRUCCIÓN CRÍTICA: Usa la información de la consulta para generar un certificado apropiado según el propósito mencionado.

${patientInfo}
${transcriptContext}
${medicalContext}

Genera un JSON profesional:
{
  "purpose": "Propósito del certificado (trabajo, estudios, deporte, etc)",
  "consultationDate": "${new Date().toISOString().split('T')[0]}",
  "findings": "Hallazgos relevantes de la evaluación",
  "diagnosis": "Diagnóstico con CIE-10",
  "currentCondition": "Estado de salud actual",
  "limitations": "Limitaciones si aplican",
  "recommendations": "Recomendaciones médicas",
  "conclusion": "Conclusión médica formal",
  "validity": "Validez del certificado"
}`,

    referral: `Genera una REMISIÓN MÉDICA profesional.

INSTRUCCIÓN CRÍTICA: Extrae la especialidad a la que se remite y el motivo EXACTO mencionado en la consulta.

${patientInfo}
${transcriptContext}
${medicalContext}

Genera un JSON profesional:
{
  "specialty": "Especialidad a la que se remite (la que mencionó el médico)",
  "subspecialty": "Subespecialidad si aplica",
  "reason": "Motivo exacto de la remisión como lo explicó el médico",
  "urgency": "RUTINA, PREFERENTE o URGENTE",
  "clinicalSummary": "Resumen clínico del caso",
  "relevantHistory": "Antecedentes relevantes",
  "currentTreatment": "Tratamiento actual",
  "diagnosticTests": "Exámenes realizados",
  "specificQuestions": "Preguntas para el especialista",
  "requestedActions": "Acciones solicitadas"
}`,

    disability: `Genera un CERTIFICADO DE INCAPACIDAD MÉDICA profesional.

INSTRUCCIÓN CRÍTICA: Extrae los DÍAS DE INCAPACIDAD y las FECHAS exactas que el médico mencionó en la consulta. Si dijo "5 días de incapacidad" o "incapacidad del 8 al 12 de enero", usa esos datos exactos.

${patientInfo}
${transcriptContext}
${medicalContext}

La fecha de hoy es: ${new Date().toISOString().split('T')[0]}

Genera un JSON profesional y legal:
{
  "startDate": "Fecha de inicio (la que mencionó el médico o fecha de hoy si no especificó)",
  "days": número_de_días_de_incapacidad,
  "endDate": "Fecha de finalización calculada",
  "diagnosis": "Diagnóstico que justifica la incapacidad",
  "cie10Code": "Código CIE-10",
  "type": "Tipo de incapacidad (enfermedad general, accidente laboral, etc)",
  "justification": "Justificación médica detallada basada en lo que dijo el médico",
  "severity": "Gravedad y limitaciones funcionales",
  "restrictions": ["Lista de restricciones y actividades que no puede realizar"],
  "treatment": "Tratamiento durante la incapacidad",
  "prognosis": "Pronóstico esperado",
  "requiresExtension": "Si es probable extensión",
  "workLimitations": "Limitaciones laborales específicas"
}`,
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
          content: `Eres un médico colombiano experto en documentación clínica. Tu tarea es generar documentos médicos profesionales y completos.

REGLAS CRÍTICAS:
1. USA LA TRANSCRIPCIÓN ORIGINAL como fuente principal de información - contiene lo que el médico dictó
2. Extrae datos EXACTOS: medicamentos, dosis, días de incapacidad, exámenes, etc.
3. Si el médico dijo "5 días de incapacidad", pon 5 días, no inventes otro número
4. Si el médico recetó Acetaminofén 500mg cada 8 horas por 5 días, esos son los datos exactos
5. Responde SOLO con JSON válido estructurado, sin texto adicional` 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2, // Baja temperatura para mayor precisión
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Límite de uso de IA excedido');
    }
    if (response.status === 402) {
      throw new Error('Créditos de IA agotados');
    }
    throw new Error(`Error en IA: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  
  try {
    // Extraer JSON si viene envuelto en markdown
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonString.trim());
  } catch (e) {
    console.error('Error parsing AI response:', content);
    return { error: 'No se pudo generar el documento', rawContent: content };
  }
}