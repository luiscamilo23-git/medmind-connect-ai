import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth via x-api-key header
    const apiKey = req.headers.get("x-api-key");
    const TWIN_API_KEY = Deno.env.get("TWIN_API_KEY");
    if (!TWIN_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "TWIN_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (apiKey !== TWIN_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action, params = {} } = body;

    if (!action) {
      return respond({ success: false, error: "Missing 'action' field" }, 400);
    }

    let result: any;

    switch (action) {
      // ==================== PATIENTS ====================
      case "list_patients": {
        const { doctor_id, limit = 50, offset = 0, search } = params;
        let query = supabase.from("patients").select("*");
        if (doctor_id) query = query.eq("doctor_id", doctor_id);
        if (search) query = query.ilike("full_name", `%${search}%`);
        const { data, error } = await query.range(offset, offset + limit - 1).order("created_at", { ascending: false });
        result = { data, error: error?.message };
        break;
      }
      case "get_patient": {
        const { id } = params;
        const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
        result = { data, error: error?.message };
        break;
      }
      case "create_patient": {
        const { data, error } = await supabase.from("patients").insert(params).select().single();
        result = { data, error: error?.message };
        break;
      }
      case "update_patient": {
        const { id, ...updates } = params;
        const { data, error } = await supabase.from("patients").update(updates).eq("id", id).select().single();
        result = { data, error: error?.message };
        break;
      }
      case "delete_patient": {
        const { id } = params;
        const { error } = await supabase.from("patients").delete().eq("id", id);
        result = { success: !error, error: error?.message };
        break;
      }

      // ==================== APPOINTMENTS ====================
      case "list_appointments": {
        const { doctor_id, status, limit = 50, offset = 0 } = params;
        let query = supabase.from("appointments").select("*, patients(full_name, phone)");
        if (doctor_id) query = query.eq("doctor_id", doctor_id);
        if (status) query = query.eq("status", status);
        const { data, error } = await query.range(offset, offset + limit - 1).order("appointment_date", { ascending: true });
        result = { data, error: error?.message };
        break;
      }
      case "get_appointment": {
        const { id } = params;
        const { data, error } = await supabase.from("appointments").select("*, patients(full_name, phone)").eq("id", id).single();
        result = { data, error: error?.message };
        break;
      }
      case "create_appointment": {
        const { data, error } = await supabase.from("appointments").insert(params).select().single();
        result = { data, error: error?.message };
        break;
      }
      case "update_appointment": {
        const { id, ...updates } = params;
        const { data, error } = await supabase.from("appointments").update(updates).eq("id", id).select().single();
        result = { data, error: error?.message };
        break;
      }
      case "cancel_appointment": {
        const { id } = params;
        const { data, error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id).select().single();
        result = { data, error: error?.message };
        break;
      }

      // ==================== MEDICAL RECORDS ====================
      case "list_medical_records": {
        const { doctor_id, patient_id, limit = 50, offset = 0 } = params;
        let query = supabase.from("medical_records").select("*, patients(full_name)");
        if (doctor_id) query = query.eq("doctor_id", doctor_id);
        if (patient_id) query = query.eq("patient_id", patient_id);
        const { data, error } = await query.range(offset, offset + limit - 1).order("created_at", { ascending: false });
        result = { data, error: error?.message };
        break;
      }
      case "get_medical_record": {
        const { id } = params;
        const { data, error } = await supabase.from("medical_records").select("*, patients(full_name)").eq("id", id).single();
        result = { data, error: error?.message };
        break;
      }
      case "create_medical_record": {
        const { data, error } = await supabase.from("medical_records").insert(params).select().single();
        result = { data, error: error?.message };
        break;
      }

      // ==================== INVOICES ====================
      case "list_invoices": {
        const { doctor_id, estado, payment_status, limit = 50, offset = 0 } = params;
        let query = supabase.from("invoices").select("*, patients(full_name)");
        if (doctor_id) query = query.eq("doctor_id", doctor_id);
        if (estado) query = query.eq("estado", estado);
        if (payment_status) query = query.eq("payment_status", payment_status);
        const { data, error } = await query.range(offset, offset + limit - 1).order("created_at", { ascending: false });
        result = { data, error: error?.message };
        break;
      }
      case "create_invoice": {
        const { items, ...invoiceData } = params;
        const { data: invoice, error: invError } = await supabase.from("invoices").insert(invoiceData).select().single();
        if (invError) { result = { error: invError.message }; break; }
        if (items?.length) {
          const itemsWithInvoice = items.map((item: any) => ({ ...item, invoice_id: invoice.id }));
          const { error: itemsError } = await supabase.from("invoice_items").insert(itemsWithInvoice);
          if (itemsError) { result = { data: invoice, warning: `Invoice created but items failed: ${itemsError.message}` }; break; }
        }
        result = { data: invoice };
        break;
      }
      case "update_invoice": {
        const { id, ...updates } = params;
        const { data, error } = await supabase.from("invoices").update(updates).eq("id", id).select().single();
        result = { data, error: error?.message };
        break;
      }

      // ==================== INVENTORY ====================
      case "list_inventory": {
        const { doctor_id, category, low_stock, limit = 100, offset = 0 } = params;
        let query = supabase.from("inventory").select("*");
        if (doctor_id) query = query.eq("doctor_id", doctor_id);
        if (category) query = query.eq("category", category);
        if (low_stock) query = query.lte("current_stock", supabase.rpc ? 0 : 0); // Filter handled below
        const { data, error } = await query.range(offset, offset + limit - 1).order("name");
        let filtered = data;
        if (low_stock && data) {
          filtered = data.filter((item: any) => item.current_stock <= item.minimum_stock);
        }
        result = { data: filtered, error: error?.message };
        break;
      }
      case "update_inventory": {
        const { id, ...updates } = params;
        const { data, error } = await supabase.from("inventory").update(updates).eq("id", id).select().single();
        result = { data, error: error?.message };
        break;
      }
      case "create_inventory": {
        const { data, error } = await supabase.from("inventory").insert(params).select().single();
        result = { data, error: error?.message };
        break;
      }
      case "delete_inventory": {
        const { id } = params;
        const { error } = await supabase.from("inventory").delete().eq("id", id);
        result = { success: !error, error: error?.message };
        break;
      }

      // ==================== SERVICES ====================
      case "list_services": {
        const { doctor_id } = params;
        let query = supabase.from("services").select("*");
        if (doctor_id) query = query.eq("doctor_id", doctor_id);
        const { data, error } = await query.order("nombre_servicio");
        result = { data, error: error?.message };
        break;
      }
      case "create_service": {
        const { data, error } = await supabase.from("services").insert(params).select().single();
        result = { data, error: error?.message };
        break;
      }
      case "update_service": {
        const { id, ...updates } = params;
        const { data, error } = await supabase.from("services").update(updates).eq("id", id).select().single();
        result = { data, error: error?.message };
        break;
      }

      // ==================== SOCIAL / POSTS ====================
      case "list_posts": {
        const { doctor_id, limit = 20, offset = 0 } = params;
        let query = supabase.from("posts").select("*");
        if (doctor_id) query = query.eq("doctor_id", doctor_id);
        const { data, error } = await query.range(offset, offset + limit - 1).order("created_at", { ascending: false });
        result = { data, error: error?.message };
        break;
      }
      case "create_post": {
        const { data, error } = await supabase.from("posts").insert(params).select().single();
        result = { data, error: error?.message };
        break;
      }
      case "update_post": {
        const { id, ...updates } = params;
        const { data, error } = await supabase.from("posts").update(updates).eq("id", id).select().single();
        result = { data, error: error?.message };
        break;
      }
      case "delete_post": {
        const { id } = params;
        const { error } = await supabase.from("posts").delete().eq("id", id);
        result = { success: !error, error: error?.message };
        break;
      }

      // ==================== PROFILES ====================
      case "list_profiles": {
        const { limit = 50, offset = 0 } = params;
        const { data, error } = await supabase.from("profiles").select("*").range(offset, offset + limit - 1);
        result = { data, error: error?.message };
        break;
      }
      case "get_profile": {
        const { id } = params;
        const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
        result = { data, error: error?.message };
        break;
      }
      case "update_profile": {
        const { id, ...updates } = params;
        const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select().single();
        result = { data, error: error?.message };
        break;
      }

      // ==================== ANALYTICS ====================
      case "get_dashboard_stats": {
        const { doctor_id } = params;
        const [patients, appointments, invoices, inventory] = await Promise.all([
          supabase.from("patients").select("id", { count: "exact", head: true }).eq("doctor_id", doctor_id),
          supabase.from("appointments").select("id", { count: "exact", head: true }).eq("doctor_id", doctor_id),
          supabase.from("invoices").select("id, total, payment_status").eq("doctor_id", doctor_id),
          supabase.from("inventory").select("id, current_stock, minimum_stock").eq("doctor_id", doctor_id),
        ]);
        const lowStock = inventory.data?.filter((i: any) => i.current_stock <= i.minimum_stock) || [];
        const totalRevenue = invoices.data?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;
        const pendingPayments = invoices.data?.filter((inv: any) => inv.payment_status === "PENDIENTE").length || 0;
        result = {
          data: {
            total_patients: patients.count || 0,
            total_appointments: appointments.count || 0,
            total_invoices: invoices.data?.length || 0,
            total_revenue: totalRevenue,
            pending_payments: pendingPayments,
            low_stock_items: lowStock.length,
            inventory_items: inventory.data?.length || 0,
          }
        };
        break;
      }

      // ==================== NOTIFICATIONS ====================
      case "list_notifications": {
        const { doctor_id, unread_only, limit = 20 } = params;
        let query = supabase.from("notifications").select("*").eq("doctor_id", doctor_id);
        if (unread_only) query = query.eq("is_read", false);
        const { data, error } = await query.limit(limit).order("created_at", { ascending: false });
        result = { data, error: error?.message };
        break;
      }
      case "create_notification": {
        const { data, error } = await supabase.from("notifications").insert(params).select().single();
        result = { data, error: error?.message };
        break;
      }

      // ==================== RIPS ====================
      case "list_rips_batches": {
        const { doctor_id, estado, limit = 20 } = params;
        let query = supabase.from("rips_batches").select("*");
        if (doctor_id) query = query.eq("doctor_id", doctor_id);
        if (estado) query = query.eq("estado", estado);
        const { data, error } = await query.limit(limit).order("created_at", { ascending: false });
        result = { data, error: error?.message };
        break;
      }

      // ==================== USER ROLES ====================
      case "list_user_roles": {
        const { user_id } = params;
        let query = supabase.from("user_roles").select("*");
        if (user_id) query = query.eq("user_id", user_id);
        const { data, error } = await query;
        result = { data, error: error?.message };
        break;
      }

      // ==================== PAYMENTS ====================
      case "list_payments": {
        const { doctor_id, invoice_id, limit = 50 } = params;
        let query = supabase.from("payments").select("*, invoices(patient_id, total)");
        if (doctor_id) query = query.eq("doctor_id", doctor_id);
        if (invoice_id) query = query.eq("invoice_id", invoice_id);
        const { data, error } = await query.limit(limit).order("created_at", { ascending: false });
        result = { data, error: error?.message };
        break;
      }
      case "create_payment": {
        const { data, error } = await supabase.from("payments").insert(params).select().single();
        result = { data, error: error?.message };
        break;
      }

      // ==================== VOICE RECORDINGS ====================
      case "list_voice_recordings": {
        const { doctor_id, patient_id, limit = 20 } = params;
        let query = supabase.from("voice_recordings").select("*");
        if (doctor_id) query = query.eq("doctor_id", doctor_id);
        if (patient_id) query = query.eq("patient_id", patient_id);
        const { data, error } = await query.limit(limit).order("created_at", { ascending: false });
        result = { data, error: error?.message };
        break;
      }

      // ==================== HELP ====================
      case "list_actions": {
        result = {
          data: {
            patients: ["list_patients", "get_patient", "create_patient", "update_patient", "delete_patient"],
            appointments: ["list_appointments", "get_appointment", "create_appointment", "update_appointment", "cancel_appointment"],
            medical_records: ["list_medical_records", "get_medical_record", "create_medical_record"],
            invoices: ["list_invoices", "create_invoice", "update_invoice"],
            inventory: ["list_inventory", "create_inventory", "update_inventory", "delete_inventory"],
            services: ["list_services", "create_service", "update_service"],
            posts: ["list_posts", "create_post", "update_post", "delete_post"],
            profiles: ["list_profiles", "get_profile", "update_profile"],
            analytics: ["get_dashboard_stats"],
            notifications: ["list_notifications", "create_notification"],
            rips: ["list_rips_batches"],
            payments: ["list_payments", "create_payment"],
            voice_recordings: ["list_voice_recordings"],
            user_roles: ["list_user_roles"],
            meta: ["list_actions"],
          }
        };
        break;
      }

      default:
        result = { error: `Unknown action: ${action}. Use 'list_actions' to see available actions.` };
    }

    return respond({ success: !result.error, ...result });
  } catch (error: unknown) {
    console.error("Twin agent API error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return respond({ success: false, error: msg }, 500);
  }

  function respond(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
