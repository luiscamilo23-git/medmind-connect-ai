import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error('Evolution API configuration not found');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration not found');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    // Get user from JWT
    const { data: { user }, error: userError } = await createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (userError || !user) {
      throw new Error('Failed to authenticate user');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get stored instance name from profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('whatsapp_instance_name')
      .eq('id', user.id)
      .maybeSingle();

    const instanceName = profile?.whatsapp_instance_name;

    if (!instanceName) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No hay una instancia de WhatsApp asociada a este usuario.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Restarting instance (no logout) for: ${instanceName}`);

    // Evolution API deployments differ (reverse proxies / basePath / method). Try common variants.
    const candidates: Array<{ method: 'PUT' | 'POST'; path: string }> = [
      { method: 'PUT', path: `/instance/restart/${instanceName}` },
      { method: 'POST', path: `/instance/restart/${instanceName}` },
      { method: 'PUT', path: `/api/instance/restart/${instanceName}` },
      { method: 'POST', path: `/api/instance/restart/${instanceName}` },
      { method: 'PUT', path: `/v2/instance/restart/${instanceName}` },
      { method: 'POST', path: `/v2/instance/restart/${instanceName}` },
    ];

    const attempts: Array<{ method: string; url: string; status: number; body: string }> = [];

    for (const c of candidates) {
      const url = `${evolutionApiUrl}${c.path}`;
      console.log(`Trying restart: ${c.method} ${url}`);

      const res = await fetch(url, {
        method: c.method,
        headers: { apikey: evolutionApiKey },
      });

      const text = await res.text();
      attempts.push({
        method: c.method,
        url,
        status: res.status,
        body: text?.slice?.(0, 500) ?? String(text),
      });

      console.log(`Restart attempt result: ${res.status} - ${text}`);

      if (res.ok) {
        let parsed: unknown = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = text;
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Instancia reiniciada sin cerrar sesión.',
            data: parsed,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.error('All restart attempts failed:', JSON.stringify(attempts));

    return new Response(
      JSON.stringify({
        success: false,
        message:
          'No se pudo reiniciar sin desconectar: tu servidor no expone el endpoint de restart en las rutas probadas. ' +
          'Esto normalmente es un base path distinto (por proxy) o el endpoint está deshabilitado en esa build.',
        attempts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error resetting WhatsApp instance';
    console.error('Error in reset-whatsapp-instance:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

