import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analyticsData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un analista experto en gestión médica y optimización de consultorios. 
Analiza los datos proporcionados y genera insights accionables y recomendaciones específicas para mejorar la operación del consultorio.
Enfócate en:
- Identificar patrones y tendencias
- Sugerir mejoras operativas concretas
- Destacar oportunidades de ahorro y aumento de ingresos
- Identificar riesgos o áreas de atención
- Proporcionar recomendaciones priorizadas

Responde en español con un tono profesional pero amigable.`;

    const prompt = `Analiza los siguientes datos del consultorio médico y proporciona insights detallados:

MÉTRICAS ACTUALES:
- Total de pacientes: ${analyticsData.totalPatients}
- Citas este mes: ${analyticsData.appointmentsThisMonth}
- Citas completadas: ${analyticsData.completedAppointments}
- Tasa de cancelación: ${analyticsData.cancellationRate}%
- Historias clínicas generadas: ${analyticsData.medicalRecords}
- Items de inventario: ${analyticsData.inventoryItems}
- Items con stock bajo: ${analyticsData.lowStockItems}

TENDENCIAS:
${analyticsData.trends ? JSON.stringify(analyticsData.trends, null, 2) : 'No disponibles'}

Proporciona:
1. 3-5 insights clave sobre el rendimiento actual
2. 3-5 recomendaciones priorizadas para mejorar
3. Identificación de oportunidades de crecimiento
4. Alertas sobre áreas de riesgo

Sé específico, cuantifica cuando sea posible, y proporciona acciones concretas.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating insights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
