import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Twilio configuration - will be enabled when credentials are added
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
const TWILIO_ENABLED = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER;

async function sendTwilioMessage(to: string, message: string) {
  if (!TWILIO_ENABLED) {
    console.log(`Twilio not configured. Would send to ${to}: ${message}`);
    return { success: false, reason: "Twilio not configured" };
  }

  try {
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const body = new URLSearchParams({
      To: `whatsapp:${to}`,
      From: `whatsapp:${TWILIO_PHONE_NUMBER}`,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Twilio error: ${error}`);
      return { success: false, reason: error };
    }

    const data = await response.json();
    console.log(`Message sent successfully: ${data.sid}`);
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error(`Error sending Twilio message:`, error);
    return { success: false, reason: error instanceof Error ? error.message : "Unknown error" };
  }
}

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

      // Send WhatsApp/SMS via Twilio
      const twilioResult = await sendTwilioMessage(apt.patients.phone, message);

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
        twilioSent: twilioResult.success,
        twilioStatus: twilioResult.success ? "sent" : twilioResult.reason,
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
