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

  const prompts: Record<string, string> = {
    prescription: `Genera una FÓRMULA MÉDICA profesional completa basada en esta historia clínica.

${patientInfo}

HISTORIA CLÍNICA:
- Diagnóstico: ${record.diagnosis || 'No especificado'}
- Código CIE-10: ${record.cie10_code || 'No especificado'}
- Plan de tratamiento: ${record.treatment || 'No especificado'}
- Medicamentos mencionados: ${record.medications?.join(', ') || 'No especificado'}
- Educación: ${record.education || 'No especificado'}

Genera un JSON con esta estructura exacta:
{
  "medications": [
    {
      "name": "Nombre genérico y comercial completo del medicamento",
      "presentation": "Presentación (tabletas, jarabe, etc)",
      "dose": "Dosis exacta (ej: 500mg, 5ml)",
      "frequency": "Frecuencia completa (ej: Cada 8 horas, 3 veces al día)",
      "duration": "Duración del tratamiento (ej: 7 días, 2 semanas)",
      "route": "Vía de administración (oral, intramuscular, tópica)",
      "instructions": "Instrucciones detalladas (con alimentos, ayuno, antes de dormir, etc)"
    }
  ],
  "generalInstructions": "Recomendaciones generales detalladas sobre el tratamiento",
  "warnings": ["Advertencias importantes específicas"],
  "followUpDate": "Fecha sugerida de control"
}`,

    lab_order: `Genera una ORDEN DE LABORATORIO profesional detallada.

${patientInfo}

HISTORIA CLÍNICA:
- Motivo de consulta: ${record.chief_complaint || 'No especificado'}
- Diagnóstico: ${record.diagnosis || 'No especificado'}
- CIE-10: ${record.cie10_code || 'No especificado'}
- Ayudas diagnósticas solicitadas: ${record.diagnostic_aids || 'No especificado'}
- Enfermedad actual: ${record.current_illness || 'No especificado'}

Genera un JSON profesional:
{
  "tests": [
    {
      "name": "Nombre completo del examen de laboratorio",
      "code": "Código CUPS si aplica",
      "type": "LABORATORIO CLÍNICO",
      "urgency": "RUTINA o URGENTE con justificación",
      "specialInstructions": "Preparación requerida (ayuno, hora específica, medicamentos a suspender)",
      "expectedUse": "Para qué se solicita este examen"
    }
  ],
  "clinicalIndication": "Indicación clínica completa y detallada que justifica los exámenes",
  "relevantHistory": "Antecedentes relevantes para interpretación de resultados",
  "urgency": "Nivel de urgencia general de la orden"
}`,

    image_order: `Genera una ORDEN DE IMÁGENES DIAGNÓSTICAS profesional completa.

${patientInfo}

HISTORIA CLÍNICA:
- Motivo: ${record.chief_complaint || 'No especificado'}
- Diagnóstico: ${record.diagnosis || 'No especificado'}
- CIE-10: ${record.cie10_code || 'No especificado'}
- Examen físico: ${record.physical_exam || 'No especificado'}
- Ayudas diagnósticas: ${record.diagnostic_aids || 'No especificado'}

Genera un JSON profesional:
{
  "studies": [
    {
      "name": "Nombre completo del estudio (ej: Radiografía simple de tórax PA y lateral)",
      "code": "Código CUPS si aplica",
      "modality": "Modalidad (Rayos X, TAC, RMN, Ecografía, etc)",
      "bodyPart": "Región anatómica específica",
      "projection": "Proyecciones o secuencias requeridas",
      "contrast": "Con/sin contraste y tipo",
      "urgency": "RUTINA o URGENTE",
      "specialInstructions": "Preparación necesaria",
      "clinicalQuestion": "Pregunta clínica específica a resolver"
    }
  ],
  "clinicalIndication": "Indicación clínica detallada que justifica los estudios",
  "relevantFindings": "Hallazgos al examen físico que motivan el estudio",
  "urgency": "Nivel de urgencia y justificación"
}`,

    certificate: `Genera un CERTIFICADO MÉDICO profesional oficial.

${patientInfo}

HISTORIA CLÍNICA:
- Motivo de consulta: ${record.chief_complaint || 'No especificado'}
- Diagnóstico: ${record.diagnosis || 'No especificado'}
- CIE-10: ${record.cie10_code || 'No especificado'}
- Examen físico: ${record.physical_exam || 'No especificado'}
- Tratamiento: ${record.treatment || 'No especificado'}

Genera un JSON profesional:
{
  "purpose": "Propósito específico del certificado (trabajo, estudios, deporte, etc)",
  "consultationDate": "Fecha de la consulta",
  "findings": "Hallazgos relevantes encontrados en la evaluación médica",
  "diagnosis": "Diagnóstico completo con CIE-10",
  "currentCondition": "Estado de salud actual del paciente",
  "limitations": "Limitaciones o restricciones si aplican",
  "recommendations": "Recomendaciones médicas específicas",
  "conclusion": "Conclusión médica formal y profesional",
  "validity": "Validez del certificado (tiempo)"
}`,

    referral: `Genera una REMISIÓN MÉDICA profesional a especialista.

${patientInfo}

HISTORIA CLÍNICA:
- Motivo: ${record.chief_complaint || 'No especificado'}
- Enfermedad actual: ${record.current_illness || 'No especificado'}
- Diagnóstico: ${record.diagnosis || 'No especificado'}
- CIE-10: ${record.cie10_code || 'No especificado'}
- Examen físico: ${record.physical_exam || 'No especificado'}
- Ayudas diagnósticas: ${record.diagnostic_aids || 'No especificado'}
- Plan: ${record.treatment_plan || record.treatment || 'No especificado'}

Genera un JSON profesional:
{
  "specialty": "Especialidad médica específica requerida",
  "subspecialty": "Subespecialidad si es necesaria",
  "reason": "Motivo detallado de la remisión",
  "urgency": "RUTINA, PREFERENTE o URGENTE con justificación",
  "clinicalSummary": "Resumen clínico completo del caso",
  "relevantHistory": "Antecedentes relevantes para el especialista",
  "currentTreatment": "Tratamiento actual que recibe el paciente",
  "diagnosticTests": "Exámenes realizados y resultados relevantes",
  "specificQuestions": "Preguntas específicas para el especialista",
  "requestedActions": "Acciones específicas solicitadas al especialista"
}`,

    disability: `Genera un CERTIFICADO DE INCAPACIDAD MÉDICA profesional.

${patientInfo}

HISTORIA CLÍNICA:
- Diagnóstico: ${record.diagnosis || 'No especificado'}
- CIE-10: ${record.cie10_code || 'No especificado'}
- Enfermedad actual: ${record.current_illness || 'No especificado'}
- Tratamiento: ${record.treatment || 'No especificado'}
- Examen físico: ${record.physical_exam || 'No especificado'}

Genera un JSON profesional y legal:
{
  "startDate": "Fecha de inicio de incapacidad",
  "days": "Número de días de incapacidad (número)",
  "endDate": "Fecha de finalización calculada",
  "diagnosis": "Diagnóstico completo que justifica la incapacidad",
  "cie10Code": "Código CIE-10",
  "type": "Tipo de incapacidad (enfermedad general, accidente de trabajo, etc)",
  "justification": "Justificación médica detallada de la incapacidad",
  "severity": "Gravedad y limitaciones funcionales",
  "restrictions": ["Lista detallada de restricciones y actividades que no puede realizar"],
  "treatment": "Tratamiento prescrito durante la incapacidad",
  "prognosis": "Pronóstico y evolución esperada",
  "requiresExtension": "Si es probable que requiera extensión y por qué",
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
          content: 'Eres un médico colombiano experto en documentación clínica. Generas documentos médicos profesionales, completos y conformes a las normas colombianas. Responde SOLO con JSON válido estructurado, sin texto adicional antes o después.' 
        },
        { role: 'user', content: prompt }
      ],
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
    return JSON.parse(content);
  } catch (e) {
    console.error('Error parsing AI response:', content);
    return { error: 'No se pudo generar el documento', rawContent: content };
  }
}