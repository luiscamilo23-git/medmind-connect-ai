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

// Common drug interactions database (simplified)
const DRUG_INTERACTIONS: Record<string, { interactsWith: string[]; severity: string; description: string; recommendation: string }> = {
  'warfarina': { 
    interactsWith: ['aspirina', 'ibuprofeno', 'naproxeno', 'omeprazol'],
    severity: 'severe',
    description: 'Aumenta riesgo de sangrado',
    recommendation: 'Monitorear INR frecuentemente o considerar alternativa'
  },
  'metformina': {
    interactsWith: ['contraste yodado', 'alcohol'],
    severity: 'moderate',
    description: 'Riesgo de acidosis láctica',
    recommendation: 'Suspender 48h antes de contraste, evitar alcohol excesivo'
  },
  'enalapril': {
    interactsWith: ['espironolactona', 'potasio', 'losartán'],
    severity: 'moderate', 
    description: 'Riesgo de hiperkalemia',
    recommendation: 'Monitorear niveles de potasio sérico'
  },
  'simvastatina': {
    interactsWith: ['gemfibrozilo', 'eritromicina', 'claritromicina'],
    severity: 'severe',
    description: 'Riesgo de rabdomiólisis',
    recommendation: 'Evitar combinación o usar alternativa'
  },
  'fluoxetina': {
    interactsWith: ['tramadol', 'imao', 'triptanes'],
    severity: 'severe',
    description: 'Riesgo de síndrome serotoninérgico',
    recommendation: 'Contraindicado, usar alternativa'
  },
  'clopidogrel': {
    interactsWith: ['omeprazol', 'esomeprazol'],
    severity: 'moderate',
    description: 'Reduce efecto antiagregante',
    recommendation: 'Usar pantoprazol como alternativa'
  },
  'amiodarona': {
    interactsWith: ['digoxina', 'warfarina', 'simvastatina'],
    severity: 'severe',
    description: 'Múltiples interacciones significativas',
    recommendation: 'Reducir dosis de medicamentos asociados'
  },
};

// Vital signs normal ranges
const VITAL_RANGES = {
  systolic: { min: 90, max: 139, criticalLow: 80, criticalHigh: 180 },
  diastolic: { min: 60, max: 89, criticalLow: 50, criticalHigh: 120 },
  heart_rate: { min: 60, max: 100, criticalLow: 40, criticalHigh: 150 },
  respiratory_rate: { min: 12, max: 20, criticalLow: 8, criticalHigh: 30 },
  temperature: { min: 36.0, max: 37.5, criticalLow: 35.0, criticalHigh: 39.5 },
  spo2: { min: 95, max: 100, criticalLow: 90, criticalHigh: 101 },
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

    const systemPrompt = `Eres un asistente médico experto en el sistema de salud colombiano, especializado en ${specialtyContext.name}. Tu tarea es analizar transcripciones de consultas médicas y extraer TODA la información estructurada.

ESPECIALIDAD ACTIVA: ${specialtyContext.name}
${specialtyContext.description}

INSTRUCCIONES CRÍTICAS DE EXTRACCIÓN - LEE CON CUIDADO:

1. **EDAD**: Busca patrones como "X años", "tengo X", "tiene X años", "de X años de edad". Ejemplo: "tengo 17 años" → "17 años"

2. **SEXO**: Busca "masculino", "femenino", "hombre", "mujer", "sexo masculino/femenino". Normaliza SIEMPRE a "masculino" o "femenino"

3. **TELÉFONO**: Busca secuencias numéricas que sean teléfonos. Ejemplo: "el teléfono es 321" → "321"

4. **ANTECEDENTES**: Busca TODOS los tipos:
   - Personales: "antecedentes personales", "padece de", "tiene diagnóstico de"
   - Familiares: "antecedentes familiares", "en la familia hay"
   - Medicamentos: "medicamentos actuales", "toma", "actualmente usa"
   - Alergias: "alergia", "alérgico a", "ninguna alergia", "niega alergias"
   Si dice "ninguno" o "niega", extrae ese valor explícitamente.

5. **SIGNOS VITALES**: Extrae TODOS los mencionados:
   - Presión: "120/80", "TA 120 82", "presión arterial", "tensión arterial"
   - FC: "frecuencia de 71", "pulso", "frecuencia cardíaca"
   - FR: "frecuencia respiratoria 16", "respiraciones"
   - Temperatura: "temperatura es 35", "temp"
   - SPO2: "saturación", "SPO2", "oximetría"
   - Peso/Talla: "peso", "talla", "altura"

6. **CÓDIGO CIE-10**: Proporciona MÚLTIPLES códigos posibles con nivel de confianza:
   - Si se menciona explícitamente un código, ponlo con 100% confianza
   - Si hay diagnóstico claro, sugiere el código apropiado con 85-95% confianza
   - Si hay síntomas pero diagnóstico no definido, sugiere códigos probables con 60-80% confianza

7. **PLAN DE MANEJO**: Busca "plan de manejo", "tratamiento", "indicaciones", "seguir", "continuar", "formular". Extrae TODO lo mencionado.

8. **RESULTADOS DE LABORATORIO**: Extrae CUALQUIER resultado de laboratorio mencionado:
   - Hemoglobina, glucemia, creatinina, colesterol, triglicéridos, TSH, etc.
   - Incluye el valor y unidades si se mencionan
   - Marca si está alterado según contexto

${specialtyContext.additionalInstructions}

REGLAS:
- NUNCA inventes información que no esté en la transcripción
- Si algo se menciona como "ninguno", "no tiene", "niega", extrae ese valor
- Sé PRECISO, respeta las palabras exactas cuando sea posible`;


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
                  patientAge: { type: "string", description: "Edad del paciente. Busca 'X años', 'tengo X', 'tiene X años'. Ejemplo: '17 años'" },
                  patientSex: { type: "string", enum: ["masculino", "femenino"], description: "Sexo del paciente. Normaliza a 'masculino' o 'femenino'" },
                  patientPhone: { type: "string", description: "Teléfono del paciente" },
                  patientAddress: { type: "string", description: "Dirección del paciente" },
                  chiefComplaint: { type: "string", description: "Motivo principal de consulta en palabras del paciente" },
                  currentIllness: { type: "string", description: "Historia detallada cronológica de la enfermedad actual" },
                  ros: { type: "string", description: "Revisión por sistemas - síntomas por aparatos" },
                  medicalHistory: { type: "string", description: "Antecedentes generales" },
                  personalHistory: { type: "string", description: "Antecedentes personales patológicos. Si dice 'ninguno', extrae 'Ninguno'" },
                  familyHistory: { type: "string", description: "Antecedentes familiares. Si dice 'ninguno', extrae 'Ninguno'" },
                  currentMedications: { type: "string", description: "Medicamentos actuales. Si dice 'ninguno', extrae 'Ninguno'" },
                  allergies: { type: "string", description: "Alergias. Si dice 'ninguna', extrae 'Ninguna conocida'" },
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
                  cie10Codes: { 
                    type: "array",
                    description: "Lista de códigos CIE-10 sugeridos con nivel de confianza",
                    items: {
                      type: "object",
                      properties: {
                        code: { type: "string", description: "Código CIE-10" },
                        description: { type: "string", description: "Descripción del diagnóstico" },
                        confidence: { type: "number", description: "Nivel de confianza 0-100" }
                      }
                    }
                  },
                  treatment: { type: "string", description: "Plan de tratamiento: medicamentos con dosis, procedimientos" },
                  treatmentPlan: { type: "string", description: "Plan de manejo completo incluyendo indicaciones, seguimiento" },
                  medications: { 
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de medicamentos con nombre, dosis, vía y frecuencia"
                  },
                  labResults: {
                    type: "array",
                    description: "Resultados de laboratorio mencionados en la consulta",
                    items: {
                      type: "object",
                      properties: {
                        testName: { type: "string", description: "Nombre del examen" },
                        value: { type: "string", description: "Valor del resultado" },
                        unit: { type: "string", description: "Unidad de medida" },
                        status: { type: "string", enum: ["normal", "abnormal"], description: "Si está alterado o normal" }
                      }
                    }
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
        if (Array.isArray(value) && value.length === 0) continue;
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

    // Process vital signs alerts
    const vitalSignAlerts = processVitalSigns(cleanedData.vitalSigns);
    
    // Process drug interactions
    const drugInteractions = checkDrugInteractions(cleanedData.medications || [], cleanedData.currentMedications || '');
    
    // Process CIE-10 suggestions (ensure backward compatibility)
    if (cleanedData.cie10Codes && cleanedData.cie10Codes.length > 0) {
      cleanedData.cie10Suggestions = cleanedData.cie10Codes;
      // Set the first high-confidence code as default
      const topCode = cleanedData.cie10Codes[0];
      if (topCode && topCode.confidence >= 80) {
        cleanedData.cie10Code = topCode.code;
      }
    }

    console.log(`Extracted clinical data for ${specialty}:`, Object.keys(cleanedData).length, "fields");
    if (cleanedData.vitalSigns) {
      console.log("Vital signs extracted:", Object.keys(cleanedData.vitalSigns));
    }
    if (cleanedData.specialtyFields) {
      console.log("Specialty fields extracted:", Object.keys(cleanedData.specialtyFields));
    }
    if (vitalSignAlerts.length > 0) {
      console.log("Vital sign alerts:", vitalSignAlerts.length);
    }
    if (drugInteractions.length > 0) {
      console.log("Drug interactions detected:", drugInteractions.length);
    }

    return new Response(JSON.stringify({ 
      extractedData: cleanedData,
      clinicalAlerts: {
        vitalSignAlerts,
        drugInteractions,
        cie10Suggestions: cleanedData.cie10Suggestions || [],
        labResults: cleanedData.labResults || []
      }
    }), {
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

function processVitalSigns(vitalSigns: any): any[] {
  if (!vitalSigns) return [];
  
  const alerts: any[] = [];
  
  // Blood pressure
  if (vitalSigns.blood_pressure) {
    const bpMatch = vitalSigns.blood_pressure.match(/(\d+)\s*[\/\\]\s*(\d+)/);
    if (bpMatch) {
      const systolic = parseInt(bpMatch[1]);
      const diastolic = parseInt(bpMatch[2]);
      
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      let message = 'Presión arterial normal';
      
      if (systolic >= VITAL_RANGES.systolic.criticalHigh || diastolic >= VITAL_RANGES.diastolic.criticalHigh) {
        status = 'critical';
        message = '⚠️ CRISIS HIPERTENSIVA - Evaluar urgentemente';
      } else if (systolic <= VITAL_RANGES.systolic.criticalLow || diastolic <= VITAL_RANGES.diastolic.criticalLow) {
        status = 'critical';
        message = '⚠️ HIPOTENSIÓN SEVERA - Evaluar urgentemente';
      } else if (systolic > VITAL_RANGES.systolic.max || diastolic > VITAL_RANGES.diastolic.max) {
        status = 'warning';
        message = 'Hipertensión - Considerar tratamiento antihipertensivo';
      } else if (systolic < VITAL_RANGES.systolic.min || diastolic < VITAL_RANGES.diastolic.min) {
        status = 'warning';
        message = 'Hipotensión - Verificar estado de hidratación';
      }
      
      alerts.push({ parameter: 'Presión Arterial', value: vitalSigns.blood_pressure, status, message });
    }
  }
  
  // Heart rate
  if (vitalSigns.heart_rate) {
    const hrMatch = vitalSigns.heart_rate.match(/(\d+)/);
    if (hrMatch) {
      const hr = parseInt(hrMatch[1]);
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      let message = 'Frecuencia cardíaca normal';
      
      if (hr >= VITAL_RANGES.heart_rate.criticalHigh || hr <= VITAL_RANGES.heart_rate.criticalLow) {
        status = 'critical';
        message = hr >= VITAL_RANGES.heart_rate.criticalHigh ? 
          '⚠️ TAQUICARDIA SEVERA - ECG urgente' : 
          '⚠️ BRADICARDIA SEVERA - ECG urgente';
      } else if (hr > VITAL_RANGES.heart_rate.max) {
        status = 'warning';
        message = 'Taquicardia - Evaluar causa subyacente';
      } else if (hr < VITAL_RANGES.heart_rate.min) {
        status = 'warning';
        message = 'Bradicardia - Verificar medicación actual';
      }
      
      alerts.push({ parameter: 'Frecuencia Cardíaca', value: vitalSigns.heart_rate, status, message });
    }
  }
  
  // Temperature
  if (vitalSigns.temperature) {
    const tempMatch = vitalSigns.temperature.match(/([\d.]+)/);
    if (tempMatch) {
      const temp = parseFloat(tempMatch[1]);
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      let message = 'Temperatura normal';
      
      if (temp >= VITAL_RANGES.temperature.criticalHigh) {
        status = 'critical';
        message = '⚠️ FIEBRE ALTA - Medidas antipiréticas urgentes';
      } else if (temp <= VITAL_RANGES.temperature.criticalLow) {
        status = 'critical';
        message = '⚠️ HIPOTERMIA - Evaluar calentamiento activo';
      } else if (temp > VITAL_RANGES.temperature.max) {
        status = 'warning';
        message = 'Febrícula - Monitorear evolución';
      } else if (temp < VITAL_RANGES.temperature.min) {
        status = 'warning';
        message = 'Hipotermia leve - Verificar exposición';
      }
      
      alerts.push({ parameter: 'Temperatura', value: vitalSigns.temperature, status, message });
    }
  }
  
  // SpO2
  if (vitalSigns.spo2) {
    const spo2Match = vitalSigns.spo2.match(/(\d+)/);
    if (spo2Match) {
      const spo2 = parseInt(spo2Match[1]);
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      let message = 'Saturación de oxígeno normal';
      
      if (spo2 < VITAL_RANGES.spo2.criticalLow) {
        status = 'critical';
        message = '⚠️ HIPOXEMIA SEVERA - Oxígeno suplementario urgente';
      } else if (spo2 < VITAL_RANGES.spo2.min) {
        status = 'warning';
        message = 'Hipoxemia leve - Evaluar causa y considerar O2';
      }
      
      alerts.push({ parameter: 'Saturación O2', value: vitalSigns.spo2, status, message });
    }
  }
  
  // Respiratory rate
  if (vitalSigns.respiratory_rate) {
    const rrMatch = vitalSigns.respiratory_rate.match(/(\d+)/);
    if (rrMatch) {
      const rr = parseInt(rrMatch[1]);
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      let message = 'Frecuencia respiratoria normal';
      
      if (rr >= VITAL_RANGES.respiratory_rate.criticalHigh || rr <= VITAL_RANGES.respiratory_rate.criticalLow) {
        status = 'critical';
        message = rr >= VITAL_RANGES.respiratory_rate.criticalHigh ? 
          '⚠️ TAQUIPNEA SEVERA - Evaluar dificultad respiratoria' : 
          '⚠️ BRADIPNEA - Evaluar depresión respiratoria';
      } else if (rr > VITAL_RANGES.respiratory_rate.max) {
        status = 'warning';
        message = 'Taquipnea - Evaluar etiología';
      } else if (rr < VITAL_RANGES.respiratory_rate.min) {
        status = 'warning';
        message = 'Bradipnea - Verificar sedación/medicación';
      }
      
      alerts.push({ parameter: 'Frecuencia Respiratoria', value: vitalSigns.respiratory_rate, status, message });
    }
  }
  
  return alerts;
}

function checkDrugInteractions(prescribedMeds: string[], currentMedsString: string): any[] {
  const interactions: any[] = [];
  
  // Normalize medication names
  const normalize = (med: string) => med.toLowerCase().replace(/[^a-záéíóúñ]/g, '').trim();
  
  // Combine all medications
  const allMeds = [
    ...prescribedMeds.map(normalize),
    ...currentMedsString.toLowerCase().split(/[,;\/\n]/).map(m => normalize(m))
  ].filter(m => m.length > 2);
  
  // Check each medication against interaction database
  for (const med of allMeds) {
    for (const [drug, data] of Object.entries(DRUG_INTERACTIONS)) {
      if (med.includes(drug) || drug.includes(med)) {
        for (const interacting of data.interactsWith) {
          if (allMeds.some(m => m.includes(interacting) || interacting.includes(m))) {
            // Check if we already have this interaction
            const exists = interactions.some(i => 
              (i.drug1.includes(drug) && i.drug2.includes(interacting)) ||
              (i.drug2.includes(drug) && i.drug1.includes(interacting))
            );
            
            if (!exists) {
              interactions.push({
                drug1: drug.charAt(0).toUpperCase() + drug.slice(1),
                drug2: interacting.charAt(0).toUpperCase() + interacting.slice(1),
                severity: data.severity as 'low' | 'moderate' | 'severe',
                description: data.description,
                recommendation: data.recommendation
              });
            }
          }
        }
      }
    }
  }
  
  return interactions;
}

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