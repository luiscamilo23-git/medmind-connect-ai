import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Specialty-specific question templates
const SPECIALTY_QUESTIONS: Record<string, string[]> = {
  MEDICO_GENERAL: [
    "¿Ha tenido fiebre, escalofríos o sudoración nocturna?",
    "¿Tiene alguna alergia a medicamentos o alimentos?",
    "¿Cuántos días de incapacidad necesita?",
    "¿Necesita remisión a algún especialista?"
  ],
  PEDIATRIA: [
    "¿Cuál fue la edad gestacional al nacer?",
    "¿Cómo ha sido el desarrollo del niño?",
    "¿Tiene el esquema de vacunación al día?",
    "¿Cuál es el tipo de alimentación actual?",
    "¿Quién es el acompañante legal del menor?"
  ],
  GINECOLOGIA: [
    "¿Cuál es la fecha de última menstruación?",
    "¿Cuántos embarazos ha tenido? ¿Partos, cesáreas, abortos?",
    "¿Utiliza algún método anticonceptivo?",
    "¿Cuándo fue su última citología?",
    "¿Tiene control prenatal? ¿De cuántas semanas está?"
  ],
  MEDICINA_INTERNA: [
    "¿Qué patologías crónicas tiene diagnosticadas?",
    "¿Ha tenido hospitalizaciones previas?",
    "¿Qué medicamentos toma actualmente y en qué dosis?",
    "¿Qué comorbilidades presenta?",
    "¿Cuál es su clasificación funcional NYHA?"
  ],
  PSIQUIATRIA: [
    "¿Cómo está su estado de ánimo actualmente?",
    "¿Ha tenido pensamientos de hacerse daño o quitarse la vida?",
    "¿Está en terapia psicológica? ¿De qué tipo?",
    "¿Toma medicamentos psiquiátricos?",
    "¿Cómo es su sueño y apetito?"
  ],
  CIRUGIA: [
    "¿Qué procedimiento quirúrgico se realizará?",
    "¿Se explicaron los riesgos quirúrgicos al paciente?",
    "¿Firmó el consentimiento informado?",
    "¿Qué tipo de anestesia se utilizará?",
    "¿Cómo ha sido la evolución postoperatoria?"
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcript, specialty = 'MEDICO_GENERAL' } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from token
    const authHeader = req.headers.get('Authorization');
    let doctorId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      doctorId = user?.id;
    }
    
    if (!transcript || transcript.trim().length < 50) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing transcript for ${specialty}...`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get specialty context
    const specialtyContext = getSpecialtyContext(specialty);
    const specialtyQuestions = SPECIALTY_QUESTIONS[specialty] || SPECIALTY_QUESTIONS['MEDICO_GENERAL'];

    // Obtener historial de sugerencias del doctor para aprender patrones
    let historicalContext = '';
    if (doctorId) {
      const { data: history } = await supabase
        .from('suggestion_history')
        .select('question, suggested_count, used_count')
        .eq('doctor_id', doctorId)
        .eq('specialty', specialty)
        .order('suggested_count', { ascending: false })
        .limit(10);

      const { data: doctorQuestions } = await supabase
        .from('doctor_questions')
        .select('question_text, frequency')
        .eq('doctor_id', doctorId)
        .eq('specialty', specialty)
        .order('frequency', { ascending: false })
        .limit(10);

      if (history && history.length > 0) {
        historicalContext = '\n\nCONTEXTO DE APRENDIZAJE - Preguntas más sugeridas históricamente a este doctor:\n' +
          history.map(h => `- "${h.question}" (sugerida ${h.suggested_count} veces, usada ${h.used_count} veces)`).join('\n');
      }

      if (doctorQuestions && doctorQuestions.length > 0) {
        historicalContext += '\n\nPreguntas que este doctor hace frecuentemente:\n' +
          doctorQuestions.map(q => `- "${q.question_text}" (usada ${q.frequency} veces)`).join('\n');
      }
    }

    const systemPrompt = `Eres un asistente médico experto especializado en ${specialtyContext.name} dentro del sistema de salud colombiano. Tu tarea es analizar transcripciones de consultas médicas y sugerir preguntas que el doctor debería hacer para completar la historia clínica.

ESPECIALIDAD ACTIVA: ${specialtyContext.name}
${specialtyContext.description}

CONTEXTO: Sistema de salud colombiano (Resolución 1995/1999)

IMPORTANTE:
- NO modifiques la transcripción original
- SOLO analiza qué información CRÍTICA falta para esta especialidad
- Sugiere preguntas ESPECÍFICAS y ACCIONABLES acordes a ${specialtyContext.name}
- Máximo 4 sugerencias, priorizando información médica crítica
- APRENDE de los patrones históricos del doctor
- Usa lenguaje apropiado para ${specialtyContext.name}

INFORMACIÓN ESENCIAL para historia clínica de ${specialtyContext.name}:

1. **MOTIVO DE CONSULTA**
   - ¿Cuál es el síntoma principal?
   - ¿Hace cuánto tiempo lo presenta?

2. **ENFERMEDAD ACTUAL**
   - Tiempo de evolución exacto
   - Intensidad (escala 1-10 si aplica dolor)
   - Factores que mejoran/empeoran
   - Síntomas asociados
   - Tratamientos previos para este episodio

3. **ANTECEDENTES**
   - Enfermedades crónicas (HTA, DM, etc.)
   - Cirugías previas
   - Medicamentos actuales con dosis
   - Alergias (especialmente medicamentos)
   - Antecedentes familiares relevantes

4. **SIGNOS VITALES** (si es consulta presencial)
   - Tensión arterial
   - Frecuencia cardíaca
   - Temperatura
   - Peso

5. **EXAMEN FÍSICO**
   - Hallazgos pertinentes al motivo de consulta

${specialtyContext.additionalQuestions}

PREGUNTAS TÍPICAS DE ${specialtyContext.name.toUpperCase()}:
${specialtyQuestions.map(q => `- ${q}`).join('\n')}

${historicalContext}

FORMATO DE RESPUESTA (SOLO JSON):
{
  "suggestions": [
    {
      "question": "Pregunta específica que el doctor debería hacer según ${specialtyContext.name}",
      "reason": "Por qué es importante esta información para esta especialidad",
      "priority": "high/medium/low"
    }
  ]
}

PRIORIDADES:
- high: Crítico para diagnóstico o seguridad del paciente en ${specialtyContext.name}
- medium: Importante para completar la historia según la especialidad
- low: Complementario pero útil

RESPONDE SOLO con el objeto JSON.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Analiza esta transcripción de consulta de ${specialtyContext.name} y sugiere preguntas para completar la historia clínica:\n\n${transcript}\n\nResponde SOLO con el objeto JSON, sin bloques markdown.`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Límite de uso excedido.');
      }
      if (response.status === 402) {
        throw new Error('Créditos agotados.');
      }
      
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const result = await response.json();
    let content = result.choices[0].message.content;
    
    // Limpiar bloques de código markdown si existen
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse JSON response:', content);
      parsed = { suggestions: [] };
    }
    
    console.log(`Analysis complete for ${specialty}, suggestions:`, parsed.suggestions?.length || 0);

    // Guardar sugerencias en el historial para aprendizaje
    if (doctorId && parsed.suggestions && parsed.suggestions.length > 0) {
      for (const suggestion of parsed.suggestions) {
        // Buscar si la sugerencia ya existe
        const { data: existing } = await supabase
          .from('suggestion_history')
          .select('id, suggested_count')
          .eq('doctor_id', doctorId)
          .eq('question', suggestion.question)
          .single();

        if (existing) {
          // Actualizar contador
          await supabase
            .from('suggestion_history')
            .update({
              suggested_count: existing.suggested_count + 1,
              last_suggested_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          // Crear nueva entrada
          await supabase
            .from('suggestion_history')
            .insert({
              doctor_id: doctorId,
              specialty: specialty,
              question: suggestion.question,
              reason: suggestion.reason,
              priority: suggestion.priority,
              transcript_context: transcript.substring(0, 500)
            });
        }
      }
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-clinical-transcript:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getSpecialtyContext(specialty: string): { name: string; description: string; additionalQuestions: string } {
  const contexts: Record<string, { name: string; description: string; additionalQuestions: string }> = {
    MEDICO_GENERAL: {
      name: "Médico General",
      description: "Atención primaria y medicina familiar. Enfoque integral del paciente.",
      additionalQuestions: `
CAMPOS ESPECÍFICOS DE MÉDICO GENERAL:
- Revisión por sistemas completa
- Clasificación de riesgo
- Necesidad de remisiones
- Incapacidad médica si aplica`
    },
    PEDIATRIA: {
      name: "Pediatría",
      description: "Atención médica de niños y adolescentes. Enfoque en crecimiento y desarrollo.",
      additionalQuestions: `
CAMPOS ESPECÍFICOS DE PEDIATRÍA - PRIORIDAD ALTA:
- Edad gestacional al nacer
- Hitos del desarrollo (motor, lenguaje, social)
- Esquema de vacunación actualizado
- Tipo de alimentación (lactancia materna, fórmula, complementaria)
- Datos del acompañante legal
- Antecedentes perinatales (peso al nacer, complicaciones)
- Percentiles de crecimiento`
    },
    GINECOLOGIA: {
      name: "Ginecología / Obstetricia",
      description: "Salud femenina, embarazo y sistema reproductivo.",
      additionalQuestions: `
CAMPOS ESPECÍFICOS DE GINECOLOGÍA - PRIORIDAD ALTA:
- Fórmula obstétrica (G P A C)
- Fecha de última menstruación (FUM)
- Características del ciclo menstrual
- Método anticonceptivo
- Citología cervical
- Mamografía si aplica
- Si está embarazada: controles prenatales, semanas de gestación`
    },
    MEDICINA_INTERNA: {
      name: "Medicina Interna",
      description: "Enfermedades de adultos y patologías complejas crónicas.",
      additionalQuestions: `
CAMPOS ESPECÍFICOS DE MEDICINA INTERNA - PRIORIDAD ALTA:
- Patologías crónicas con tiempo de evolución
- Medicamentos actuales con dosis exactas
- Escalas clínicas (NYHA para ICC, CHA2DS2-VASc, etc.)
- Comorbilidades
- Hospitalizaciones previas y motivos
- Control metabólico (HbA1c, perfil lipídico)`
    },
    PSIQUIATRIA: {
      name: "Psiquiatría / Psicología Clínica",
      description: "Salud mental y trastornos psiquiátricos.",
      additionalQuestions: `
CAMPOS ESPECÍFICOS DE PSIQUIATRÍA - PRIORIDAD ALTA:
- Estado mental actual (orientación, afecto, pensamiento)
- Evaluación de riesgo suicida (ideación, plan, acceso a medios)
- Antecedentes psiquiátricos
- Tipo de terapia en curso
- Medicamentos psicotrópicos actuales con dosis
- Red de apoyo familiar/social
- Funcionamiento laboral/académico`
    },
    CIRUGIA: {
      name: "Cirugía",
      description: "Procedimientos quirúrgicos y atención perioperatoria.",
      additionalQuestions: `
CAMPOS ESPECÍFICOS DE CIRUGÍA - PRIORIDAD ALTA:
- Diagnóstico quirúrgico preciso
- Procedimiento planificado
- Riesgos quirúrgicos explicados
- Consentimiento informado firmado
- Ayuno preoperatorio
- Tipo de anestesia
- Estado postoperatorio si aplica`
    }
  };
  
  return contexts[specialty] || contexts['MEDICO_GENERAL'];
}