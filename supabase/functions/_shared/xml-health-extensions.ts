/**
 * Extensiones XML sector salud para UBL 2.1
 *
 * Resolución 000012 de 2021 (DIAN) — 11 campos adicionales para el sector salud
 * Resolución 506 de 2021 — actualización de campos
 */

export interface HealthExtensionData {
  /** Tipo de usuario del sistema de salud */
  tipoUsuario: "contributivo" | "subsidiado" | "vinculado" | "particular" | "otro";
  /** NIT de la EPS/aseguradora (null si es particular) */
  nitPagador?: string;
  /** Nombre de la EPS/aseguradora */
  nombrePagador?: string;
  /** Número de autorización de la EPS */
  numeroAutorizacion?: string;
  /** Número MIPRES (prescripción tecnologías no PBS) */
  numeroMIPRES?: string;
  /** Código CIE-10 del diagnóstico principal */
  codigoCIE10?: string;
  /** Causa de la atención médica */
  causaAtencion:
    | "enfermedad_general"
    | "accidente_trabajo"
    | "enfermedad_profesional"
    | "accidente_transito"
    | "otro_accidente"
    | "lesion_agresion"
    | "lesion_autoprovocada"
    | "maternidad";
  /** Modalidad de prestación del servicio */
  modalidadPrestacion:
    | "consulta_externa"
    | "urgencias"
    | "hospitalizacion"
    | "cirugia_ambulatoria"
    | "domiciliaria"
    | "telemedicina";
  /** Registro médico del profesional tratante */
  registroMedico?: string;
}

const TIPO_USUARIO_CODIGO: Record<string, string> = {
  contributivo: "1",
  subsidiado: "2",
  vinculado: "3",
  particular: "4",
  otro: "5",
};

const CAUSA_ATENCION_CODIGO: Record<string, string> = {
  enfermedad_general: "1",
  accidente_trabajo: "2",
  enfermedad_profesional: "3",
  accidente_transito: "4",
  otro_accidente: "5",
  lesion_agresion: "6",
  lesion_autoprovocada: "7",
  maternidad: "8",
};

const MODALIDAD_CODIGO: Record<string, string> = {
  consulta_externa: "1",
  urgencias: "2",
  hospitalizacion: "3",
  cirugia_ambulatoria: "4",
  domiciliaria: "5",
  telemedicina: "6",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Genera el bloque UBLExtensions con los campos adicionales del sector salud.
 * Se inserta justo antes del cierre </Invoice> en el XML UBL 2.1.
 */
export function generateHealthExtensionsXML(data: HealthExtensionData): string {
  const tipoUsuarioCod = TIPO_USUARIO_CODIGO[data.tipoUsuario] ?? "4";
  const causaCod = CAUSA_ATENCION_CODIGO[data.causaAtencion] ?? "1";
  const modalidadCod = MODALIDAD_CODIGO[data.modalidadPrestacion] ?? "1";

  return `
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <sts:DianExtensions xmlns:sts="dian:gov:co:facturaelectronica:Structures-2-1">
          <!-- Campo 1: Tipo de usuario del sistema de salud -->
          <sts:CustomTagGeneral>
            <sts:ID>1</sts:ID>
            <sts:Value>${tipoUsuarioCod}</sts:Value>
          </sts:CustomTagGeneral>

          <!-- Campo 2: Causa de la atención -->
          <sts:CustomTagGeneral>
            <sts:ID>2</sts:ID>
            <sts:Value>${causaCod}</sts:Value>
          </sts:CustomTagGeneral>

          <!-- Campo 3: Modalidad de prestación -->
          <sts:CustomTagGeneral>
            <sts:ID>3</sts:ID>
            <sts:Value>${modalidadCod}</sts:Value>
          </sts:CustomTagGeneral>

          ${data.nitPagador ? `
          <!-- Campo 4: NIT del pagador/asegurador -->
          <sts:CustomTagGeneral>
            <sts:ID>4</sts:ID>
            <sts:Value>${esc(data.nitPagador)}</sts:Value>
          </sts:CustomTagGeneral>

          <!-- Campo 5: Nombre del pagador/asegurador -->
          <sts:CustomTagGeneral>
            <sts:ID>5</sts:ID>
            <sts:Value>${esc(data.nombrePagador ?? "")}</sts:Value>
          </sts:CustomTagGeneral>
          ` : ""}

          ${data.numeroAutorizacion ? `
          <!-- Campo 6: Número de autorización EPS -->
          <sts:CustomTagGeneral>
            <sts:ID>6</sts:ID>
            <sts:Value>${esc(data.numeroAutorizacion)}</sts:Value>
          </sts:CustomTagGeneral>
          ` : ""}

          ${data.codigoCIE10 ? `
          <!-- Campo 7: Diagnóstico principal CIE-10 -->
          <sts:CustomTagGeneral>
            <sts:ID>7</sts:ID>
            <sts:Value>${esc(data.codigoCIE10)}</sts:Value>
          </sts:CustomTagGeneral>
          ` : ""}

          ${data.numeroMIPRES ? `
          <!-- Campo 8: Número MIPRES -->
          <sts:CustomTagGeneral>
            <sts:ID>8</sts:ID>
            <sts:Value>${esc(data.numeroMIPRES)}</sts:Value>
          </sts:CustomTagGeneral>
          ` : ""}

          ${data.registroMedico ? `
          <!-- Campo 9: Registro médico del profesional tratante -->
          <sts:CustomTagGeneral>
            <sts:ID>9</sts:ID>
            <sts:Value>${esc(data.registroMedico)}</sts:Value>
          </sts:CustomTagGeneral>
          ` : ""}
        </sts:DianExtensions>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>`.trim();
}
