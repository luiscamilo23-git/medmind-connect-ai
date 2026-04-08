import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildEmailHtml(doctorName: string, rethus: string, daysLeft: number): string {
  const isSuspensionWarning = daysLeft <= 3;
  const accentColor = isSuspensionWarning ? "#ef4444" : "#3b82f6";
  const subject = isSuspensionWarning
    ? `⚠️ Tu cuenta MEDMIND se suspenderá en ${daysLeft} día${daysLeft === 1 ? "" : "s"}`
    : "Verificación de tu número RETHUS — MEDMIND";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#0f172a;padding:28px 32px;text-align:center">
      <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:1px">MEDMIND</span>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 8px;color:#0f172a;font-size:16px">Hola, <strong>Dr. ${doctorName}</strong></p>

      ${isSuspensionWarning ? `
      <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600">
          ⚠️ Tu cuenta será suspendida en <strong>${daysLeft} día${daysLeft === 1 ? "" : "s"}</strong> si no verificas tu número RETHUS.
        </p>
      </div>
      ` : `
      <p style="margin:0 0 20px;color:#64748b;font-size:14px">
        Como parte de nuestro proceso de verificación para médicos, necesitamos confirmar tu registro profesional RETHUS para garantizar la seguridad de la plataforma.
      </p>
      `}

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px">
        <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.5px">Número RETHUS registrado</p>
        <p style="margin:0;color:#0f172a;font-size:18px;font-weight:700;font-family:monospace">${rethus}</p>
      </div>

      <p style="margin:0 0 20px;color:#475569;font-size:14px">
        Nuestro equipo está verificando este número en el registro del <strong>Ministerio de Salud de Colombia</strong>.
        Si el número es correcto, tu cuenta quedará verificada automáticamente en las próximas 24 horas.
      </p>

      <p style="margin:0 0 20px;color:#475569;font-size:14px">
        Si el número RETHUS es incorrecto o quieres actualizarlo, ingresa a tu perfil en MEDMIND:
      </p>

      <div style="text-align:center;margin:28px 0">
        <a href="https://medmindsystem.com/profile"
          style="background:${accentColor};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block">
          Actualizar mi RETHUS
        </a>
      </div>

      <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center">
        ¿Tienes dudas? Escríbenos a <a href="mailto:soporte@medmindsystem.com" style="color:#3b82f6">soporte@medmindsystem.com</a>
        o al WhatsApp <strong>+57 305 3943965</strong>
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:11px">MEDMIND SAS · Medellín, Colombia · medmindsystem.com</p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const twentySevenDaysAgo = new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Buscar médicos no verificados con 5+ días de antigüedad y sin recordatorio enviado aún
    const { data: pendingDoctors, error } = await supabase
      .from("profiles")
      .select("id, full_name, license_number, created_at, rethus_reminder_sent_at")
      .eq("rethus_verified", false)
      .not("license_number", "is", null)
      .lte("created_at", fiveDaysAgo)
      .or(`rethus_reminder_sent_at.is.null,rethus_reminder_sent_at.lte.${twentySevenDaysAgo}`);

    if (error) throw error;

    // Obtener emails de auth.users via service role
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map(authUsers.users.map(u => [u.id, u.email]));

    const results = [];

    for (const doctor of pendingDoctors || []) {
      const email = emailMap.get(doctor.id);
      if (!email) continue;

      const createdAt = new Date(doctor.created_at);
      const daysSinceCreated = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
      const daysLeft = Math.max(0, 30 - daysSinceCreated);

      const firstName = doctor.full_name?.replace(/^Dr\.\s*/i, "").split(" ")[0] || "doctor";

      if (!RESEND_API_KEY) {
        console.log(`[SKIP] Sin RESEND_API_KEY — hubiera enviado a ${email}`);
        results.push({ email, status: "skipped_no_key" });
        continue;
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "MEDMIND <soporte@medmindsystem.com>",
          to: [email],
          subject: daysLeft <= 3
            ? `⚠️ Tu cuenta MEDMIND se suspenderá en ${daysLeft} día${daysLeft === 1 ? "" : "s"}`
            : "Verifica tu número RETHUS — MEDMIND",
          html: buildEmailHtml(firstName, doctor.license_number, daysLeft),
        }),
      });

      if (res.ok) {
        // Actualizar reminder_sent_at
        await supabase
          .from("profiles")
          .update({ rethus_reminder_sent_at: new Date().toISOString() })
          .eq("id", doctor.id);
        results.push({ email, status: "sent", daysLeft });
      } else {
        const err = await res.text();
        results.push({ email, status: "error", error: err });
      }
    }

    // Suspender cuentas con 30+ días sin verificar (marcar en profiles)
    await supabase
      .from("profiles")
      .update({ rethus_verified: false })  // ya está en false, solo para trigger futuro
      .eq("rethus_verified", false)
      .not("license_number", "is", null)
      .lte("created_at", thirtyDaysAgo);

    return new Response(
      JSON.stringify({ processed: pendingDoctors?.length || 0, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
