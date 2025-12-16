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

    console.log(`Resetting instance: ${instanceName}`);

    // Call Evolution API to restart the instance
    const restartResponse = await fetch(`${evolutionApiUrl}/instance/restart/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
    });

    if (!restartResponse.ok) {
      const errorText = await restartResponse.text();
      console.error(`Evolution API restart error: ${restartResponse.status} - ${errorText}`);
      throw new Error('Failed to restart WhatsApp instance');
    }

    const restartData = await restartResponse.json();
    console.log('Instance restart response:', restartData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Instancia de WhatsApp reiniciada exitosamente',
        data: restartData
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
