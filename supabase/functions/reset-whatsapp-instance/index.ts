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
      .single();

    const instanceName = profile?.whatsapp_instance_name;

    if (!instanceName) {
      throw new Error('No WhatsApp instance found for this user');
    }

    console.log(`Restarting instance (no logout) for: ${instanceName}`);

    // Evolution API deployments differ (reverse proxies / method). Try a small set of known variants.
    const candidates: Array<{ method: 'PUT' | 'POST'; path: string }> = [
      { method: 'PUT', path: `/instance/restart/${instanceName}` },
      { method: 'POST', path: `/instance/restart/${instanceName}` },
      // Some setups mount API under /api
      { method: 'PUT', path: `/api/instance/restart/${instanceName}` },
      { method: 'POST', path: `/api/instance/restart/${instanceName}` },
      // Some setups expose v2 under /v2
      { method: 'PUT', path: `/v2/instance/restart/${instanceName}` },
      { method: 'POST', path: `/v2/instance/restart/${instanceName}` },
    ];

    let lastErrorText = '';
    let lastStatus = 0;

    for (const c of candidates) {
      const url = `${evolutionApiUrl}${c.path}`;
      console.log(`Trying restart: ${c.method} ${url}`);

      const res = await fetch(url, {
        method: c.method,
        headers: { apikey: evolutionApiKey },
      });

      lastStatus = res.status;
      const text = await res.text();
      lastErrorText = text;
      console.log(`Restart attempt result: ${res.status} - ${text}`);

      if (res.ok) {
        // Many deployments return JSON, but keep it safe.
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

    console.error(`All restart attempts failed. Last: ${lastStatus} - ${lastErrorText}`);
    throw new Error(
      `No se pudo reiniciar la instancia sin cerrar sesión (HTTP ${lastStatus}). ` +
        `Tu servidor no expone el endpoint de restart en esa ruta. Revisa el base path (p.ej. /api) y/o método (PUT/POST).`
    );


    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Instancia reiniciada.',
        qrCode: null,
        data: null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error resetting WhatsApp instance';
    console.error('Error in reset-whatsapp-instance:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
