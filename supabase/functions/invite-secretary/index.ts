import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the calling user (must be a doctor)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the calling user
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get doctor's name for the invitation email
    const { data: doctorProfile } = await supabase
      .from("profiles")
      .select("full_name, clinic_name")
      .eq("id", user.id)
      .maybeSingle();

    const doctorName = doctorProfile?.full_name || doctorProfile?.clinic_name || "tu médico";

    // Check if user already exists with this email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let secretaryId: string;

    if (existingUser) {
      secretaryId = existingUser.id;
      // Assign secretaria role if not already assigned
      await supabase.from("user_roles").upsert(
        { user_id: secretaryId, role: "secretaria" },
        { onConflict: "user_id,role", ignoreDuplicates: true }
      );
    } else {
      // Invite user via magic link
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: { role: "secretaria", invited_by_doctor: user.id },
          redirectTo: `${Deno.env.get("SITE_URL") || "https://medmindsystem.com"}/auth`,
        }
      );

      if (inviteError || !inviteData?.user) {
        throw inviteError || new Error("No se pudo crear la invitación");
      }

      secretaryId = inviteData.user.id;

      // Create profile for the new secretary
      await supabase.from("profiles").upsert({
        id: secretaryId,
        full_name: email.split("@")[0],
      }, { onConflict: "id", ignoreDuplicates: true });

      // Assign role
      await supabase.from("user_roles").insert({ user_id: secretaryId, role: "secretaria" });
    }

    // Create the assignment link
    const { error: assignError } = await supabase.from("secretary_assignments").upsert(
      { doctor_id: user.id, secretary_id: secretaryId },
      { onConflict: "doctor_id,secretary_id", ignoreDuplicates: true }
    );

    if (assignError) throw assignError;

    return new Response(
      JSON.stringify({
        success: true,
        message: existingUser
          ? `${email} ha sido asignada como secretaria.`
          : `Invitación enviada a ${email}. Recibirá un email para crear su cuenta.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error inviting secretary:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
