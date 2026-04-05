import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Email via Resend ──────────────────────────────────────────────────────────
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmail(
  to: string,
  patientName: string,
  doctorName: string,
  clinicName: string,
  dateStr: string,
  timeStr: string,
  title: string,
  confirmationToken?: string
) {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL] RESEND_API_KEY no configurada.`);
    return { success: false, reason: "RESEND_API_KEY no configurada" };
  }
  if (!to || !to.includes("@")) {
    console.log(`[EMAIL] Email inválido: ${to}`);
    return { success: false, reason: "Email inválido o vacío" };
  }

  const senderName = clinicName || doctorName || "MEDMIND";
  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#0f172a;padding:28px 32px;text-align:center">
      <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:1px">MEDMIND</span>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 8px;color:#0f172a;font-size:16px">Hola, <strong>${patientName}</strong></p>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px">Te recordamos que tienes una cita médica programada para <strong>mañana</strong>:</p>
      <div style="background:#f8fafc;border-left:4px solid #3b82f6;border-radius:8px;padding:20px 24px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#64748b;font-size:13px;padding:5px 0">📅 Fecha</td><td style="color:#0f172a;font-size:14px;font-weight:600;text-align:right">${dateStr}</td></tr>
          <tr><td style="color:#64748b;font-size:13px;padding:5px 0">🕐 Hora</td><td style="color:#0f172a;font-size:14px;font-weight:600;text-align:right">${timeStr}</td></tr>
          <tr><td style="color:#64748b;font-size:13px;padding:5px 0">📋 Motivo</td><td style="color:#0f172a;font-size:14px;font-weight:600;text-align:right">${title}</td></tr>
          <tr><td style="color:#64748b;font-size:13px;padding:5px 0">👨‍⚕️ Médico</td><td style="color:#0f172a;font-size:14px;font-weight:600;text-align:right">${doctorName}</td></tr>
          ${clinicName ? `<tr><td style="color:#64748b;font-size:13px;padding:5px 0">🏢 Lugar</td><td style="color:#0f172a;font-size:14px;font-weight:600;text-align:right">${clinicName}</td></tr>` : ""}
        </table>
      </div>
      <p style="margin:0 0 16px;color:#64748b;font-size:13px">✅ Por favor llega <strong>10 minutos antes</strong> de tu cita.</p>
      ${confirmationToken ? `
      <div style="text-align:center;margin-bottom:20px">
        <a href="https://medmindsystem.com/confirm/${confirmationToken}" style="display:inline-block;background:#3b82f6;color:#fff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">
          ✓ Confirmar mi asistencia
        </a>
        <p style="margin:10px 0 0;color:#94a3b8;font-size:11px">Haz clic para confirmarle al médico que asistirás</p>
      </div>
      ` : ""}
      <p style="margin:0;color:#64748b;font-size:13px">Si necesitas cancelar o reprogramar, comunícate directamente con tu médico.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:11px">Recordatorio automático generado por <a href="https://medmindsystem.com" style="color:#3b82f6;text-decoration:none">MEDMIND</a></p>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${senderName} <recordatorios@medmindsystem.com>`,
        to: [to],
        subject: `Recordatorio: tu cita es mañana ${dateStr} a las ${timeStr}`,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[EMAIL] Error Resend:", data);
      return { success: false, reason: JSON.stringify(data) };
    }
    console.log(`[EMAIL] ✅ Enviado a ${to} — id: ${data.id}`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error("[EMAIL] Exception:", err);
    return { success: false, reason: String(err) };
  }
}

// ─── SMS via Twilio ────────────────────────────────────────────────────────────
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

async function sendSms(to: string, message: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log(`[SMS] Twilio no configurado — se omite SMS a ${to}`);
    return { success: false, reason: "Twilio no configurado" };
  }
  if (!to || to.replace(/\D/g, "").length < 7) {
    return { success: false, reason: "Teléfono inválido" };
  }

  // Normalize to E.164 (+57XXXXXXXXXX for Colombia)
  const digits = to.replace(/\D/g, "");
  const phone = to.startsWith("+") ? to : `+57${digits.slice(-10)}`;

  try {
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const body = new URLSearchParams({ To: phone, From: TWILIO_PHONE_NUMBER, Body: message });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() }
    );
    const data = await res.json();
    if (!res.ok) {
      console.error("[SMS] Error Twilio:", data);
      return { success: false, reason: data.message };
    }
    console.log(`[SMS] ✅ Enviado a ${phone} — sid: ${data.sid}`);
    return { success: true, sid: data.sid };
  } catch (err) {
    console.error("[SMS] Exception:", err);
    return { success: false, reason: String(err) };
  }
}

// ─── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Allow manual test override: POST { "testEmail": "you@example.com" }
    let testEmail: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        testEmail = body?.testEmail || null;
      } catch (_) { /* no body */ }
    }

    if (testEmail) {
      // ── TEST MODE ──
      const result = await sendEmail(
        testEmail,
        "Paciente de Prueba",
        "Dr. Médico de Prueba",
        "Clínica Demo MEDMIND",
        "mañana (prueba)",
        "10:00 AM",
        "Consulta de prueba"
      );
      return new Response(
        JSON.stringify({ testMode: true, email: result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── PRODUCTION MODE: citas de mañana ──
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        id, title, appointment_date, confirmation_token,
        patients ( full_name, phone, email ),
        profiles:doctor_id ( full_name, clinic_name )
      `)
      .gte("appointment_date", tomorrow.toISOString())
      .lt("appointment_date", dayAfter.toISOString())
      .eq("reminder_sent", false)
      .in("status", ["scheduled", "confirmed"]);

    if (error) throw error;

    console.log(`[REMINDERS] ${appointments?.length || 0} citas para recordar mañana`);

    const results = [];

    for (const apt of appointments || []) {
      const patient = apt.patients as any;
      const doctor = apt.profiles as any;

      const aptDate = new Date(apt.appointment_date);
      const dateStr = aptDate.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const timeStr = aptDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

      const smsText = `MEDMIND: Cita mañana ${dateStr} ${timeStr}. Motivo: ${apt.title}. Médico: ${doctor?.full_name || ""}. Llega 10 min antes.`;

      const [emailResult, smsResult] = await Promise.all([
        sendEmail(patient?.email, patient?.full_name, doctor?.full_name, doctor?.clinic_name, dateStr, timeStr, apt.title, apt.confirmation_token),
        sendSms(patient?.phone, smsText),
      ]);

      // Mark as reminded regardless of channel success (avoids duplicate sends)
      await supabase.from("appointments").update({ reminder_sent: true }).eq("id", apt.id);

      results.push({
        appointmentId: apt.id,
        patient: patient?.full_name,
        email: emailResult,
        sms: smsResult,
      });
    }

    return new Response(
      JSON.stringify({ success: true, total: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error("[REMINDERS] Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
