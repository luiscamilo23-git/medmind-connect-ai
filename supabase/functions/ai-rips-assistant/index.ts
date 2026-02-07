import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RIPSRecord {
  id?: string;
  patient_id: string;
  tipo_archivo: string;
  codigo_servicio: string;
  descripcion_servicio: string;
  codigo_diagnostico_principal?: string;
  codigo_diagnostico_relacionado?: string;
  valor_total: number;
  datos_json: any;
}

interface AIAnalysisResult {
  suggestedCUPS: {
    codigo: string;
    descripcion: string;
    confianza: number;
  }[];
  suggestedCIE10: {
    codigo: string;
    descripcion: string;
    confianza: number;
  }[];
  extractedData: {
    diagnosticos: string[];
    procedimientos: string[];
    valores: { concepto: string; monto: number }[];
  };
  validationErrors: {
    campo: string;
    error: string;
    sugerencia: string;
    severidad: "error" | "warning" | "info";
  }[];
  correctedRecords: RIPSRecord[];
  summary: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const requestData = await req.json();
    const { action, batchId, records, invoiceData, clinicalNotes, serviceDescription } = requestData;

    // Get doctor profile for context
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("specialty, full_name, clinic_name")
      .eq("id", user.id)
      .single();

    const doctorContext = profile 
      ? `Especialidad: ${profile.specialty || "Medicina General"}, Clínica: ${profile.clinic_name || profile.full_name}`
      : "Medicina General";

    let systemPrompt = "";
    let userPrompt = "";
    let tools: any[] = [];
    let tool_choice: any = "auto";

    switch (action) {
      case "suggest_cups":
        systemPrompt = `Eres un experto en codificación CUPS (Clasificación Única de Procedimientos en Salud) de Colombia.
Tu trabajo es analizar descripciones de servicios médicos y sugerir los códigos CUPS más apropiados.

Contexto del médico: ${doctorContext}

REGLAS IMPORTANTES:
1. Solo sugiere códigos CUPS válidos de la clasificación colombiana vigente
2. Proporciona múltiples opciones ordenadas por relevancia
3. Incluye un nivel de confianza (0-100) para cada sugerencia
4. Considera la especialidad del médico para contextualizar

Ejemplos de códigos CUPS comunes:
- 890201: Consulta de primera vez por medicina general
- 890301: Consulta de control o seguimiento por medicina general
- 890401: Consulta de primera vez por especialista
- 890501: Consulta de control por especialista
- 993500: Inyección o infiltración de sustancia terapéutica intraarticular`;

        userPrompt = `Analiza esta descripción de servicio y sugiere los códigos CUPS más apropiados:

"${serviceDescription}"

Proporciona 3-5 sugerencias con código, descripción y nivel de confianza.`;

        tools = [{
          type: "function",
          function: {
            name: "suggest_cups_codes",
            description: "Sugiere códigos CUPS para un servicio médico",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      codigo: { type: "string", description: "Código CUPS" },
                      descripcion: { type: "string", description: "Descripción del procedimiento" },
                      confianza: { type: "number", description: "Nivel de confianza 0-100" }
                    },
                    required: ["codigo", "descripcion", "confianza"]
                  }
                }
              },
              required: ["suggestions"]
            }
          }
        }];
        tool_choice = { type: "function", function: { name: "suggest_cups_codes" } };
        break;

      case "suggest_cie10":
        systemPrompt = `Eres un experto en codificación CIE-10 (Clasificación Internacional de Enfermedades) para Colombia.
Tu trabajo es analizar notas clínicas y sugerir los códigos de diagnóstico CIE-10 más apropiados.

Contexto del médico: ${doctorContext}

REGLAS IMPORTANTES:
1. Solo sugiere códigos CIE-10 válidos
2. Distingue entre diagnóstico principal y relacionados
3. Proporciona nivel de confianza (0-100) para cada sugerencia
4. Considera la especialidad para contextualizar
5. Prioriza diagnósticos específicos sobre generales (Ej: J02.9 vs J02.0)

Ejemplos de códigos CIE-10:
- Z00.0: Examen médico general
- J00: Rinofaringitis aguda (resfriado común)
- J02.9: Faringitis aguda, no especificada
- K29.7: Gastritis, no especificada
- M54.5: Dolor en región lumbar`;

        userPrompt = `Analiza estas notas clínicas y sugiere códigos CIE-10 apropiados:

"${clinicalNotes}"

Proporciona diagnósticos principal y relacionados con nivel de confianza.`;

        tools = [{
          type: "function",
          function: {
            name: "suggest_cie10_codes",
            description: "Sugiere códigos CIE-10 basado en notas clínicas",
            parameters: {
              type: "object",
              properties: {
                diagnostico_principal: {
                  type: "object",
                  properties: {
                    codigo: { type: "string" },
                    descripcion: { type: "string" },
                    confianza: { type: "number" }
                  },
                  required: ["codigo", "descripcion", "confianza"]
                },
                diagnosticos_relacionados: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      codigo: { type: "string" },
                      descripcion: { type: "string" },
                      confianza: { type: "number" }
                    },
                    required: ["codigo", "descripcion", "confianza"]
                  }
                }
              },
              required: ["diagnostico_principal"]
            }
          }
        }];
        tool_choice = { type: "function", function: { name: "suggest_cie10_codes" } };
        break;

      case "extract_invoice_data":
        systemPrompt = `Eres un experto en extracción de datos para RIPS (Registro Individual de Prestación de Servicios) en Colombia.
Tu trabajo es analizar datos de facturas médicas y extraer la información necesaria para generar registros RIPS.

Contexto: ${doctorContext}

REGLAS:
1. Extrae diagnósticos mencionados en las notas
2. Identifica procedimientos realizados
3. Calcula valores correctamente (subtotales, impuestos, totales)
4. Mapea tipos de servicio a tipos de archivo RIPS:
   - AC: Consultas
   - AP: Procedimientos
   - AU: Urgencias
   - AH: Hospitalizaciones
   - AN: Recién nacidos
   - AM: Medicamentos
   - AT: Otros servicios`;

        userPrompt = `Extrae datos RIPS de esta información de factura:

${JSON.stringify(invoiceData, null, 2)}

Identifica diagnósticos, procedimientos, valores y genera estructura RIPS.`;

        tools = [{
          type: "function",
          function: {
            name: "extract_rips_data",
            description: "Extrae datos estructurados para RIPS de una factura",
            parameters: {
              type: "object",
              properties: {
                diagnosticos: {
                  type: "array",
                  items: { type: "string" }
                },
                procedimientos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      descripcion: { type: "string" },
                      codigo_cups_sugerido: { type: "string" },
                      tipo_archivo: { type: "string", enum: ["AC", "AP", "AU", "AH", "AN", "AM", "AT"] }
                    }
                  }
                },
                valores: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      concepto: { type: "string" },
                      monto: { type: "number" }
                    }
                  }
                },
                diagnostico_principal_sugerido: {
                  type: "object",
                  properties: {
                    codigo: { type: "string" },
                    descripcion: { type: "string" }
                  }
                }
              },
              required: ["diagnosticos", "procedimientos", "valores"]
            }
          }
        }];
        tool_choice = { type: "function", function: { name: "extract_rips_data" } };
        break;

      case "validate_and_correct":
        // Get batch data and records
        let batchRecords = records;
        if (batchId && !records) {
          const { data: fetchedRecords, error: recordsError } = await supabaseClient
            .from("rips_records")
            .select("*, patients(*)")
            .eq("rips_batch_id", batchId);
          
          if (recordsError) throw recordsError;
          batchRecords = fetchedRecords;
        }

        systemPrompt = `Eres un experto validador de RIPS según la Resolución 2275/2023 de Colombia.
Tu trabajo es validar registros RIPS y sugerir correcciones cuando encuentres errores.

Contexto: ${doctorContext}

VALIDACIONES REQUERIDAS:
1. Códigos CUPS válidos y existentes
2. Códigos CIE-10 válidos y existentes
3. Tipos de archivo correctos (AC, AP, AU, AH, AN, AM, AT)
4. Valores numéricos positivos y coherentes
5. Fechas válidas y lógicas
6. Campos obligatorios presentes
7. Formato de documentos de identidad
8. Coherencia entre tipo de servicio y tipo de archivo

CAMPOS OBLIGATORIOS POR TIPO:
- AC (Consultas): código consulta, finalidad, diagnóstico principal
- AP (Procedimientos): código procedimiento, ámbito realización, diagnóstico
- Todos: documento paciente, fecha, valores

SEVERIDADES:
- error: Bloquea la validación, debe corregirse
- warning: Puede causar rechazo, recomendado corregir
- info: Sugerencia de mejora`;

        userPrompt = `Valida estos registros RIPS y sugiere correcciones:

${JSON.stringify(batchRecords, null, 2)}

Identifica errores, warnings y sugerencias de corrección para cada campo problemático.`;

        tools = [{
          type: "function",
          function: {
            name: "validate_rips_records",
            description: "Valida registros RIPS y sugiere correcciones",
            parameters: {
              type: "object",
              properties: {
                is_valid: { type: "boolean" },
                total_errors: { type: "number" },
                total_warnings: { type: "number" },
                validation_issues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      record_index: { type: "number" },
                      campo: { type: "string" },
                      valor_actual: { type: "string" },
                      error: { type: "string" },
                      sugerencia: { type: "string" },
                      valor_corregido: { type: "string" },
                      severidad: { type: "string", enum: ["error", "warning", "info"] }
                    },
                    required: ["campo", "error", "sugerencia", "severidad"]
                  }
                },
                summary: { type: "string" }
              },
              required: ["is_valid", "total_errors", "total_warnings", "validation_issues", "summary"]
            }
          }
        }];
        tool_choice = { type: "function", function: { name: "validate_rips_records" } };
        break;

      case "auto_complete":
        // Complete RIPS batch with AI assistance
        const { data: batchData, error: batchError } = await supabaseClient
          .from("rips_batches")
          .select("*")
          .eq("id", batchId)
          .single();

        if (batchError) throw batchError;

        const { data: batchRecordsData, error: batchRecordsError } = await supabaseClient
          .from("rips_records")
          .select("*, patients(*), invoices(*)")
          .eq("rips_batch_id", batchId);

        if (batchRecordsError) throw batchRecordsError;

        systemPrompt = `Eres un asistente experto en completar registros RIPS según la Resolución 2275/2023.
Tu trabajo es analizar registros RIPS incompletos y completarlos con datos apropiados.

Contexto: ${doctorContext}

TAREAS:
1. Sugerir códigos CUPS faltantes basados en descripción del servicio
2. Sugerir códigos CIE-10 basados en información del paciente/servicio
3. Completar campos obligatorios con valores por defecto apropiados
4. Validar coherencia de los datos

VALORES POR DEFECTO COMUNES:
- Finalidad consulta: "10" (Atención del parto - No aplica si no es parto)
- Causa motivo atención: "01" (Nuevo)
- Tipo diagnóstico principal: "1" (Impresión diagnóstica)
- Ámbito procedimiento: "1" (Ambulatorio)`;

        userPrompt = `Completa estos registros RIPS con la información faltante:

Lote: ${JSON.stringify(batchData, null, 2)}

Registros: ${JSON.stringify(batchRecordsData, null, 2)}

Proporciona sugerencias para completar campos faltantes y mejorar la calidad de los datos.`;

        tools = [{
          type: "function",
          function: {
            name: "complete_rips_records",
            description: "Completa registros RIPS con datos faltantes",
            parameters: {
              type: "object",
              properties: {
                completed_records: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      record_id: { type: "string" },
                      updates: {
                        type: "object",
                        properties: {
                          codigo_servicio: { type: "string" },
                          codigo_diagnostico_principal: { type: "string" },
                          codigo_diagnostico_relacionado: { type: "string" },
                          tipo_diagnostico_principal: { type: "string" },
                          datos_json_updates: { type: "object" }
                        }
                      },
                      confidence: { type: "number" },
                      reasoning: { type: "string" }
                    },
                    required: ["record_id", "updates", "confidence", "reasoning"]
                  }
                },
                summary: { type: "string" }
              },
              required: ["completed_records", "summary"]
            }
          }
        }];
        tool_choice = { type: "function", function: { name: "complete_rips_records" } };
        break;

      default:
        throw new Error(`Acción no válida: ${action}`);
    }

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice,
        temperature: 0.3, // Lower temperature for more consistent coding
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Contacta al administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error("Error en el servicio de IA");
    }

    const aiData = await aiResponse.json();
    
    // Extract tool call result
    let result: any = null;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Error parsing AI response:", e);
        throw new Error("Error al procesar respuesta de IA");
      }
    }

    // If action is auto_complete and user confirmed, apply the updates
    if (action === "apply_ai_corrections" && requestData.corrections) {
      for (const correction of requestData.corrections) {
        const { error: updateError } = await supabaseClient
          .from("rips_records")
          .update({
            codigo_servicio: correction.updates.codigo_servicio,
            codigo_diagnostico_principal: correction.updates.codigo_diagnostico_principal,
            codigo_diagnostico_relacionado: correction.updates.codigo_diagnostico_relacionado,
            tipo_diagnostico_principal: correction.updates.tipo_diagnostico_principal,
            datos_json: correction.updates.datos_json_updates 
              ? { ...correction.datos_json, ...correction.updates.datos_json_updates }
              : undefined,
          })
          .eq("id", correction.record_id);

        if (updateError) {
          console.error("Error updating record:", updateError);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Correcciones aplicadas correctamente" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        action,
        result 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("AI RIPS Assistant error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
