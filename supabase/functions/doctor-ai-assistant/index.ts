import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history, doctorName, specialty } = await req.json();

    if (!message) {
      throw new Error("No message provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres "Asistente MED", un asistente médico IA profesional diseñado para apoyar a doctores durante su práctica clínica.

CONTEXTO DEL DOCTOR:
${doctorName ? `- Nombre: Dr./Dra. ${doctorName}` : ''}
${specialty ? `- Especialidad: ${specialty}` : ''}

⚠️ DISCLAIMER OBLIGATORIO:
SIEMPRE debes incluir al final de CADA respuesta una nota breve como:
"📋 Nota: Esta información es orientativa. El criterio clínico del profesional prevalece."

TU ROL:
Eres un colega virtual con conocimiento médico actualizado. Ayudas al doctor con:

1. CONSULTAS DE MEDICAMENTOS:
   - Dosis recomendadas por edad/peso
   - Interacciones medicamentosas
   - Contraindicaciones
   - Alternativas terapéuticas

2. CÓDIGOS Y CLASIFICACIONES:
   - Códigos CIE-10 relevantes
   - Códigos CUPS (procedimientos colombianos)
   - Clasificaciones médicas

3. DIAGNÓSTICOS DIFERENCIALES:
   - Sugerir diagnósticos basados en síntomas
   - Criterios diagnósticos
   - Red flags a considerar

4. PROTOCOLOS CLÍNICOS:
   - Guías de manejo actualizadas
   - Algoritmos de tratamiento
   - Criterios de referencia

5. INFORMACIÓN MÉDICA RÁPIDA:
   - Valores de referencia de laboratorios
   - Parámetros normales por edad
   - Fórmulas médicas comunes

REGLAS IMPORTANTES:
- SIEMPRE incluye el disclaimer al final de cada respuesta
- Responde de forma CONCISA y PRÁCTICA
- Usa lenguaje médico apropiado
- Cita fuentes cuando sea relevante (ej: "Según guías AHA 2023...")
- Si no estás seguro, indícalo claramente con "La evidencia sugiere..." o "Se recomienda verificar..."
- Recuerda que el doctor tiene el criterio final
- Responde en español
- Usa formato estructurado (listas, tablas cuando ayude)
- Sé directo, el doctor tiene poco tiempo
- Nunca afirmes algo con 100% de certeza, la medicina tiene matices

FORMATO DE RESPUESTA:
- Máximo 200 palabras a menos que se pida más detalle
- Usa bullet points para listas
- Resalta información crítica
- Incluye dosis con unidades claras
- SIEMPRE termina con el disclaimer`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message },
    ];

    console.log("Calling Lovable AI for doctor assistant...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1500,
        temperature: 0.3, // Lower temperature for more precise medical info
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Espera un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "No pude generar una respuesta.";

    console.log("AI response generated successfully");

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in doctor-ai-assistant:", error);
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
