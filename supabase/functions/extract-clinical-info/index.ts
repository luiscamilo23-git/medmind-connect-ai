import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Specialty-specific field mappings
const SPECIALTY_FIELDS: Record<string, string[]> = {
  MEDICO_GENERAL: ['ros', 'physical_exam', 'risk_classification', 'referrals', 'disability_days'],
  PEDIATRIA: ['gestational_age', 'growth_development', 'vaccination_scheme', 'weight_percentile', 'height_percentile', 'head_circumference', 'legal_guardian', 'perinatal_history', 'feeding_type'],
  GINECOLOGIA: ['gesta', 'para', 'abortos', 'cesareas', 'fum', 'menstrual_cycle', 'contraceptive_method', 'prenatal_control', 'gestational_weeks', 'cytology', 'mammography'],
  MEDICINA_INTERNA: ['chronic_pathologies', 'clinical_scales', 'deep_clinical_analysis', 'longitudinal_followup', 'comorbidities', 'hospitalization_history'],
  PSIQUIATRIA: ['mental_state_exam', 'diagnostic_scales', 'suicide_risk', 'emotional_followup', 'therapy_type', 'psychotropic_medications'],
  CIRUGIA: ['surgical_diagnosis', 'procedure', 'surgical_risks', 'surgical_consent', 'postop_evolution', 'anesthesia_type', 'surgical_time', 'bleeding'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, specialty = 'MEDICO_GENERAL' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get specialty-specific fields
    const specialtyFields = SPECIALTY_FIELDS[specialty] || SPECIALTY_FIELDS['MEDICO_GENERAL'];
    
    const specialtyContext = getSpecialtyContext(specialty);

    const systemPrompt = `Eres un asistente médico experto en el sistema de salud colombiano, especializado en ${specialtyContext.name}. Tu tarea es analizar transcripciones de consultas médicas y extraer información estructurada para llenar una historia clínica completa según la normativa colombiana (Resolución 1995/1999).

ESPECIALIDAD ACTIVA: ${specialtyContext.name}
${specialtyContext.description}

CONTEXTO MÉDICO COLOMBIANO:
- Las historias clínicas deben cumplir con la normativa del Ministerio de Salud de Colombia
- Los diagnósticos deben asociarse con códigos CIE-10 cuando sea posible
- Los medicamentos deben incluir nombre genérico, dosis, vía y frecuencia

EXTRAE LA SIGUIENTE INFORMACIÓN (solo lo que esté EXPLÍCITAMENTE mencionado):

1. **IDENTIFICACIÓN**: Nombre completo del paciente, documento de identidad
2. **MOTIVO DE CONSULTA**: Síntoma o queja principal en palabras del paciente
3. **ENFERMEDAD ACTUAL**: Historia cronológica detallada del padecimiento actual
4. **REVISIÓN POR SISTEMAS (ROS)**: Síntomas por sistemas (cardiovascular, respiratorio, digestivo, etc.)
5. **ANTECEDENTES**: 
   - Personales patológicos (enfermedades previas)
   - Quirúrgicos (cirugías previas)
   - Farmacológicos (medicamentos actuales)
   - Alérgicos
   - Familiares
6. **SIGNOS VITALES**: Extrae TODOS los signos vitales mencionados:
   - Presión arterial / tensión arterial (ej: 120/80)
   - Frecuencia cardíaca / pulso (ej: 72 lpm)
   - Frecuencia respiratoria (ej: 16 rpm)
   - Temperatura (ej: 36.5°C)
   - Saturación de oxígeno / SpO2 (ej: 98%)
   - Peso (ej: 70 kg)
   - Talla / altura (ej: 170 cm)
7. **EXAMEN FÍSICO**: Hallazgos del examen físico organizado por sistemas
8. **AYUDAS DIAGNÓSTICAS**: Resultados de laboratorios, imágenes u otros estudios
9. **DIAGNÓSTICO**: Impresión diagnóstica con código CIE-10 si es posible
10. **PLAN DE TRATAMIENTO**: Medicamentos, procedimientos, interconsultas
11. **EDUCACIÓN**: Recomendaciones y educación al paciente
12. **SEGUIMIENTO**: Plan de control y seguimiento

${specialtyContext.additionalInstructions}

REGLAS CRÍTICAS:
- NUNCA inventes información que no esté en la transcripción
- Si algo no se menciona, déjalo VACÍO (no pongas "No se menciona" o similar)
- Sé PRECISO en la extracción, respeta las palabras exactas cuando sea posible
- Para CIE-10, sugiere el código más probable basado en el diagnóstico mencionado
- SIEMPRE extrae signos vitales si se mencionan, incluso parcialmente`;

    // Build specialty fields schema dynamically
    const specialtyFieldsSchema: Record<string, any> = {};
    for (const field of specialtyFields) {
      specialtyFieldsSchema[field] = { 
        type: "string", 
        description: getFieldDescription(field, specialty) 
      };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analiza esta transcripción de consulta médica de ${specialtyContext.name} y extrae la información clínica estructurada:\n\n${transcript}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_clinical_data",
              description: `Extrae información estructurada de la transcripción médica para ${specialtyContext.name} según normativa colombiana`,
              parameters: {
                type: "object",
                properties: {
                  patientName: { type: "string", description: "Nombre completo del paciente" },
                  patientIdentification: { type: "string", description: "Número de identificación (CC, TI, etc.)" },
                  chiefComplaint: { type: "string", description: "Motivo principal de consulta en palabras del paciente" },
                  currentIllness: { type: "string", description: "Historia detallada cronológica de la enfermedad actual" },
                  ros: { type: "string", description: "Revisión por sistemas - síntomas por aparatos" },
                  medicalHistory: { type: "string", description: "Antecedentes: personales, quirúrgicos, familiares, alérgicos, farmacológicos" },
                  vitalSigns: {
                    type: "object",
                    description: "Signos vitales extraídos de la transcripción",
                    properties: {
                      blood_pressure: { type: "string", description: "Presión arterial (ej: 120/80 mmHg)" },
                      heart_rate: { type: "string", description: "Frecuencia cardíaca (ej: 72 lpm)" },
                      respiratory_rate: { type: "string", description: "Frecuencia respiratoria (ej: 16 rpm)" },
                      temperature: { type: "string", description: "Temperatura corporal (ej: 36.5°C)" },
                      spo2: { type: "string", description: "Saturación de oxígeno (ej: 98%)" },
                      weight: { type: "string", description: "Peso corporal (ej: 70 kg)" },
                      height: { type: "string", description: "Talla (ej: 170 cm)" }
                    }
                  },
                  physicalExam: { type: "string", description: "Hallazgos del examen físico por sistemas" },
                  diagnosticAids: { type: "string", description: "Resultados de laboratorios, imágenes u otros estudios" },
                  diagnosis: { type: "string", description: "Diagnóstico o impresión diagnóstica" },
                  cie10Code: { type: "string", description: "Código CIE-10 correspondiente al diagnóstico" },
                  treatment: { type: "string", description: "Plan de tratamiento: medicamentos con dosis, procedimientos" },
                  medications: { 
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de medicamentos con nombre, dosis, vía y frecuencia"
                  },
                  education: { type: "string", description: "Educación y recomendaciones al paciente" },
                  followup: { type: "string", description: "Plan de seguimiento y control" },
                  specialtyFields: {
                    type: "object",
                    description: `Campos específicos para ${specialtyContext.name}`,
                    properties: specialtyFieldsSchema
                  }
                },
                required: [],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_clinical_data" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de uso de IA excedido. Intenta en unos minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No se recibió respuesta estructurada de la IA");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    // Clean empty strings - don't include fields that are empty
    const cleanedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(extractedData)) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'string' && value.trim() === '') continue;
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Clean nested objects (like vitalSigns, specialtyFields)
          const cleanedNested: Record<string, any> = {};
          for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, any>)) {
            if (nestedValue && (typeof nestedValue !== 'string' || nestedValue.trim() !== '')) {
              cleanedNested[nestedKey] = nestedValue;
            }
          }
          if (Object.keys(cleanedNested).length > 0) {
            cleanedData[key] = cleanedNested;
          }
        } else {
          cleanedData[key] = value;
        }
      }
    }

    console.log(`Extracted clinical data for ${specialty}:`, Object.keys(cleanedData).length, "fields");
    if (cleanedData.vitalSigns) {
      console.log("Vital signs extracted:", Object.keys(cleanedData.vitalSigns));
    }
    if (cleanedData.specialtyFields) {
      console.log("Specialty fields extracted:", Object.keys(cleanedData.specialtyFields));
    }

    return new Response(JSON.stringify({ extractedData: cleanedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in extract-clinical-info:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getSpecialtyContext(specialty: string): { name: string; description: string; additionalInstructions: string } {
  const contexts: Record<string, { name: string; description: string; additionalInstructions: string }> = {
    MEDICO_GENERAL: {
      name: "Médico General",
      description: "Atención primaria y medicina familiar. Enfoque integral del paciente.",
      additionalInstructions: `
CAMPOS ESPECÍFICOS DE MÉDICO GENERAL:
- Revisión por sistemas completa
- Examen físico general
- Clasificación de riesgo (bajo, medio, alto, muy alto)
- Remisiones a especialistas
- Días de incapacidad si aplica`
    },
    PEDIATRIA: {
      name: "Pediatría",
      description: "Atención médica de niños y adolescentes. Enfoque en crecimiento y desarrollo.",
      additionalInstructions: `
CAMPOS ESPECÍFICOS DE PEDIATRÍA:
- Edad gestacional al nacer
- Control de crecimiento y desarrollo
- Esquema de vacunación
- Percentiles de peso y talla
- Perímetro cefálico
- Datos del acompañante legal
- Antecedentes perinatales
- Tipo de alimentación (lactancia, fórmula, complementaria)`
    },
    GINECOLOGIA: {
      name: "Ginecología / Obstetricia",
      description: "Salud femenina, embarazo y sistema reproductivo.",
      additionalInstructions: `
CAMPOS ESPECÍFICOS DE GINECOLOGÍA:
- Gesta (número de embarazos)
- Para (número de partos)
- Abortos
- Cesáreas
- FUM (Fecha Última Menstruación)
- Características del ciclo menstrual
- Método anticonceptivo actual
- Control prenatal si aplica
- Semanas de gestación si aplica
- Citología
- Mamografía`
    },
    MEDICINA_INTERNA: {
      name: "Medicina Interna",
      description: "Enfermedades de adultos y patologías complejas crónicas.",
      additionalInstructions: `
CAMPOS ESPECÍFICOS DE MEDICINA INTERNA:
- Patologías crónicas
- Escalas clínicas utilizadas (NYHA, CHA2DS2-VASc, etc.)
- Análisis clínico profundo
- Seguimiento longitudinal
- Comorbilidades
- Hospitalizaciones previas`
    },
    PSIQUIATRIA: {
      name: "Psiquiatría / Psicología Clínica",
      description: "Salud mental y trastornos psiquiátricos.",
      additionalInstructions: `
CAMPOS ESPECÍFICOS DE PSIQUIATRÍA:
- Examen del estado mental
- Escalas diagnósticas (Hamilton, Beck, MMSE, etc.)
- Evaluación de riesgo suicida (ninguno, bajo, moderado, alto, inminente)
- Seguimiento emocional
- Tipo de terapia (cognitivo-conductual, psicodinámica, etc.)
- Medicamentos psicotrópicos`
    },
    CIRUGIA: {
      name: "Cirugía",
      description: "Procedimientos quirúrgicos y atención perioperatoria.",
      additionalInstructions: `
CAMPOS ESPECÍFICOS DE CIRUGÍA:
- Diagnóstico quirúrgico
- Descripción del procedimiento
- Riesgos quirúrgicos identificados
- Consentimiento quirúrgico
- Evolución postoperatoria
- Tipo de anestesia
- Tiempo quirúrgico
- Sangrado estimado`
    }
  };
  
  return contexts[specialty] || contexts['MEDICO_GENERAL'];
}

function getFieldDescription(field: string, specialty: string): string {
  const descriptions: Record<string, string> = {
    // Médico General
    ros: "Revisión por sistemas completa",
    physical_exam: "Examen físico general por aparatos",
    risk_classification: "Clasificación de riesgo cardiovascular",
    referrals: "Remisiones a especialistas",
    disability_days: "Días de incapacidad médica",
    
    // Pediatría
    gestational_age: "Edad gestacional al nacer",
    growth_development: "Control de crecimiento y desarrollo",
    vaccination_scheme: "Esquema de vacunación actualizado",
    weight_percentile: "Percentil de peso",
    height_percentile: "Percentil de talla",
    head_circumference: "Perímetro cefálico",
    legal_guardian: "Nombre del acompañante legal",
    perinatal_history: "Antecedentes perinatales",
    feeding_type: "Tipo de alimentación actual",
    
    // Ginecología
    gesta: "Número total de embarazos",
    para: "Número de partos",
    abortos: "Número de abortos",
    cesareas: "Número de cesáreas",
    fum: "Fecha de última menstruación",
    menstrual_cycle: "Características del ciclo menstrual",
    contraceptive_method: "Método anticonceptivo actual",
    prenatal_control: "Datos del control prenatal",
    gestational_weeks: "Semanas de gestación",
    cytology: "Resultado de citología",
    mammography: "Resultado de mamografía",
    
    // Medicina Interna
    chronic_pathologies: "Patologías crónicas diagnosticadas",
    clinical_scales: "Escalas clínicas aplicadas",
    deep_clinical_analysis: "Análisis clínico profundo",
    longitudinal_followup: "Plan de seguimiento longitudinal",
    comorbidities: "Comorbilidades presentes",
    hospitalization_history: "Historial de hospitalizaciones",
    
    // Psiquiatría
    mental_state_exam: "Examen del estado mental",
    diagnostic_scales: "Escalas diagnósticas aplicadas",
    suicide_risk: "Evaluación de riesgo suicida",
    emotional_followup: "Plan de seguimiento emocional",
    therapy_type: "Tipo de terapia indicada",
    psychotropic_medications: "Medicamentos psicotrópicos",
    
    // Cirugía
    surgical_diagnosis: "Diagnóstico quirúrgico",
    procedure: "Descripción del procedimiento",
    surgical_risks: "Riesgos quirúrgicos",
    surgical_consent: "Consentimiento quirúrgico",
    postop_evolution: "Evolución postoperatoria",
    anesthesia_type: "Tipo de anestesia",
    surgical_time: "Tiempo quirúrgico",
    bleeding: "Sangrado estimado"
  };
  
  return descriptions[field] || field;
}