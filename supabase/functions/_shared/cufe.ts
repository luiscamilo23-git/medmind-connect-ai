/**
 * Motor CUFE — Código Único de Factura Electrónica
 *
 * Implementa la fórmula oficial de la DIAN según:
 * - Resolución 000042 de 2020
 * - Anexo Técnico Factura Electrónica v1.9
 *
 * CUFE = SHA-384(cadena de concatenación)
 * Resultado: string hexadecimal de 96 caracteres
 */

export interface CUFEInput {
  /** Número completo de la factura (ej: "SEMD-000001") */
  numeroFactura: string;
  /** Fecha de emisión ISO (YYYY-MM-DD) */
  fechaFactura: string;
  /** Hora de emisión (HH:mm:ss) */
  horaFactura: string;
  /** Valor de la factura antes de impuestos (2 decimales, ej: "150000.00") */
  valorFactura: string;
  /** Código del impuesto 1 (01=IVA, 04=INC, ZY=no aplica) */
  codImpuesto1: string;
  /** Valor del impuesto 1 (2 decimales, "0.00" si no aplica) */
  valorImpuesto1: string;
  /** Código impuesto 2 (ZY si no aplica) */
  codImpuesto2: string;
  /** Valor impuesto 2 */
  valorImpuesto2: string;
  /** Código impuesto 3 (ZY si no aplica) */
  codImpuesto3: string;
  /** Valor impuesto 3 */
  valorImpuesto3: string;
  /** Valor total de la factura (2 decimales) */
  valorTotal: string;
  /** Tipo de documento del NIT emisor (31 para NIT) */
  tipoDocEmisor: string;
  /** NIT del emisor SIN dígito verificador */
  nitEmisor: string;
  /** Tipo de documento del adquirente (13=CC, 31=NIT, 22=CE, etc.) */
  tipoDocAdquirente: string;
  /** Número de documento del adquirente */
  numDocAdquirente: string;
  /** TechnicalKey / ClaveAcceso de la resolución DIAN */
  claveAcceso: string;
}

/**
 * Calcula el CUFE de una factura electrónica colombiana.
 * Usa SubtleCrypto (disponible en Deno y navegadores modernos).
 */
export async function calcularCUFE(input: CUFEInput): Promise<string> {
  const cadena = [
    input.numeroFactura,
    input.fechaFactura,
    input.horaFactura,
    input.valorFactura,
    input.codImpuesto1,
    input.valorImpuesto1,
    input.codImpuesto2,
    input.valorImpuesto2,
    input.codImpuesto3,
    input.valorImpuesto3,
    input.valorTotal,
    input.tipoDocEmisor,
    input.nitEmisor,
    input.tipoDocAdquirente,
    input.numDocAdquirente,
    input.claveAcceso,
  ].join("");

  const encoder = new TextEncoder();
  const data = encoder.encode(cadena);

  const hashBuffer = await crypto.subtle.digest("SHA-384", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex; // 96 caracteres hexadecimales
}

/**
 * Formatea un valor numérico al formato requerido por DIAN para CUFE.
 * Siempre 2 decimales, sin separador de miles.
 */
export function formatearValorCUFE(valor: number): string {
  return valor.toFixed(2);
}

/**
 * Determina el código de impuesto según el porcentaje.
 * 01 = IVA, 04 = INC, ZY = No aplica (sector salud generalmente exento)
 */
export function codigoImpuestoDIAN(porcentaje: number): string {
  if (porcentaje === 0) return "ZY";
  if (porcentaje === 19 || porcentaje === 5 || porcentaje === 0) return "01"; // IVA
  return "ZY";
}
