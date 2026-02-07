import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RIPSRecord {
  tipo_archivo: string;
  patient_id: string;
  datos_json: any;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { batchId } = await req.json();

    if (!batchId) {
      throw new Error("batchId es requerido");
    }

    // Obtener el lote RIPS
    const { data: batch, error: batchError } = await supabaseClient
      .from("rips_batches")
      .select("*")
      .eq("id", batchId)
      .single();

    if (batchError) throw batchError;

    // Obtener registros del lote
    const { data: records, error: recordsError } = await supabaseClient
      .from("rips_records")
      .select(`
        *,
        patients(*)
      `)
      .eq("rips_batch_id", batchId);

    if (recordsError) throw recordsError;

    // Obtener perfil del doctor
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    // Agrupar registros por tipo de archivo
    const recordsByType: Record<string, any[]> = {};
    records.forEach((record: any) => {
      if (!recordsByType[record.tipo_archivo]) {
        recordsByType[record.tipo_archivo] = [];
      }
      recordsByType[record.tipo_archivo].push(record);
    });

    // Generar estructura RIPS según Resolución 2275/2023
    const ripsJSON: any = {
      version: "1.0",
      resolucion: "2275/2023",
      nit_prestador: profile?.license_number || "000000000-0",
      nombre_prestador: profile?.clinic_name || profile?.full_name || "MEDMIND",
      fecha_generacion: new Date().toISOString(),
      periodo: {
        fecha_inicio: batch.fecha_inicio,
        fecha_fin: batch.fecha_fin,
      },
      pagador: {
        nombre: batch.pagador,
        nit: batch.nit_pagador,
      },
      totales: {
        total_registros: records.length,
        total_valor: batch.total_valor,
      },
      archivos: {},
    };

    // AC - Consultas
    if (recordsByType["AC"]) {
      ripsJSON.archivos.AC = {
        tipo: "Consultas",
        cantidad: recordsByType["AC"].length,
        registros: recordsByType["AC"].map((r: any) => ({
          numeroFactura: r.invoice_id?.slice(0, 8) || "00000000",
          numeroDocumentoIdentificacion: r.patients.phone || "0",
          tipoDocumentoIdentificacion: "CC",
          fechaConsulta: r.fecha_inicio_atencion,
          numeroAutorizacion: r.numero_autorizacion || "",
          codigoConsulta: r.codigo_servicio,
          finalidadConsulta: "10",
          causaMotivoAtencion: "01",
          codDiagnosticoPrincipal: r.codigo_diagnostico_principal || "Z000",
          codDiagnosticoRelacionado1: r.codigo_diagnostico_relacionado || "",
          codDiagnosticoRelacionado2: "",
          codDiagnosticoRelacionado3: "",
          tipoDiagnosticoPrincipal: r.tipo_diagnostico_principal || "1",
          valorConsulta: parseFloat(r.valor_total),
          valorCuotaModeradora: parseFloat(r.copago),
          valorNetoPagar: parseFloat(r.valor_neto),
        })),
      };
    }

    // AP - Procedimientos
    if (recordsByType["AP"]) {
      ripsJSON.archivos.AP = {
        tipo: "Procedimientos",
        cantidad: recordsByType["AP"].length,
        registros: recordsByType["AP"].map((r: any) => ({
          numeroFactura: r.invoice_id?.slice(0, 8) || "00000000",
          numeroDocumentoIdentificacion: r.patients.phone || "0",
          tipoDocumentoIdentificacion: "CC",
          fechaProcedimiento: r.fecha_inicio_atencion,
          numeroAutorizacion: r.numero_autorizacion || "",
          codigoProcedimiento: r.codigo_servicio,
          ambitoRealizacion: "1",
          finalidadProcedimiento: "1",
          personalAtiende: "01",
          codDiagnosticoPrincipal: r.codigo_diagnostico_principal || "Z000",
          codDiagnosticoRelacionado: r.codigo_diagnostico_relacionado || "",
          complicacion: "",
          formaPagoQuirurgico: "1",
          valorProcedimiento: parseFloat(r.valor_total),
          valorCuotaModeradora: parseFloat(r.copago),
          valorNetoPagar: parseFloat(r.valor_neto),
        })),
      };
    }

    // Actualizar el lote con el JSON generado
    const { error: updateError } = await supabaseClient
      .from("rips_batches")
      .update({
        json_data: ripsJSON,
        estado: "GENERADO",
        archivo_rips_url: `rips_${batchId}.json`,
      })
      .eq("id", batchId);

    if (updateError) throw updateError;

    // Registrar log de validación
    await supabaseClient.from("rips_validation_logs").insert([{
      rips_batch_id: batchId,
      tipo_validacion: "GENERACION",
      resultado: "EXITOSO",
      detalles: `Generados ${records.length} registros RIPS`,
      validado_por: "SISTEMA",
    }]);

    return new Response(
      JSON.stringify({
        success: true,
        message: "RIPS generado correctamente",
        data: ripsJSON,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating RIPS:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
