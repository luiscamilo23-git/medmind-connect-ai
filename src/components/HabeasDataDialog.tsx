import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SignaturePad } from "@/components/SignaturePad";
import { Shield, ChevronRight, FileText, Loader2, CheckCircle } from "lucide-react";

export const CONSENTIMIENTO_GENERAL_TEXT = `CONSENTIMIENTO INFORMADO GENERAL — ATENCIÓN MÉDICA
(Ley 23 de 1981 — Circular 047 de 2023 MinSalud Colombia)

Yo, el paciente registrado, en pleno uso de mis facultades mentales, mediante la presente autorizo al médico tratante a:

1. Realizar la valoración médica, anamnesis y examen físico completo.
2. Solicitar los exámenes diagnósticos que considere necesarios (laboratorio, imágenes, etc.).
3. Establecer un diagnóstico y plan de tratamiento.
4. Prescribir medicamentos y procedimientos terapéuticos según criterio médico.
5. Registrar la información en la historia clínica según Resolución 1995/1999.

DECLARACIÓN DEL PACIENTE:
• He sido informado(a) sobre el propósito de la atención médica y los procedimientos que se realizarán.
• Entiendo que puedo hacer preguntas en cualquier momento durante mi atención.
• Comprendo que puedo retirar este consentimiento en cualquier momento antes de que se inicien los procedimientos.
• Este consentimiento cubre las consultas de seguimiento y control relacionadas con mi atención.

NOTA: Para procedimientos invasivos, cirugías o atención por telemedicina, se solicitará un consentimiento específico adicional.

Fecha de registro: [FECHA_REGISTRO]`;


export const HABEAS_DATA_TEXT = `AUTORIZACIÓN DE TRATAMIENTO DE DATOS PERSONALES
(Ley 1581 de 2012 — Decreto 1377 de 2013)

En cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto Reglamentario 1377 de 2013, MEDMIND solicita su autorización para recolectar, almacenar, usar, circular y suprimir sus datos personales con las siguientes finalidades:

1. DATOS RECOLECTADOS: Nombre completo, número de identificación, fecha de nacimiento, teléfono, correo electrónico, dirección, tipo de sangre, alergias, contacto de emergencia, historia clínica, diagnósticos, tratamientos y demás datos de salud.

2. FINALIDADES DEL TRATAMIENTO:
   • Prestación de servicios médicos y asistenciales
   • Elaboración de historia clínica según Resolución 1995/1999
   • Facturación electrónica ante la DIAN
   • Generación de RIPS y reporte a ADRES/SISPRO
   • Coordinación de citas y recordatorios
   • Comunicación sobre su estado de salud

3. DERECHOS DEL TITULAR: Usted tiene derecho a conocer, actualizar, rectificar y suprimir sus datos personales, y revocar esta autorización. Para ejercer estos derechos, contáctenos a través de los canales habilitados o mediante el módulo de PQRS.

4. RESPONSABLE: El médico tratante registrado en MEDMIND, como responsable del tratamiento de sus datos de salud.

5. TIEMPO DE CONSERVACIÓN: Los datos de historia clínica se conservarán por un mínimo de 20 años según la normativa colombiana.

Al aceptar esta autorización, declaro que he leído, entendido y acepto el tratamiento de mis datos personales para las finalidades descritas.`;

interface HabeasDataDialogProps {
  open: boolean;
  patientName: string;
  onAccepted: (firmaUrl?: string, consentimientoGeneral?: boolean) => void;
  onRejected: () => void;
}

export const HabeasDataDialog = ({
  open,
  patientName,
  onAccepted,
  onRejected,
}: HabeasDataDialogProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accepted, setAccepted] = useState(false);
  const [acceptedConsent, setAcceptedConsent] = useState(false);
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    setStep(1);
    setAccepted(false);
    setAcceptedConsent(false);
    setFirmaUrl(null);
    onRejected();
  };

  const handleAcceptStep1 = () => {
    if (!accepted) return;
    setStep(2);
  };

  const handleAcceptStep2 = (withSignature: boolean) => {
    // Move to step 3: general consent
    setStep(3);
    if (!withSignature) setFirmaUrl(null);
  };

  const handleFinish = async () => {
    setIsProcessing(true);
    try {
      onAccepted(firmaUrl ?? undefined, acceptedConsent);
      setStep(1);
      setAccepted(false);
      setAcceptedConsent(false);
      setFirmaUrl(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Autorización Habeas Data
          </DialogTitle>
          <DialogDescription>
            Ley 1581 de 2012 — Tratamiento de datos personales
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant={step === 1 ? "default" : "outline"} className="text-xs">
            1: Habeas Data
          </Badge>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <Badge variant={step === 2 ? "default" : "outline"} className="text-xs">
            2: Firma (opcional)
          </Badge>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <Badge variant={step === 3 ? "default" : "outline"} className="text-xs">
            3: Consentimiento general
          </Badge>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm">
                Autorizando datos para: <strong>{patientName || "Nuevo paciente"}</strong>
              </p>
            </div>

            {/* Authorization text */}
            <div className="h-64 overflow-y-auto rounded-lg border bg-muted/30 p-4">
              <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground">
                {HABEAS_DATA_TEXT}
              </pre>
            </div>

            {/* Acceptance checkbox */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Checkbox
                id="accept-habeas"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="accept-habeas"
                className="text-sm cursor-pointer leading-relaxed"
              >
                He leído y comprendido el texto de autorización de tratamiento de datos personales.
                Acepto en nombre del paciente <strong>{patientName || "nuevo paciente"}</strong>.
              </Label>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleAcceptStep1}
                disabled={!accepted}
              >
                Continuar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Firma opcional para mayor respaldo legal.</strong> La firma digitalizada queda almacenada como evidencia de la autorización Habeas Data.
              </p>
            </div>

            <SignaturePad
              onSignatureChange={(url) => setFirmaUrl(url)}
              initialSignature={null}
            />

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAcceptStep2(false)}
              >
                Omitir firma y continuar
              </Button>
              <Button
                onClick={() => handleAcceptStep2(true)}
                disabled={!firmaUrl}
              >
                Guardar firma y continuar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Alert className="border-green-500/30 bg-green-500/5">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 text-sm">
                <strong>Consentimiento informado general.</strong> Se firma una sola vez al registrar el paciente y cubre todas las consultas de seguimiento futuras.
              </AlertDescription>
            </Alert>

            <div className="h-52 overflow-y-auto rounded-lg border bg-muted/30 p-4">
              <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground">
                {CONSENTIMIENTO_GENERAL_TEXT.replace("[FECHA_REGISTRO]", new Date().toLocaleDateString("es-CO"))}
              </pre>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Checkbox
                id="accept-consent"
                checked={acceptedConsent}
                onCheckedChange={(checked) => setAcceptedConsent(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="accept-consent" className="text-sm cursor-pointer leading-relaxed">
                Acepto el consentimiento informado general para la atención médica de <strong>{patientName}</strong>.
                Entiendo que para procedimientos especiales o telemedicina se solicitará un consentimiento adicional.
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleFinish}
                disabled={isProcessing}
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Omitir y finalizar
              </Button>
              <Button
                onClick={() => { setAcceptedConsent(true); handleFinish(); }}
                disabled={isProcessing}
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                <CheckCircle className="w-4 h-4 mr-2" />
                Aceptar y finalizar registro
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
