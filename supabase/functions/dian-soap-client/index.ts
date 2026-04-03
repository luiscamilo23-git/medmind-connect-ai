/**
 * dian-soap-client — Cliente SOAP directo para los web services de la DIAN
 *
 * Métodos:
 * - get_numbering_range: obtiene TechnicalKey de una resolución/rango
 * - send_bill_sync: envía factura firmada (base64 ZIP)
 * - get_status: consulta estado de un documento enviado
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildGetNumberingRangeEnvelope,
  buildGetStatusEnvelope,
  buildSendBillSyncEnvelope,
  callDIANSoap,
  type DIANEnvironment,
  parseGetNumberingRangeResponse,
  parseSendBillSyncResponse,
} from "../_shared/soap.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "No autorizado" }, 401);

    const { method, payload } = await req.json();

    // Cargar config del médico para saber qué entorno usar
    const { data: config } = await supabase
      .from("dian_software_config")
      .select("*")
      .eq("doctor_id", user.id)
      .single();

    if (!config) return json({ error: "No hay configuración DIAN. Configura tu Software Propio primero." }, 400);

    const env: DIANEnvironment = config.environment === "produccion" ? "produccion" : "habilitacion";

    switch (method) {
      case "get_numbering_range": {
        const envelope = buildGetNumberingRangeEnvelope({
          accountCode: config.nit,
          accountCodeT: config.nit,
          softwareCode: payload.softwareCode ?? "MEDMIND-001",
          prefix: config.prefijo ?? "",
          fromNumber: String(config.rango_desde),
          toNumber: String(config.rango_hasta),
        });

        const soapResponse = await callDIANSoap(
          env,
          "http://wcf.dian.colombia/IWcfDianCustomerServices/GetNumberingRange",
          envelope,
        );

        const parsed = parseGetNumberingRangeResponse(soapResponse);

        if (parsed.success && parsed.technicalKey) {
          // Guardar la TechnicalKey obtenida de DIAN
          await supabase
            .from("dian_software_config")
            .update({ technical_key: parsed.technicalKey })
            .eq("doctor_id", user.id);
        }

        return json(parsed);
      }

      case "send_bill_sync": {
        const { xmlBase64Zip } = payload;
        if (!xmlBase64Zip) return json({ error: "xmlBase64Zip es requerido" }, 400);

        const envelope = buildSendBillSyncEnvelope(xmlBase64Zip);
        const soapResponse = await callDIANSoap(
          env,
          "http://wcf.dian.colombia/IWcfDianCustomerServices/SendBillSync",
          envelope,
        );

        const parsed = parseSendBillSyncResponse(soapResponse);
        return json(parsed);
      }

      case "get_status": {
        const { trackId } = payload;
        if (!trackId) return json({ error: "trackId es requerido" }, 400);

        const envelope = buildGetStatusEnvelope(trackId);
        const soapResponse = await callDIANSoap(
          env,
          "http://wcf.dian.colombia/IWcfDianCustomerServices/GetStatus",
          envelope,
        );

        return json({ success: true, rawResponse: soapResponse.slice(0, 2000) });
      }

      default:
        return json({ error: `Método desconocido: ${method}. Usa: get_numbering_range, send_bill_sync, get_status` }, 400);
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error inesperado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
