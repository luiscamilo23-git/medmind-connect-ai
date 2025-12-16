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

    console.log(`Resetting instance via logout+connect: ${instanceName}`);

    // Step 1: Logout the instance
    const logoutUrl = `${evolutionApiUrl}/instance/logout/${instanceName}`;
    console.log(`Calling logout: ${logoutUrl}`);
    
    const logoutResponse = await fetch(logoutUrl, {
      method: 'DELETE',
      headers: {
        'apikey': evolutionApiKey,
      },
    });

    const logoutText = await logoutResponse.text();
    console.log(`Logout response: ${logoutResponse.status} - ${logoutText}`);

    // Wait a moment for logout to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Reconnect the instance to get new QR
    const connectUrl = `${evolutionApiUrl}/instance/connect/${instanceName}`;
    console.log(`Calling connect: ${connectUrl}`);
    
    const connectResponse = await fetch(connectUrl, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
      },
    });

    if (!connectResponse.ok) {
      const errorText = await connectResponse.text();
      console.error(`Connect error: ${connectResponse.status} - ${errorText}`);
      // Even if connect fails, the logout succeeded, so we consider it a partial success
    }

    const connectData = await connectResponse.json().catch(() => ({}));
    console.log('Connect response:', JSON.stringify(connectData));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Instancia reiniciada. Escanea el nuevo código QR.',
        qrCode: connectData?.base64 || connectData?.qrcode?.base64 || null
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
