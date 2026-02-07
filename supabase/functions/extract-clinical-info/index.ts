import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DRUG_INTERACTIONS: Record<string, { interactsWith: string[]; severity: string; description: string; recommendation: string }> = {
  'warfarina': { interactsWith: ['aspirina', 'ibuprofeno'], severity: 'severe', description: 'Aumenta riesgo de sangrado', recommendation: 'Monitorear INR' },
  'metformina': { interactsWith: ['contraste yodado'], severity: 'moderate', description: 'Riesgo de acidosis láctica', recommendation: 'Suspender 48h antes' },
  'enalapril': { interactsWith: ['espironolactona', 'potasio'], severity: 'moderate', description: 'Riesgo de hiperkalemia', recommendation: 'Monitorear potasio' },
  'simvastatina': { interactsWith: ['gemfibrozilo'], severity: 'severe', description: 'Riesgo de rabdomiólisis', recommendation: 'Evitar combinación' },
  'fluoxetina': { interactsWith: ['tramadol'], severity: 'severe', description: 'Síndrome serotoninérgico', recommendation: 'Contraindicado' },
};

const VITAL_RANGES = {
  systolic: { min: 90, max: 139, criticalLow: 80, criticalHigh: 180 },
  diastolic: { min: 60, max: 89, criticalLow: 50, criticalHigh: 120 },
  heart_rate: { min: 60, max: 100, criticalLow: 40, criticalHigh: 150 },
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

    const systemPrompt = `Eres un asistente médico experto. Extrae información clínica estructurada de transcripciones.

INSTRUCCIONES:
1. EDAD: Busca "X años", "tengo X"
2. SEXO: Infiere del nombre si no se menciona (Juan→masculino, María→femenino)
3. ACOMPAÑANTE: Busca "viene con", "lo trae", "acompañado por"
4. ROS por sistemas: cardiovascular, respiratorio, digestivo, etc.
5. SIGNOS VITALES: presión, FC, FR, temperatura, SpO2
6. DIAGNÓSTICO: Captura exactamente lo que dice el doctor

REGLAS:
- NO inventes información
- Si dice "ninguno/niega", extrae ese valor
- Separa ROS por sistemas corporales`;

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
          { role: "user", content: `Analiza esta transcripción médica:\n\n${transcript}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_clinical_data",
            description: "Extrae información clínica estructurada",
            parameters: {
              type: "object",
              properties: {
                patientName: { type: "string" },
                patientIdentification: { type: "string" },
                patientAge: { type: "string" },
                patientSex: { type: "string", enum: ["masculino", "femenino"] },
                patientPhone: { type: "string" },
                hasCompanion: { type: "string", enum: ["si", "no"] },
                companionName: { type: "string" },
                companionRelationship: { type: "string" },
                companionPhone: { type: "string" },
                chiefComplaint: { type: "string" },
                currentIllness: { type: "string" },
                rosStructured: {
                  type: "object",
                  properties: {
                    ros_general: { type: "string" },
                    ros_cardiovascular: { type: "string" },
                    ros_respiratorio: { type: "string" },
                    ros_digestivo: { type: "string" },
                    ros_genitourinario: { type: "string" },
                    ros_musculoesqueletico: { type: "string" },
                    ros_neurologico: { type: "string" },
                    ros_piel: { type: "string" },
                    ros_endocrino: { type: "string" },
                    ros_psiquiatrico: { type: "string" }
                  }
                },
                ros: { type: "string" },
                medicalHistory: { type: "string" },
                personalHistory: { type: "string" },
                familyHistory: { type: "string" },
                currentMedications: { type: "string" },
                allergies: { type: "string" },
                vitalSigns: {
                  type: "object",
                  properties: {
                    blood_pressure: { type: "string" },
                    heart_rate: { type: "string" },
                    respiratory_rate: { type: "string" },
                    temperature: { type: "string" },
                    spo2: { type: "string" },
                    weight: { type: "string" },
                    height: { type: "string" }
                  }
                },
                physicalExam: { type: "string" },
                diagnosticAids: { type: "string" },
                diagnosis: { type: "string" },
                cie10Code: { type: "string" },
                treatment: { type: "string" },
                treatmentPlan: { type: "string" },
                medications: { type: "array", items: { type: "string" } },
                education: { type: "string" },
                followup: { type: "string" }
              }
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_clinical_data" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de uso excedido" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) throw new Error("No se recibió respuesta estructurada");

    const extractedData = JSON.parse(toolCall.function.arguments);

    // Clean empty values
    const cleanedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(extractedData)) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'string' && value.trim() === '') continue;
        if (Array.isArray(value) && value.length === 0) continue;
        if (typeof value === 'object' && !Array.isArray(value)) {
          const nested: Record<string, any> = {};
          for (const [k, v] of Object.entries(value as Record<string, any>)) {
            if (v && (typeof v !== 'string' || v.trim() !== '')) nested[k] = v;
          }
          if (Object.keys(nested).length > 0) cleanedData[key] = nested;
        } else {
          cleanedData[key] = value;
        }
      }
    }

    const vitalSignAlerts = processVitalSigns(cleanedData.vitalSigns);
    const drugInteractions = checkDrugInteractions(cleanedData.medications || [], cleanedData.currentMedications || '');

    console.log(`Extracted ${Object.keys(cleanedData).length} fields for ${specialty}`);

    return new Response(JSON.stringify({ 
      extractedData: cleanedData,
      clinicalAlerts: { vitalSignAlerts, drugInteractions, cie10Suggestions: [], labResults: [] }
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

function processVitalSigns(vs: any): any[] {
  if (!vs) return [];
  const alerts: any[] = [];
  
  if (vs.blood_pressure) {
    const m = vs.blood_pressure.match(/(\d+)\s*[\/\\]\s*(\d+)/);
    if (m) {
      const sys = parseInt(m[1]), dia = parseInt(m[2]);
      let status: 'normal'|'warning'|'critical' = 'normal', msg = 'Normal';
      if (sys >= 180 || dia >= 120) { status = 'critical'; msg = '⚠️ CRISIS HIPERTENSIVA'; }
      else if (sys <= 80 || dia <= 50) { status = 'critical'; msg = '⚠️ HIPOTENSIÓN SEVERA'; }
      else if (sys > 139 || dia > 89) { status = 'warning'; msg = 'Hipertensión'; }
      alerts.push({ parameter: 'Presión Arterial', value: vs.blood_pressure, status, message: msg });
    }
  }
  
  if (vs.heart_rate) {
    const m = vs.heart_rate.match(/(\d+)/);
    if (m) {
      const hr = parseInt(m[1]);
      let status: 'normal'|'warning'|'critical' = 'normal', msg = 'Normal';
      if (hr >= 150 || hr <= 40) { status = 'critical'; msg = hr >= 150 ? '⚠️ TAQUICARDIA SEVERA' : '⚠️ BRADICARDIA SEVERA'; }
      else if (hr > 100 || hr < 60) { status = 'warning'; msg = hr > 100 ? 'Taquicardia' : 'Bradicardia'; }
      alerts.push({ parameter: 'FC', value: vs.heart_rate, status, message: msg });
    }
  }
  
  if (vs.spo2) {
    const m = vs.spo2.match(/(\d+)/);
    if (m) {
      const v = parseInt(m[1]);
      let status: 'normal'|'warning'|'critical' = 'normal', msg = 'Normal';
      if (v < 90) { status = 'critical'; msg = '⚠️ HIPOXEMIA SEVERA'; }
      else if (v < 95) { status = 'warning'; msg = 'Hipoxemia leve'; }
      alerts.push({ parameter: 'SpO2', value: vs.spo2, status, message: msg });
    }
  }
  
  return alerts;
}

function checkDrugInteractions(meds: string[], currentMeds: string): any[] {
  const interactions: any[] = [];
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-záéíóúñ]/g, '');
  const all = [...meds.map(normalize), ...currentMeds.split(/[,;\/\n]/).map(normalize)].filter(m => m.length > 2);
  
  for (const med of all) {
    for (const [drug, data] of Object.entries(DRUG_INTERACTIONS)) {
      if (med.includes(drug)) {
        for (const inter of data.interactsWith) {
          if (all.some(m => m.includes(inter)) && !interactions.some(i => i.drug1.includes(drug) && i.drug2.includes(inter))) {
            interactions.push({ drug1: drug, drug2: inter, severity: data.severity, description: data.description, recommendation: data.recommendation });
          }
        }
      }
    }
  }
  return interactions;
}
