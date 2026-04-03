/**
 * Generador de números de factura con control de secuencia
 * Previene duplicados usando SELECT ... FOR UPDATE
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface InvoiceNumberResult {
  numero: string;       // Número completo (ej: "SEMD-000001")
  secuencia: number;    // Solo el número (1)
}

/**
 * Obtiene el siguiente número de factura de forma atómica.
 * Usa una función PostgreSQL con lock para evitar duplicados concurrentes.
 */
export async function siguienteNumeroFactura(
  supabase: SupabaseClient,
  doctorId: string,
): Promise<InvoiceNumberResult> {
  const { data, error } = await supabase.rpc("get_next_invoice_number", {
    p_doctor_id: doctorId,
  });

  if (error) throw new Error(`Error al generar número de factura: ${error.message}`);

  return {
    numero: data.numero,
    secuencia: data.secuencia,
  };
}
