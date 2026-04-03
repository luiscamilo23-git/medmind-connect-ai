/**
 * generate-rips — Genera el JSON RIPS completo según Resolución 2275 de 2023
 *
 * Tipos implementados: AC, AP, AU, AH, AN, AM, AT (los 7 tipos)
 * Vincula el RIPS con el CUFE de la factura DIAN
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fv = (v: unknown): number => parseFloat(String(v ?? 0)) || 0;
const fs = (v: unknown): string => String(v ?? "").trim();
const numDoc = (p: Record<string, unknown>): string => fs(p.document_number || p.phone || "0");
const tipoDoc = (p: Record<string, unknown>): string => fs(p.document_type || "CC");

function baseRecord(r: Record<string, unknown>, p: Record<string, unknown>) {
  return {
    numeroFactura: fs(r.invoice_id).slice(0, 20) || "00000000",
    numeroDocumentoIdentificacion: numDoc(p),
    tipoDocumentoIdentificacion: tipoDoc(p),
    numeroAutorizacion: fs(r.numero_autorizacion) || "",
  };
}

// ─── Generadores por tipo ─────────────────────────────────────────────────────

function generarAC(records: Record<string, unknown>[]) {
  return records.map((r) => {
    const p = (r.patients ?? {}) as Record<string, unknown>;
    return {
      ...baseRecord(r, p),
      fechaConsulta: fs(r.fecha_inicio_atencion),
      codigoConsulta: fs(r.codigo_servicio),
      finalidadConsulta: fs((r.datos_json as Record<string, unknown>)?.finalidadConsulta ?? "10"),
      causaMotivoAtencion: fs((r.datos_json as Record<string, unknown>)?.causaMotivoAtencion ?? "01"),
      codDiagnosticoPrincipal: fs(r.codigo_diagnostico_principal) || "Z000",
      codDiagnosticoRelacionado1: fs(r.codigo_diagnostico_relacionado) || "",
      codDiagnosticoRelacionado2: "",
      codDiagnosticoRelacionado3: "",
      tipoDiagnosticoPrincipal: fs(r.tipo_diagnostico_principal) || "1",
      valorConsulta: fv(r.valor_total),
      valorCuotaModeradora: fv(r.copago),
      valorNetoPagar: fv(r.valor_neto),
    };
  });
}

function generarAP(records: Record<string, unknown>[]) {
  return records.map((r) => {
    const p = (r.patients ?? {}) as Record<string, unknown>;
    return {
      ...baseRecord(r, p),
      fechaProcedimiento: fs(r.fecha_inicio_atencion),
      codigoProcedimiento: fs(r.codigo_servicio),
      ambitoRealizacion: "1", // 1=Ambulatorio
      finalidadProcedimiento: "1",
      personalAtiende: "01",
      codDiagnosticoPrincipal: fs(r.codigo_diagnostico_principal) || "Z000",
      codDiagnosticoRelacionado: fs(r.codigo_diagnostico_relacionado) || "",
      complicacion: "",
      formaPagoQuirurgico: "1",
      valorProcedimiento: fv(r.valor_total),
      valorCuotaModeradora: fv(r.copago),
      valorNetoPagar: fv(r.valor_neto),
    };
  });
}

function generarAU(records: Record<string, unknown>[]) {
  return records.map((r) => {
    const p = (r.patients ?? {}) as Record<string, unknown>;
    const datos = (r.datos_json ?? {}) as Record<string, unknown>;
    return {
      ...baseRecord(r, p),
      fechaInicioAtencion: fs(r.fecha_inicio_atencion),
      fechaEgresoAtencion: fs(r.fecha_fin_atencion || r.fecha_inicio_atencion),
      causaMotivoAtencion: fs(datos.causaMotivoAtencion ?? "01"),
      codDiagnosticoPrincipal: fs(r.codigo_diagnostico_principal) || "Z000",
      codDiagnosticoRelacionado1: fs(r.codigo_diagnostico_relacionado) || "",
      codDiagnosticoRelacionado2: "",
      codDiagnosticoRelacionado3: "",
      codDiagnosticoComplicacion: fs(datos.codDiagnosticoComplicacion ?? ""),
      condicionSalidaPaciente: fs(datos.condicionSalidaPaciente ?? "1"),
      codProcedimientoDx: fs(datos.codProcedimientoDx ?? ""),
      valorUrgencias: fv(r.valor_total),
      valorCuotaModeradora: fv(r.copago),
      valorNetoPagar: fv(r.valor_neto),
    };
  });
}

function generarAH(records: Record<string, unknown>[]) {
  return records.map((r) => {
    const p = (r.patients ?? {}) as Record<string, unknown>;
    const datos = (r.datos_json ?? {}) as Record<string, unknown>;
    return {
      ...baseRecord(r, p),
      viaIngresoServicioSalud: fs(datos.viaIngreso ?? "1"),
      fechaInicioHospitalizacion: fs(r.fecha_inicio_atencion),
      fechaEgresoHospitalizacion: fs(r.fecha_fin_atencion || r.fecha_inicio_atencion),
      causaMotivoAtencion: fs(datos.causaMotivoAtencion ?? "01"),
      codDiagnosticoPrincipal: fs(r.codigo_diagnostico_principal) || "Z000",
      codDiagnosticoRelacionado1: fs(r.codigo_diagnostico_relacionado) || "",
      codDiagnosticoComplicacion: fs(datos.codDiagnosticoComplicacion ?? ""),
      condicionSalidaPaciente: fs(datos.condicionSalidaPaciente ?? "1"),
      codProcedimientoQuirurgico1: fs(datos.codProcedimientoQuirurgico1 ?? ""),
      valorHospitalizacion: fv(r.valor_total),
      valorCuotaRecuperacion: fv(datos.valorCuotaRecuperacion ?? 0),
      valorNetoPagar: fv(r.valor_neto),
    };
  });
}

function generarAN(records: Record<string, unknown>[]) {
  return records.map((r) => {
    const p = (r.patients ?? {}) as Record<string, unknown>;
    const datos = (r.datos_json ?? {}) as Record<string, unknown>;
    return {
      ...baseRecord(r, p),
      fechaNacimiento: fs(datos.fechaNacimiento ?? r.fecha_inicio_atencion),
      edadGestacional: Number(datos.edadGestacional ?? 40),
      numConsultasPrenatal: Number(datos.numConsultasPrenatal ?? 0),
      codSexoBiologico: fs(datos.codSexoBiologico ?? "M"),
      peso: Number(datos.peso ?? 3500),
      codDiagnosticoPrincipal: fs(r.codigo_diagnostico_principal) || "Z380",
      condicionNacimiento: fs(datos.condicionNacimiento ?? "1"),
      codDiagnosticoComplicacion: fs(datos.codDiagnosticoComplicacion ?? ""),
      condicionSalidaNeonato: fs(datos.condicionSalidaNeonato ?? "1"),
      valorRecienNacido: fv(r.valor_total),
      valorCuotaModeradora: fv(r.copago),
      valorNetoPagar: fv(r.valor_neto),
    };
  });
}

function generarAM(records: Record<string, unknown>[]) {
  return records.map((r) => {
    const p = (r.patients ?? {}) as Record<string, unknown>;
    const datos = (r.datos_json ?? {}) as Record<string, unknown>;
    return {
      ...baseRecord(r, p),
      fechaDispensacion: fs(r.fecha_inicio_atencion),
      codigoMedicamento: fs(r.codigo_servicio),         // Código INVIMA o ATC
      tipoMedicamento: fs(datos.tipoMedicamento ?? "1"),// 1=Medicamento PBS, 2=No PBS
      nombreGenericoMedicamento: fs(datos.nombreGenerico ?? r.descripcion_servicio),
      concentracionMedicamento: fs(datos.concentracion ?? ""),
      unidadMedidaMedicamento: fs(datos.unidadMedida ?? "UN"),
      formaFarmaceutica: fs(datos.formaFarmaceutica ?? ""),
      unidadesMedicamentoDispensadas: Number(datos.unidades ?? 1),
      valorUnitarioMedicamento: fv(datos.valorUnitario ?? r.valor_total),
      valorTotalMedicamento: fv(r.valor_total),
      valorCopago: fv(r.copago),
      valorNetoPagar: fv(r.valor_neto),
    };
  });
}

function generarAT(records: Record<string, unknown>[]) {
  return records.map((r) => {
    const p = (r.patients ?? {}) as Record<string, unknown>;
    const datos = (r.datos_json ?? {}) as Record<string, unknown>;
    return {
      ...baseRecord(r, p),
      fechaAtencion: fs(r.fecha_inicio_atencion),
      codigoServicio: fs(r.codigo_servicio),
      cantidadServicio: Number(datos.cantidad ?? 1),
      codDiagnosticoPrincipal: fs(r.codigo_diagnostico_principal) || "Z000",
      valorServicio: fv(r.valor_total),
      valorCopago: fv(r.copago),
      valorNetoPagar: fv(r.valor_neto),
    };
  });
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const { batchId } = await req.json();
    if (!batchId) throw new Error("batchId es requerido");

    const { data: batch, error: batchError } = await supabaseClient
      .from("rips_batches")
      .select("*")
      .eq("id", batchId)
      .single();

    if (batchError) throw batchError;

    const { data: records, error: recordsError } = await supabaseClient
      .from("rips_records")
      .select("*, patients(*)")
      .eq("rips_batch_id", batchId);

    if (recordsError) throw recordsError;

    const { data: { user } } = await supabaseClient.auth.getUser();

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    // Intentar obtener NIT de dian_software_config (Software Propio)
    const { data: dianConfig } = await supabaseClient
      .from("dian_software_config")
      .select("nit, dv, nombre_empresa")
      .eq("doctor_id", user?.id)
      .maybeSingle();

    const nitPrestador = dianConfig
      ? `${dianConfig.nit}-${dianConfig.dv}`
      : (profile?.license_number || "000000000-0");

    const nombrePrestador = dianConfig?.nombre_empresa
      || profile?.clinic_name
      || profile?.full_name
      || "MEDMIND";

    // Agrupar por tipo
    const byType: Record<string, Record<string, unknown>[]> = {};
    for (const r of (records ?? []) as Record<string, unknown>[]) {
      const t = String(r.tipo_archivo);
      if (!byType[t]) byType[t] = [];
      byType[t].push(r);
    }

    // Obtener CUFE de la primera factura del batch (para vincular RIPS-DIAN)
    const invoiceIds = [...new Set((records ?? []).map((r: Record<string, unknown>) => r.invoice_id).filter(Boolean))];
    let cufeFactura: string | null = null;
    let numFactura: string | null = null;
    if (invoiceIds.length > 0) {
      const { data: inv } = await supabaseClient
        .from("invoices")
        .select("cufe, numero_factura_dian")
        .eq("id", invoiceIds[0])
        .maybeSingle();
      cufeFactura = inv?.cufe ?? null;
      numFactura = inv?.numero_factura_dian ?? null;
    }

    // Estructura raíz Resolución 2275/2023
    const ripsJSON: Record<string, unknown> = {
      numDocumentoIdObligado: nitPrestador,
      numFactura: numFactura ?? batch.pagador ?? `RIPS-${batchId.slice(0, 8)}`,
      tipoNota: null,
      numNota: null,
      // Vinculo DIAN (campo adicional MEDMIND)
      ...(cufeFactura ? { cufeFactura } : {}),
      // Cabecera
      _meta: {
        version: "2275/2023",
        fechaGeneracion: new Date().toISOString(),
        nombrePrestador,
        periodo: { fechaInicio: batch.fecha_inicio, fechaFin: batch.fecha_fin },
        pagador: { nombre: batch.pagador, nit: batch.nit_pagador },
        totales: { totalRegistros: (records ?? []).length, totalValor: batch.total_valor },
      },
    };

    // Agregar registros por tipo
    if (byType["AC"]?.length) ripsJSON.consultas = generarAC(byType["AC"]);
    if (byType["AP"]?.length) ripsJSON.procedimientos = generarAP(byType["AP"]);
    if (byType["AU"]?.length) ripsJSON.urgencias = generarAU(byType["AU"]);
    if (byType["AH"]?.length) ripsJSON.hospitalizacion = generarAH(byType["AH"]);
    if (byType["AN"]?.length) ripsJSON.recienNacidos = generarAN(byType["AN"]);
    if (byType["AM"]?.length) ripsJSON.medicamentos = generarAM(byType["AM"]);
    if (byType["AT"]?.length) ripsJSON.otrosServicios = generarAT(byType["AT"]);

    // Guardar en DB
    await supabaseClient
      .from("rips_batches")
      .update({
        json_data: ripsJSON,
        estado: "GENERADO",
        total_registros: (records ?? []).length,
        archivo_rips_url: `rips_${nitPrestador}_${batchId}.json`,
      })
      .eq("id", batchId);

    await supabaseClient.from("rips_validation_logs").insert([{
      rips_batch_id: batchId,
      tipo_validacion: "GENERACION",
      resultado: "EXITOSO",
      detalles: `Generados ${(records ?? []).length} registros RIPS (7 tipos: AC,AP,AU,AH,AN,AM,AT)`,
      validado_por: "SISTEMA",
    }]);

    return new Response(
      JSON.stringify({ success: true, message: "RIPS generado correctamente", data: ripsJSON }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Error desconocido" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
