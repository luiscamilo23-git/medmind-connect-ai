import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();
    
    if (!transcript) {
      throw new Error('No transcript provided');
    }

    console.log('Generating medical record from transcript...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Eres un asistente médico especializado en organizar consultas médicas transcritas para cumplir con las normas colombianas de historia clínica (Resolución 1995/1999).

TAREA: Analiza esta transcripción LITERAL de una consulta médica y organízala en una historia clínica profesional completa.

CONTEXTO CRÍTICO:
- La transcripción contiene diálogo entre MÉDICO y PACIENTE
- Extrae TODA la información disponible para completar los campos requeridos
- Si un campo NO está mencionado, déjalo como cadena vacía o array vacío según corresponda

CAMPOS REQUERIDOS:

1. IDENTIFICACIÓN DEL PACIENTE: Nombre, edad, sexo, documento (si se mencionan)
2. MOTIVO DE CONSULTA: Razón principal en palabras del paciente
3. ENFERMEDAD ACTUAL: Descripción detallada del cuadro clínico
4. REVISIÓN POR SISTEMAS (ROS): Síntomas por aparatos (cardiovascular, respiratorio, digestivo, etc.)
5. ANTECEDENTES: Personales, familiares, quirúrgicos, alergias, medicamentos
6. SIGNOS VITALES: TA, FC, FR, Temp, SpO2, peso, talla (si se mencionan)
7. EXAMEN FÍSICO: Hallazgos al examen (si se realiza)
8. AYUDAS DIAGNÓSTICAS: Laboratorios, imágenes solicitadas o revisadas
9. DIAGNÓSTICO: Impresión diagnóstica con código CIE-10 si es posible
10. PLAN: Tratamiento (medicamentos), educación al paciente, seguimiento
11. CONSENTIMIENTO: Si el paciente acepta el tratamiento
12. NOTAS DE EVOLUCIÓN: Formato SOAP si aplica

RESPONDE CON ESTE JSON:
{
  "patient_identification": "Identificación completa del paciente",
  "chief_complaint": "Motivo de consulta en palabras del paciente",
  "current_illness": "Descripción completa de la enfermedad actual",
  "ros": "Revisión por sistemas - síntomas por aparatos",
  "medical_history": "Antecedentes médicos, quirúrgicos, familiares, alergias",
  "vital_signs": {
    "blood_pressure": "",
    "heart_rate": "",
    "respiratory_rate": "",
    "temperature": "",
    "spo2": "",
    "weight": "",
    "height": ""
  },
  "physical_exam": "Hallazgos del examen físico",
  "diagnostic_aids": "Laboratorios, imágenes u otras ayudas diagnósticas",
  "diagnosis": "Impresión diagnóstica",
  "cie10_code": "Código CIE-10 si es identificable",
  "treatment": "Plan de tratamiento farmacológico",
  "education": "Educación e indicaciones al paciente",
  "followup": "Plan de seguimiento",
  "medications": ["medicamento 1 - dosis - vía - frecuencia", "medicamento 2..."],
  "consent": "Consentimiento del paciente para el tratamiento",
  "evolution_notes": "Notas de evolución en formato SOAP si aplica",
  "notes": "Otras observaciones o información relevante"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analiza y organiza esta transcripción literal de consulta médica:

TRANSCRIPCIÓN COMPLETA:
${transcript}

Genera la historia clínica en formato JSON identificando claramente quién dice qué (médico vs paciente) y extrayendo la información médica relevante.` }
        ],
        temperature: 0.3, // Balance entre precisión y comprensión contextual
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de uso excedido. Por favor intenta más tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos agotados. Por favor agrega fondos en Settings.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log('Generated text:', generatedText);

    // Parse the JSON from the AI response
    let medicalRecord: any;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = generatedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : generatedText;
      medicalRecord = JSON.parse(jsonString.trim());

      // --- Normalización defensiva ---
      // A veces el modelo pone los signos vitales dentro de "physical_exam".
      // Si vital_signs viene vacío, extraemos métricas comunes de manera determinística.
      const ensureVitalSigns = () => {
        const vs = (medicalRecord?.vital_signs && typeof medicalRecord.vital_signs === 'object')
          ? medicalRecord.vital_signs
          : {
              blood_pressure: "",
              heart_rate: "",
              respiratory_rate: "",
              temperature: "",
              spo2: "",
              weight: "",
              height: "",
            };

        // Normaliza claves ausentes
        vs.blood_pressure = vs.blood_pressure ?? "";
        vs.heart_rate = vs.heart_rate ?? "";
        vs.respiratory_rate = vs.respiratory_rate ?? "";
        vs.temperature = vs.temperature ?? "";
        vs.spo2 = vs.spo2 ?? "";
        vs.weight = vs.weight ?? "";
        vs.height = vs.height ?? "";

        medicalRecord.vital_signs = vs;
        return vs;
      };

      const isEmpty = (v: unknown) => typeof v !== 'string' || v.trim() === '';
      const vs = ensureVitalSigns();

      const physicalExamText = typeof medicalRecord?.physical_exam === 'string'
        ? medicalRecord.physical_exam
        : '';

      const vitalSignsAllEmpty = [
        vs.blood_pressure,
        vs.heart_rate,
        vs.respiratory_rate,
        vs.temperature,
        vs.spo2,
        vs.weight,
        vs.height,
      ].every(isEmpty);

      if (vitalSignsAllEmpty && physicalExamText) {
        const removals: string[] = [];

        const tryMatch = (re: RegExp) => {
          const m = physicalExamText.match(re);
          if (!m) return null;
          removals.push(m[0]);
          return m;
        };

        const bp = tryMatch(/(Presi[oó]n\s*Arterial|TA)\s*[:\-]?\s*([0-9]{2,3}\/[0-9]{2,3})\s*mmHg/iu);
        if (bp && isEmpty(vs.blood_pressure)) vs.blood_pressure = `${bp[2]} mmHg`;

        const hr = tryMatch(/(Pulso|FC|Frecuencia\s*Card[ií]aca)\s*[:\-]?\s*([0-9]{2,3})\s*(lpm|bpm)?/iu);
        if (hr && isEmpty(vs.heart_rate)) vs.heart_rate = `${hr[2]}${hr[3] ? ` ${hr[3]}` : ' lpm'}`;

        const spo2 = tryMatch(/(Saturaci[oó]n(?:\s*de\s*Ox[ií]geno)?|SpO2)\s*[:\-]?\s*([0-9]{2,3})\s*%/iu);
        if (spo2 && isEmpty(vs.spo2)) vs.spo2 = `${spo2[2]}%`;

        const temp = tryMatch(/(Temperatura|Temp)\s*[:\-]?\s*([0-9]{2}(?:[\.,][0-9])?)\s*°?\s*C/iu);
        if (temp && isEmpty(vs.temperature)) vs.temperature = `${temp[2].replace(',', '.')} °C`;

        const rr = tryMatch(/(Frecuencia\s*Respiratoria|FR)\s*[:\-]?\s*([0-9]{1,3})\s*(rpm)?/iu);
        if (rr && isEmpty(vs.respiratory_rate)) vs.respiratory_rate = `${rr[2]}${rr[3] ? ` ${rr[3]}` : ' rpm'}`;

        const wt = tryMatch(/(Peso)\s*[:\-]?\s*([0-9]{2,3}(?:[\.,][0-9])?)\s*kg/iu);
        if (wt && isEmpty(vs.weight)) vs.weight = `${wt[2].replace(',', '.')} kg`;

        const ht = tryMatch(/(Talla|Altura)\s*[:\-]?\s*([0-9]{1,3}(?:[\.,][0-9])?)\s*(cm|m)/iu);
        if (ht && isEmpty(vs.height)) vs.height = `${ht[2].replace(',', '.')} ${ht[3]}`;

        // Limpia "physical_exam" quitando el bloque de signos vitales si venían al inicio.
        let cleaned = physicalExamText;
        for (const r of removals) cleaned = cleaned.replace(r, '');
        cleaned = cleaned
          .replace(/^\s*[,;-]+\s*/u, '')
          .replace(/\s{2,}/g, ' ')
          .trim();

        // Solo reemplazar si realmente quedó algo distinto
        if (cleaned && cleaned !== physicalExamText) {
          medicalRecord.physical_exam = cleaned;
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', generatedText);
      throw new Error('Failed to parse medical record. Please try again.');
    }

    console.log('Successfully generated medical record');

    return new Response(
      JSON.stringify({ medicalRecord }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-medical-record:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});