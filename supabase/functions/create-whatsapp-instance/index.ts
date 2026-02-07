import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Función para decodificar JWT y obtener el user_id
function decodeJWT(token: string): { sub?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    // 1. AUTENTICACIÓN - Extraer user_id del JWT
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header presente:", !!authHeader);
    
    if (!authHeader) {
      throw new Error("No se encontró token de autorización");
    }

    // Extraer el token Bearer
    const token = authHeader.replace("Bearer ", "");
    const decoded = decodeJWT(token);
    
    if (!decoded || !decoded.sub) {
      throw new Error("Token JWT inválido o sin user_id");
    }

    const userId = decoded.sub;
    console.log("Usuario ID extraído del JWT:", userId);

    // Crear cliente con service role para todas las operaciones
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Obtener nombre del perfil para crear instancia legible
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, whatsapp_instance_name")
      .eq("id", userId)
      .single();

    // Si ya tiene instancia, retornarla
    if (profile?.whatsapp_instance_name) {
      console.log("Ya existe instancia:", profile.whatsapp_instance_name);
      return new Response(
        JSON.stringify({
          success: true,
          alreadyConnected: true,
          instanceName: profile.whatsapp_instance_name,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. GENERAR NOMBRE LEGIBLE: DrNombre_shortId
    const doctorName = profile?.full_name || "Doctor";
    const sanitizedName = doctorName
      .replace(/^Dr\.?\s*/i, "") // Quitar prefijo Dr.
      .replace(/[^a-zA-Z0-9]/g, "") // Solo alfanuméricos
      .substring(0, 15); // Máximo 15 caracteres
    const shortId = userId.split("-")[0]; // Primeros 8 chars del UUID
    const instanceName = `${sanitizedName}_${shortId}`;
    
    console.log(`Nombre del doctor: ${doctorName}, Instancia: ${instanceName}`);

    const evoUrl = Deno.env.get("EVOLUTION_API_URL");
    const evoKey = Deno.env.get("EVOLUTION_API_KEY");
    const webhookUrl = Deno.env.get("MEDMIND_WEBHOOK");

    if (!evoUrl || !evoKey) {
      throw new Error("Faltan secretos de Evolution API");
    }

    console.log(`[1/5] Creando instancia: ${instanceName}`);
    console.log(`Evolution URL: ${evoUrl}`);

    // 3. CREAR INSTANCIA (SOLO CAMPOS MÍNIMOS - SIN WEBHOOK NI SETTINGS)
    const createPayload = {
      instanceName: instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS"
    };
    console.log("Create payload:", JSON.stringify(createPayload));

    const createRes = await fetch(`${evoUrl}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify(createPayload),
    });

    const createText = await createRes.text();
    console.log(`[2/5] Respuesta create (status ${createRes.status}):`, createText);

    let createData;
    try {
      createData = JSON.parse(createText);
    } catch {
      createData = { raw: createText };
    }

    // Si falla y NO es porque ya existe, lanzar error
    const alreadyExists = createText.includes("already exists") || createText.includes("Instance already");
    if (!createRes.ok && !alreadyExists) {
      throw new Error(`Error creando instancia: ${createText}`);
    }

    // Extraer QR del response de creación
    let qrCode = createData?.qrcode?.base64 || createData?.base64 || createData?.code;
    console.log("QR obtenido de create:", !!qrCode);

    // 4. ESPERAR para que la instancia se sincronice
    console.log(`[3/5] Esperando sincronización...`);
    await new Promise(r => setTimeout(r, 1500));

    // 5. CONFIGURAR WEBHOOK (formato con wrapper según Evolution API)
    if (webhookUrl) {
      console.log(`[4/5] Configurando webhook: ${webhookUrl}`);
      try {
        const webhookRes = await fetch(`${evoUrl}/webhook/set/${instanceName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evoKey },
          body: JSON.stringify({
            webhook: {
              enabled: true,
              url: webhookUrl,
              byEvents: false,
              base64: true,
              events: ["MESSAGES_UPSERT"]
            }
          }),
        });
        const webhookData = await webhookRes.text();
        console.log(`Webhook response (${webhookRes.status}):`, webhookData);
        if (!webhookRes.ok) {
          console.error("Webhook config failed, response:", webhookData);
        }
      } catch (webhookError) {
        console.error("Error configurando webhook:", webhookError);
      }
    }

    // 6. CONFIGURAR SETTINGS (formato plano según documentación oficial)
    console.log(`[5/5] Configurando settings...`);
    try {
      const settingsRes = await fetch(`${evoUrl}/settings/set/${instanceName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evoKey },
        body: JSON.stringify({
          rejectCall: true,
          msgCall: "No recibo llamadas, agenda por chat.",
          groupsIgnore: true,
          alwaysOnline: true,
          readMessages: true,
          readStatus: false,
          syncFullHistory: false
        }),
      });
      const settingsData = await settingsRes.text();
      console.log(`Settings response (${settingsRes.status}):`, settingsData);
      if (!settingsRes.ok) {
        console.error("Settings config failed, response:", settingsData);
      }
    } catch (settingsError) {
      console.error("Error configurando settings:", settingsError);
    }

    // Si no obtuvimos QR en la creación (o ya existía), intentar obtenerlo del endpoint connect
    if (!qrCode) {
      console.log(`Obteniendo QR desde endpoint connect...`);
      try {
        const connectRes = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
          method: "GET",
          headers: { apikey: evoKey },
        });
        const connectText = await connectRes.text();
        console.log(`Connect response (${connectRes.status}):`, connectText);
        
        if (connectRes.ok) {
          try {
            const connectData = JSON.parse(connectText);
            qrCode = connectData.code || connectData.base64 || connectData.qrcode?.base64;
            console.log("QR obtenido de connect:", !!qrCode);
          } catch {
            console.log("Connect response no es JSON válido");
          }
        }
      } catch (connectError) {
        console.error("Error obteniendo QR:", connectError);
      }
    }

    // 7. GUARDAR EN PROFILES usando service role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ whatsapp_instance_name: instanceName })
      .eq("id", userId);
    
    if (updateError) {
      console.error("Error actualizando perfil:", updateError);
    } else {
      console.log("Perfil actualizado correctamente");
    }

    console.log(`Instancia ${instanceName} procesada. QR disponible: ${!!qrCode}`);

    return new Response(
      JSON.stringify({
        success: true,
        qrCode: qrCode,
        instanceName: instanceName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en create-whatsapp-instance:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
