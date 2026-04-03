/**
 * Cliente SOAP para los web services de la DIAN
 *
 * Endpoints:
 * - Habilitación: https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc
 * - Producción:   https://vpfe.dian.gov.co/WcfDianCustomerServices.svc
 *
 * Métodos usados:
 * - GetNumberingRange → obtener TechnicalKey de una resolución
 * - SendBillSync      → enviar factura firmada a DIAN
 * - GetStatus         → consultar estado de un documento enviado
 */

export const DIAN_ENDPOINTS = {
  habilitacion: "https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc",
  produccion: "https://vpfe.dian.gov.co/WcfDianCustomerServices.svc",
} as const;

export type DIANEnvironment = keyof typeof DIAN_ENDPOINTS;

// ─── Builders de SOAP Envelopes ──────────────────────────────────────────────

export function buildGetNumberingRangeEnvelope(params: {
  accountCode: string;       // NIT del facturador
  accountCodeT: string;      // NIT del facturador (mismo, campo de seguridad)
  softwareCode: string;      // Código del software registrado en DIAN
  prefix: string;            // Prefijo de la resolución
  fromNumber: string;        // Rango desde
  toNumber: string;          // Rango hasta
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:wcf="http://wcf.dian.colombia">
  <soapenv:Header/>
  <soapenv:Body>
    <wcf:GetNumberingRange>
      <wcf:accountCode>${params.accountCode}</wcf:accountCode>
      <wcf:accountCodeT>${params.accountCodeT}</wcf:accountCodeT>
      <wcf:softwareCode>${params.softwareCode}</wcf:softwareCode>
      <wcf:prefix>${params.prefix}</wcf:prefix>
      <wcf:fromNumber>${params.fromNumber}</wcf:fromNumber>
      <wcf:toNumber>${params.toNumber}</wcf:toNumber>
    </wcf:GetNumberingRange>
  </soapenv:Body>
</soapenv:Envelope>`;
}

export function buildSendBillSyncEnvelope(xmlBase64Zip: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:wcf="http://wcf.dian.colombia">
  <soapenv:Header/>
  <soapenv:Body>
    <wcf:SendBillSync>
      <wcf:fileName>invoice.xml.zip</wcf:fileName>
      <wcf:contentFile>${xmlBase64Zip}</wcf:contentFile>
    </wcf:SendBillSync>
  </soapenv:Body>
</soapenv:Envelope>`;
}

export function buildGetStatusEnvelope(trackId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:wcf="http://wcf.dian.colombia">
  <soapenv:Header/>
  <soapenv:Body>
    <wcf:GetStatus>
      <wcf:trackId>${trackId}</wcf:trackId>
    </wcf:GetStatus>
  </soapenv:Body>
</soapenv:Envelope>`;
}

// ─── Parser de respuestas DIAN ────────────────────────────────────────────────

export interface DIANSendBillResponse {
  isValid: boolean;
  statusCode: string;
  statusDescription: string;
  statusMessage: string;
  cufe?: string;
  errorList?: string[];
}

export function parseSendBillSyncResponse(soapXml: string): DIANSendBillResponse {
  // Extraer campos relevantes del XML de respuesta
  const isValid = soapXml.includes("<b:IsValid>true</b:IsValid>");
  const statusCode = extractTag(soapXml, "b:StatusCode") ?? "";
  const statusDescription = extractTag(soapXml, "b:StatusDescription") ?? "";
  const statusMessage = extractTag(soapXml, "b:StatusMessage") ?? "";

  // CUFE en la respuesta (si la DIAN lo confirma)
  const cufe = extractTag(soapXml, "b:XmlFileName")?.replace(".xml", "") ?? undefined;

  // Errores
  const errorList: string[] = [];
  const errorMatches = soapXml.matchAll(/<b:ErrorMessage>(.*?)<\/b:ErrorMessage>/gs);
  for (const match of errorMatches) {
    errorList.push(match[1].trim());
  }

  return { isValid, statusCode, statusDescription, statusMessage, cufe, errorList };
}

export interface DIANNumberingRangeResponse {
  success: boolean;
  technicalKey?: string;
  fromDate?: string;
  toDate?: string;
  errorMessage?: string;
}

export function parseGetNumberingRangeResponse(soapXml: string): DIANNumberingRangeResponse {
  const technicalKey = extractTag(soapXml, "b:TechnicalKey");
  if (!technicalKey) {
    return {
      success: false,
      errorMessage: extractTag(soapXml, "b:StatusMessage") ?? "No se pudo obtener la TechnicalKey",
    };
  }
  return {
    success: true,
    technicalKey,
    fromDate: extractTag(soapXml, "b:ValidDateTimeFrom") ?? undefined,
    toDate: extractTag(soapXml, "b:ValidDateTimeTo") ?? undefined,
  };
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

export async function callDIANSoap(
  environment: DIANEnvironment,
  soapAction: string,
  envelope: string,
): Promise<string> {
  const url = DIAN_ENDPOINTS[environment];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": soapAction,
    },
    body: envelope,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`DIAN SOAP error ${response.status}: ${text.slice(0, 300)}`);
  }

  return text;
}

// ─── Utilidad interna ─────────────────────────────────────────────────────────

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "s"));
  return match ? match[1].trim() : null;
}
