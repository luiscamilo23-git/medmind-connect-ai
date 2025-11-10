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
  appointment_date: string;
  patients: {
    full_name: string;
    phone: string;
    email: string | null;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Fetch appointments for tomorrow that haven't been reminded yet
    const { data: appointments, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        id,
        title,
        appointment_date,
        patients (
          full_name,
          phone,
          email
        )
      `)
      .gte("appointment_date", tomorrow.toISOString())
      .lt("appointment_date", dayAfter.toISOString())
      .eq("reminder_sent", false)
      .in("status", ["scheduled", "confirmed"]);

    if (fetchError) throw fetchError;

    console.log(`Found ${appointments?.length || 0} appointments to remind`);

    const results = [];
    
    for (const appointment of appointments || []) {
      const apt = appointment as unknown as Appointment;
      
      // Format appointment time
      const aptDate = new Date(apt.appointment_date);
      const timeStr = aptDate.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dateStr = aptDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Create reminder message
      const message = `Recordatorio: Tiene una cita programada para mañana ${dateStr} a las ${timeStr}. Motivo: ${apt.title}. Por favor confirme su asistencia.`;

      console.log(`Reminder for ${apt.patients.full_name}: ${message}`);

      // Mark reminder as sent
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ reminder_sent: true })
        .eq("id", apt.id);

      if (updateError) {
        console.error(`Error updating appointment ${apt.id}:`, updateError);
      }

      results.push({
        appointmentId: apt.id,
        patientName: apt.patients.full_name,
        phone: apt.patients.phone,
        message: message,
        sent: !updateError,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        remindersSent: results.length,
        results: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending reminders:", error);
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
