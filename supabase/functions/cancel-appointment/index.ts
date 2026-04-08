import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format } from "https://esm.sh/date-fns@3.6.0";
import { es as esLocale } from "https://esm.sh/date-fns@3.6.0/locale";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function jsonResponse(data: Record<string, unknown>) {
  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Método no permitido. Usa POST.' });
    }

    // Authenticate using x-api-key header (same key as book-appointment)
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('N8N_AUTH_TOKEN');

    if (!expectedKey) {
      return jsonResponse({ success: false, error: 'Error de configuración del servidor.' });
    }

    if (!apiKey || apiKey !== expectedKey) {
      return jsonResponse({ success: false, error: 'No autorizado. API key inválido.' });
    }

    const body = await req.json();
    const { phone, doctor_id, appointment_id } = body;

    if (!doctor_id) {
      return jsonResponse({ success: false, error: 'El campo "doctor_id" es requerido.' });
    }

    if (!phone && !appointment_id) {
      return jsonResponse({ success: false, error: 'Debes enviar "phone" o "appointment_id".' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let appointmentToCancel: any = null;

    // If appointment_id is given, cancel that specific appointment
    if (appointment_id) {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, status, patients(full_name, phone)')
        .eq('id', appointment_id)
        .eq('doctor_id', doctor_id)
        .single();

      if (error || !data) {
        return jsonResponse({ success: false, error: 'Cita no encontrada.' });
      }
      appointmentToCancel = data;
    } else {
      // Find by phone — look for next upcoming non-cancelled appointment
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

      // Find patient by phone
      const { data: patients, error: patientError } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('doctor_id', doctor_id)
        .eq('phone', cleanPhone)
        .limit(1);

      if (patientError || !patients || patients.length === 0) {
        return jsonResponse({
          success: false,
          error: 'No encontré ningún paciente registrado con ese número de teléfono.',
        });
      }

      const patient = patients[0];

      // Find their next upcoming appointment
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('id, appointment_date, status, title')
        .eq('doctor_id', doctor_id)
        .eq('patient_id', patient.id)
        .neq('status', 'cancelled')
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true })
        .limit(1);

      if (apptError || !appointments || appointments.length === 0) {
        return jsonResponse({
          success: false,
          error: `No encontré citas próximas pendientes para ${patient.full_name}.`,
          patient_name: patient.full_name,
        });
      }

      appointmentToCancel = { ...appointments[0], patients: { full_name: patient.full_name, phone: cleanPhone } };
    }

    // Cancel the appointment
    const { error: cancelError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentToCancel.id);

    if (cancelError) {
      return jsonResponse({ success: false, error: 'Error al cancelar la cita en la base de datos.' });
    }

    // Create notification for the doctor
    const patientName = appointmentToCancel.patients?.full_name || 'Paciente';
    const apptDateFormatted = format(
      new Date(appointmentToCancel.appointment_date),
      "d 'de' MMMM 'a las' HH:mm",
      { locale: esLocale }
    );

    await supabase.from('notifications').insert({
      doctor_id,
      message: `❌ Cita cancelada: ${patientName} — ${apptDateFormatted}`,
      is_read: false,
    });

    return jsonResponse({
      success: true,
      message: `Cita cancelada exitosamente.`,
      appointment_id: appointmentToCancel.id,
      appointment_date: appointmentToCancel.appointment_date,
      patient_name: patientName,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return jsonResponse({ success: false, error: `Error interno: ${errorMessage}` });
  }
});
