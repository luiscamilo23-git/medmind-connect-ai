/**
 * store-certificate — Almacena el certificado X.509 (.p12) del médico en Supabase Vault
 *
 * El certificado NUNCA se guarda en la DB normal.
 * Se usa Supabase Vault (secretos encriptados AES-256).
 * Solo se guarda la referencia (vault_key) en dian_software_config.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // service role para vault
    );

    // Auth check con anon key del request
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { certBase64, certPassword, certExpiry } = await req.json();

    if (!certBase64 || !certPassword) {
      return new Response(
        JSON.stringify({ error: "Se requiere el certificado (.p12 en base64) y la contraseña" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validar que el base64 parece un archivo .p12 (comienza con bytes PKCS#12)
    const certBytes = Uint8Array.from(atob(certBase64), (c) => c.charCodeAt(0));
    if (certBytes.length < 4 || certBytes[0] !== 0x30) {
      return new Response(
        JSON.stringify({ error: "El archivo no parece un certificado PKCS#12 válido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Guardar en Supabase Vault
    const vaultKey = `dian_cert_${user.id}_${Date.now()}`;
    const secretValue = JSON.stringify({ cert: certBase64, password: certPassword });

    const { data: vaultData, error: vaultError } = await supabase.rpc("vault_store_secret", {
      p_secret: secretValue,
      p_name: vaultKey,
      p_description: `Certificado DIAN para doctor ${user.id}`,
    });

    if (vaultError) {
      // Fallback: si vault no está disponible, usar tabla encriptada por RLS
      // (esto no debería pasar en producción con Vault activado)
      return new Response(
        JSON.stringify({ error: "Error al guardar el certificado de forma segura. Contacta soporte.", detail: vaultError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Actualizar la referencia en dian_software_config
    await supabase
      .from("dian_software_config")
      .update({
        cert_vault_key: vaultKey,
        cert_expiry: certExpiry ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("doctor_id", user.id);

    return new Response(
      JSON.stringify({ success: true, vaultKey, message: "Certificado guardado de forma segura" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error inesperado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
