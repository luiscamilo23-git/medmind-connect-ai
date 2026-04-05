import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find appointment by token
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        id,
        title,
        appointment_date,
        duration_minutes,
        status,
        confirmed_at,
        confirmation_token,
        patients (full_name, phone),
        doctor_id
      `)
      .eq("confirmation_token", token)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!appointment) {
      return new Response(
        JSON.stringify({ error: "Cita no encontrada. El enlace puede haber expirado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already confirmed, just return the data
    if (appointment.status === "confirmed" || appointment.confirmed_at) {
      // Get doctor name
      const { data: doctor } = await supabase
        .from("profiles")
        .select("full_name, clinic_name")
        .eq("id", appointment.doctor_id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          alreadyConfirmed: true,
          appointment: {
            title: appointment.title,
            date: appointment.appointment_date,
            duration: appointment.duration_minutes,
            patientName: (appointment.patients as any)?.full_name,
            doctorName: doctor?.full_name,
            clinicName: doctor?.clinic_name,
            confirmedAt: appointment.confirmed_at,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Confirm the appointment
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", appointment.id);

    if (updateError) throw updateError;

    // Get doctor name for response
    const { data: doctor } = await supabase
      .from("profiles")
      .select("full_name, clinic_name")
      .eq("id", appointment.doctor_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        success: true,
        appointment: {
          title: appointment.title,
          date: appointment.appointment_date,
          duration: appointment.duration_minutes,
          patientName: (appointment.patients as any)?.full_name,
          doctorName: doctor?.full_name,
          clinicName: doctor?.clinic_name,
          confirmedAt: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error confirming appointment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
