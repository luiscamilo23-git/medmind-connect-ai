import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    if (!batch.json_data) {
      throw new Error("Debe generar el RIPS antes de validarlo");
    }

    // Validaciones según Resolución 2275/2023
    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];

    const ripsData = batch.json_data;

    // 1. Validar campos obligatorios del encabezado
    if (!ripsData.nit_prestador || ripsData.nit_prestador === "000000000-0") {
      validationErrors.push("NIT del prestador no configurado");
    }

    if (!ripsData.nombre_prestador) {
      validationErrors.push("Nombre del prestador no configurado");
    }

    // 2. Validar estructura de archivos
    if (!ripsData.archivos || Object.keys(ripsData.archivos).length === 0) {
      validationErrors.push("No hay archivos RIPS generados");
    }

    // 3. Validar registros individuales
    let totalRecords = 0;
    for (const [fileType, fileData] of Object.entries(ripsData.archivos)) {
      const file = fileData as any;
      
      if (!file.registros || file.registros.length === 0) {
        validationWarnings.push(`Archivo ${fileType} no contiene registros`);
        continue;
      }

      totalRecords += file.registros.length;

      // Validar cada registro
      file.registros.forEach((record: any, index: number) => {
        // Validar documento de identificación
        if (!record.numeroDocumentoIdentificacion || record.numeroDocumentoIdentificacion === "0") {
          validationWarnings.push(
            `${fileType} - Registro ${index + 1}: Documento de identificación inválido`
          );
        }

        // Validar código de servicio/consulta/procedimiento
        const codigoField = 
          fileType === "AC" ? "codigoConsulta" :
          fileType === "AP" ? "codigoProcedimiento" : "codigoServicio";
        
        if (!record[codigoField]) {
          validationErrors.push(
            `${fileType} - Registro ${index + 1}: Código de servicio obligatorio`
          );
        }

        // Validar diagnóstico principal
        if (!record.codDiagnosticoPrincipal) {
          validationWarnings.push(
            `${fileType} - Registro ${index + 1}: Diagnóstico principal recomendado`
          );
        }

        // Validar valores monetarios
        const valorField = 
          fileType === "AC" ? "valorConsulta" :
          fileType === "AP" ? "valorProcedimiento" : "valor";

        if (!record[valorField] || record[valorField] <= 0) {
          validationErrors.push(
            `${fileType} - Registro ${index + 1}: Valor debe ser mayor a cero`
          );
        }
      });
    }

    // 4. Validar totales
    if (totalRecords !== batch.total_registros) {
      validationWarnings.push(
        `Total de registros no coincide: JSON=${totalRecords}, DB=${batch.total_registros}`
      );
    }

    // Determinar resultado de validación
    const isValid = validationErrors.length === 0;
    const newStatus = isValid ? "VALIDADO" : "RECHAZADO";

    // Actualizar estado del lote
    const { error: updateError } = await supabaseClient
      .from("rips_batches")
      .update({
        estado: newStatus,
        errores_validacion: validationErrors.length > 0 ? {
          errores: validationErrors,
          advertencias: validationWarnings,
        } : null,
        fecha_validacion: new Date().toISOString(),
      })
      .eq("id", batchId);

    if (updateError) throw updateError;

    // Registrar log de validación
    await supabaseClient.from("rips_validation_logs").insert([{
      rips_batch_id: batchId,
      tipo_validacion: "MECANISMO_UNICO",
      resultado: isValid ? "VALIDADO" : "RECHAZADO",
      errores: validationErrors.length > 0 ? validationErrors : null,
      warnings: validationWarnings.length > 0 ? validationWarnings : null,
      detalles: `Validación ${isValid ? "exitosa" : "fallida"}. ${validationErrors.length} errores, ${validationWarnings.length} advertencias`,
      validado_por: "SISTEMA_VALIDACION",
    }]);

    return new Response(
      JSON.stringify({
        success: isValid,
        message: isValid 
          ? "RIPS validado correctamente"
          : "RIPS rechazado - revise los errores",
        validation: {
          estado: newStatus,
          errores: validationErrors,
          advertencias: validationWarnings,
          total_registros: totalRecords,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error validating RIPS:", error);
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
