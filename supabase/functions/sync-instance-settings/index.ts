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
    const medmindWebhook = Deno.env.get('MEDMIND_WEBHOOK');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error('Evolution API configuration not found');
    }

    if (!medmindWebhook) {
      throw new Error('MEDMIND_WEBHOOK configuration not found');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    // Get the user from the JWT token
    const supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Failed to authenticate user');
    }

    // Get instance name from profile
    const supabaseAdmin = createClient(supabaseUrl!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('whatsapp_instance_name')
      .eq('id', user.id)
      .single();

    const instanceName = profile?.whatsapp_instance_name;

    if (!instanceName) {
      throw new Error('No tienes una instancia de WhatsApp configurada');
    }

    console.log(`Syncing settings for instance: ${instanceName}`);

    // Action A: Configure Webhook
    const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: medmindWebhook,
          webhookByEvents: true,
          webhookBase64: true,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'MESSAGES_UPDATE']
        }
      }),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`Webhook config error: ${webhookResponse.status} - ${errorText}`);
      throw new Error(`Error configurando webhook: ${webhookResponse.status}`);
    }

    console.log('Webhook configured successfully');

    // Action B: Configure Behavior
    const settingsResponse = await fetch(`${evolutionApiUrl}/settings/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        settings: {
          rejectCall: true,
          msgCall: 'No recibo llamadas, agenda tu cita por texto.',
          groupsIgnore: true,
          alwaysOnline: true,
          readMessages: true,
          readStatus: false,
          syncFullHistory: false
        }
      }),
    });

    if (!settingsResponse.ok) {
      const errorText = await settingsResponse.text();
      console.error(`Settings config error: ${settingsResponse.status} - ${errorText}`);
      throw new Error(`Error configurando ajustes: ${settingsResponse.status}`);
    }

    console.log('Settings configured successfully');

    // Update last sync timestamp
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ whatsapp_last_sync_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update sync timestamp:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Configuración Sincronizada',
        syncedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error syncing instance settings';
    console.error('Error in sync-instance-settings:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
