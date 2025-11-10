import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  appointment_date: string;
  patients: {
    full_name: string;
  };
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { date, doctorId } = await req.json();

    // Fetch appointments for the specified date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id,
        title,
        description,
        notes,
        appointment_date,
        patients (
          full_name
        )
      `)
      .eq("doctor_id", doctorId)
      .gte("appointment_date", startDate.toISOString())
      .lte("appointment_date", endDate.toISOString())
      .in("status", ["completed", "confirmed"]);

    if (appointmentsError) throw appointmentsError;

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Fetch available inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from("inventory")
      .select("id, name, category, current_stock")
      .eq("doctor_id", doctorId);

    if (inventoryError) throw inventoryError;

    // Prepare prompt for AI
    const appointmentsText = (appointments as unknown as Appointment[])
      .map(apt => `
Paciente: ${apt.patients.full_name}
Tipo de consulta: ${apt.title}
${apt.description ? `Descripción: ${apt.description}` : ''}
${apt.notes ? `Notas: ${apt.notes}` : ''}
---`)
      .join('\n');

    const inventoryText = (inventory as unknown as InventoryItem[])
      .map(item => `- ${item.name} (${item.category}) [ID: ${item.id}] - Stock actual: ${item.current_stock}`)
      .join('\n');

    const prompt = `Eres un asistente médico experto. Analiza las siguientes citas realizadas hoy y sugiere qué inventario médico probablemente se usó en cada una.

CITAS DEL DÍA:
${appointmentsText}

INVENTARIO DISPONIBLE:
${inventoryText}

Responde SOLAMENTE con un array JSON (sin texto adicional) con las sugerencias de uso de inventario. Cada sugerencia debe tener:
- inventory_id: ID del item usado
- inventory_name: nombre del item
- quantity_used: cantidad estimada usada (número)
- appointment_id: ID de la cita
- patient_name: nombre del paciente
- reason: breve explicación de por qué se usó este item (máximo 100 caracteres)

Considera:
- Guantes y material desechable se usan en casi todas las consultas
- Medicamentos específicos según el tipo de consulta
- Equipos especializados según procedimientos
- Cantidades realistas (ej: 2-4 guantes por consulta, no 50)

Formato:
[
  {
    "inventory_id": "uuid",
    "inventory_name": "nombre",
    "quantity_used": número,
    "appointment_id": "uuid",
    "patient_name": "nombre",
    "reason": "explicación corta"
  }
]`;

    console.log("Calling AI with appointments:", appointments.length);

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Eres un asistente médico experto que analiza citas y sugiere uso de inventario. Responde SOLO con JSON válido, sin texto adicional."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de tasa excedido. Por favor intenta más tarde." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor recarga tu cuenta." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log("AI response:", aiContent);

    // Parse AI response
    let suggestions = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(aiContent);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      console.error("AI content:", aiContent);
      throw new Error("No se pudo procesar la respuesta de IA");
    }

    // Validate suggestions against current stock
    const validatedSuggestions = suggestions.filter((suggestion: any) => {
      const item = inventory?.find((i: any) => i.id === suggestion.inventory_id);
      if (!item) return false;
      if (item.current_stock < suggestion.quantity_used) {
        console.warn(`Insufficient stock for ${item.name}: ${item.current_stock} < ${suggestion.quantity_used}`);
        return false;
      }
      return true;
    });

    return new Response(
      JSON.stringify({ 
        suggestions: validatedSuggestions,
        total_appointments: appointments.length,
        total_suggestions: validatedSuggestions.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in analyze-inventory-usage:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
