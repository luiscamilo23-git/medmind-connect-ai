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
      console.error('Missing Evolution API configuration');
      throw new Error('Evolution API configuration not found');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
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

    if (!profile?.whatsapp_instance_name) {
      return new Response(
        JSON.stringify({ connected: false, instanceName: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const instanceName = profile.whatsapp_instance_name;
    console.log(`Checking instance status: ${instanceName}`);

    // Check if instance exists in Evolution API
    const evolutionResponse = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
    });

    if (!evolutionResponse.ok) {
      console.error(`Evolution API error: ${evolutionResponse.status}`);
      // If we can't verify, assume connected to avoid false negatives
      return new Response(
        JSON.stringify({ connected: true, instanceName, verified: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const instances = await evolutionResponse.json();
    console.log('Evolution API instances:', JSON.stringify(instances));

    // Check if our instance exists in the list
    const instanceExists = Array.isArray(instances) && instances.some(
      (inst: { instanceName?: string; name?: string }) => 
        inst.instanceName === instanceName || inst.name === instanceName
    );

    if (!instanceExists) {
      console.log(`Instance ${instanceName} not found in Evolution API, clearing profile`);
      
      // Clear the instance name from profile
      await supabaseClient
        .from('profiles')
        .update({ whatsapp_instance_name: null })
        .eq('id', user.id);

      return new Response(
        JSON.stringify({ 
          connected: false, 
          instanceName: null, 
          wasCleared: true,
          message: 'La instancia fue eliminada de Evolution API'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ connected: true, instanceName, verified: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error checking WhatsApp instance';
    console.error('Error in check-whatsapp-instance:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
