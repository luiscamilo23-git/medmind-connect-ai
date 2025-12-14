import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get the authorization header to extract user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('Authorization required');
    }

    // Create Supabase client with user's token
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user from the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (userError || !user) {
      console.error('Failed to get user:', userError);
      throw new Error('Failed to authenticate user');
    }

    const userId = user.id;
    console.log(`Creating WhatsApp instance for user: ${userId}`);

    // Check if user already has an instance
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('whatsapp_instance_name')
      .eq('id', userId)
      .single();

    if (existingProfile?.whatsapp_instance_name) {
      console.log(`User ${userId} already has instance: ${existingProfile.whatsapp_instance_name}`);
      return new Response(
        JSON.stringify({ 
          error: 'Ya tienes una instancia de WhatsApp configurada',
          instanceName: existingProfile.whatsapp_instance_name 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create instance in Evolution API
    const instanceName = `medmind_${userId.replace(/-/g, '_').substring(0, 20)}`;
    console.log(`Creating Evolution API instance: ${instanceName}`);

    const evolutionResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    });

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text();
      console.error(`Evolution API error: ${evolutionResponse.status} - ${errorText}`);
      throw new Error(`Evolution API error: ${evolutionResponse.status}`);
    }

    const evolutionData = await evolutionResponse.json();
    console.log('Evolution API response:', JSON.stringify(evolutionData));

    // Update the user's profile with the instance name
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ whatsapp_instance_name: instanceName })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      throw new Error('Failed to save WhatsApp instance to profile');
    }

    console.log(`Successfully created instance ${instanceName} for user ${userId}`);

    // Extract QR code from response
    const qrCode = evolutionData.qrcode?.base64 || evolutionData.base64 || evolutionData.qr?.base64 || null;

    return new Response(
      JSON.stringify({
        success: true,
        instanceName: instanceName,
        qrCode: qrCode,
        message: 'Instancia de WhatsApp creada exitosamente',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error creating WhatsApp instance';
    console.error('Error in create-whatsapp-instance:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
