/**
 * Validación y formateo de NIT colombiano
 * Algoritmo módulo 11 según estándar DIAN
 */

const PRIMOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/**
 * Calcula el dígito verificador de un NIT colombiano.
 * @param nit - NIT sin dígito verificador (solo dígitos)
 * @returns dígito verificador (0-9)
 */
export function calcularDV(nit: string): number {
  const digits = nit.replace(/\D/g, "").split("").map(Number);
  if (digits.length > PRIMOS.length) throw new Error("NIT demasiado largo");

  const sum = digits
    .reverse()
    .reduce((acc, d, i) => acc + d * PRIMOS[i], 0);

  const rem = sum % 11;
  return rem > 1 ? 11 - rem : rem;
}

/**
 * Valida que un NIT con dígito verificador sea correcto.
 * @param nitCompleto - NIT con dígito verificador (ej: "9001234565" o "900123456-5")
 */
export function validarNIT(nitCompleto: string): boolean {
  const clean = nitCompleto.replace(/[\s.\-]/g, "");
  if (clean.length < 2) return false;

  const dvProvided = parseInt(clean.slice(-1), 10);
  const nitBase = clean.slice(0, -1);

  try {
    return calcularDV(nitBase) === dvProvided;
  } catch {
    return false;
  }
}

/**
 * Formatea un NIT para mostrar al usuario.
 * Ej: "900123456" + DV 5 → "900.123.456-5"
 */
export function formatearNIT(nit: string, dv: number): string {
  const clean = nit.replace(/\D/g, "");
  const parts: string[] = [];
  let i = clean.length;
  while (i > 0) {
    parts.unshift(clean.slice(Math.max(0, i - 3), i));
    i -= 3;
  }
  return `${parts.join(".")}-${dv}`;
}
