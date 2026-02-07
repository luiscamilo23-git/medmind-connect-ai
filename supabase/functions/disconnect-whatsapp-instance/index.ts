import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    if (instanceName) {
      console.log(`Attempting to delete instance: ${instanceName}`);

      // Try to delete from Evolution API
      try {
        const deleteResponse = await fetch(`${evolutionApiUrl}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
        });

        if (deleteResponse.ok) {
          console.log(`Successfully deleted instance ${instanceName} from Evolution API`);
        } else {
          const errorText = await deleteResponse.text();
          console.log(`Evolution API delete response: ${deleteResponse.status} - ${errorText}`);
          // Continue anyway to clear the profile
        }
      } catch (apiError) {
        console.error('Error deleting from Evolution API:', apiError);
        // Continue anyway to clear the profile
      }
    }

    // Clear the instance name from profile
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ whatsapp_instance_name: null })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('Failed to update profile');
    }

    console.log(`Cleared whatsapp_instance_name for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Instancia de WhatsApp desconectada exitosamente' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error disconnecting WhatsApp instance';
    console.error('Error in disconnect-whatsapp-instance:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
