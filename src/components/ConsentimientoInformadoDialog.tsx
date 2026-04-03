import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignaturePad } from "@/components/SignaturePad";
import { ChevronRight, Loader2, FileCheck } from "lucide-react";
import { format } from "date-fns";

export type ConsentimientoTipo =
  | "consulta_general"
  | "procedimiento_invasivo"
  | "telemedicina"
  | "cirugia";

interface ConsentimientoInformadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  medicoId: string;
  tipo?: ConsentimientoTipo;
  onConfirmed: () => void;
}

const TIPO_LABELS: Record<ConsentimientoTipo, string> = {
  consulta_general: "Consulta Médica",
  procedimiento_invasivo: "Procedimiento Médico",
  telemedicina: "Telemedicina",
  cirugia: "Procedimiento Quirúrgico",
};

function getConsentText(tipo: ConsentimientoTipo, patientName: string): string {
  const today = format(new Date(), "dd/MM/yyyy");
  const name = patientName || "[PACIENTE]";

  const texts: Record<ConsentimientoTipo, string> = {
    consulta_general: `CONSENTIMIENTO INFORMADO — CONSULTA MÉDICA

Yo, ${name}, en pleno uso de mis facultades mentales, mediante la presente autorizo al médico tratante a realizar la valoración médica, examen físico y los procedimientos diagnósticos que considere necesarios...

Declaración: He sido informado(a) sobre el propósito de la consulta, los procedimientos que se realizarán, los posibles riesgos y beneficios, y que puedo retirar este consentimiento en cualquier momento antes de que se realicen los procedimientos.

Fecha: ${today}`,

    telemedicina: `CONSENTIMIENTO INFORMADO — TELEMEDICINA
(Resolución 2654 de 2019 — MinSalud Colombia)

Yo, ${name}, autorizo la atención médica a través de medios tecnológicos de comunicación (telemedicina), entendiendo que:

1. La atención será realizada sin presencia física del médico.
2. La calidad de la atención puede verse afectada por limitaciones técnicas.
3. En caso de emergencia, debo acudir a urgencias presenciales.
4. Mis datos e imágenes médicas podrán ser transmitidas de forma segura.
5. Tengo derecho a solicitar atención presencial si lo considero necesario.

Declaración: He comprendido la naturaleza de la telemedicina y sus limitaciones, y acepto esta modalidad de atención.

Fecha: ${today}`,

    procedimiento_invasivo: `CONSENTIMIENTO INFORMADO — PROCEDIMIENTO MÉDICO

Yo, ${name}, autorizo al médico tratante a realizar el procedimiento indicado, habiendo sido informado(a) sobre:

1. La naturaleza y objetivos del procedimiento.
2. Los beneficios esperados.
3. Los riesgos posibles, incluyendo complicaciones poco frecuentes.
4. Las alternativas existentes.
5. Las consecuencias de no realizarse el procedimiento.

Entiendo que puedo retirar este consentimiento antes del inicio del procedimiento.

Fecha: ${today}`,

    cirugia: `CONSENTIMIENTO INFORMADO — PROCEDIMIENTO QUIRÚRGICO

Yo, ${name}, autorizo la intervención quirúrgica propuesta, siendo informado(a) de:

1. Diagnóstico que indica la intervención.
2. Tipo de anestesia a utilizar.
3. Riesgos quirúrgicos y anestésicos.
4. Posibles complicaciones intraoperatorias y postoperatorias.
5. Posibilidad de transfusión sanguínea si fuera necesario.
6. Pronóstico con y sin la intervención.

Manifiesto que he tenido oportunidad de hacer preguntas y todas han sido respondidas satisfactoriamente.

Fecha: ${today}`,
  };

  return texts[tipo];
}

export const ConsentimientoInformadoDialog = ({
  open,
  onOpenChange,
  patientId,
  patientName,
  medicoId,
  tipo: tipoProp,
  onConfirmed,
}: ConsentimientoInformadoDialogProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTipo, setSelectedTipo] = useState<ConsentimientoTipo>(
    tipoProp || "consulta_general"
  );
  const [leido, setLeido] = useState(false);
  const [nombreConfirmado, setNombreConfirmado] = useState("");
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const consentText = getConsentText(selectedTipo, patientName);

  const handleClose = (val: boolean) => {
    if (!val) {
      setStep(1);
      setLeido(false);
      setNombreConfirmado("");
      setFirmaUrl(null);
    }
    onOpenChange(val);
  };

  const handleStep1Next = () => {
    if (!leido) return;
    setStep(2);
  };

  const handleStep2Next = () => {
    if (nombreConfirmado.trim().toLowerCase() !== patientName.trim().toLowerCase()) {
      toast.error("El nombre no coincide. Verifique e intente nuevamente.");
      return;
    }
    setStep(3);
  };

  const handleConfirm = async (withSignature: boolean) => {
    setIsSaving(true);
    try {
      const tipoAuth = selectedTipo === "telemedicina" ? "telemedicina" : "consentimiento_informado";

      const { error } = await supabase.from("patient_authorizations").insert([{
        patient_id: patientId,
        tipo: tipoAuth,
        texto_mostrado: consentText,
        aceptado: true,
        firma_url: withSignature && firmaUrl ? firmaUrl : null,
        medico_id: medicoId,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent,
        procedimiento: selectedTipo,
      }]);

      if (error) throw error;

      toast.success("Consentimiento registrado y almacenado correctamente");
      handleClose(false);
      onConfirmed();
    } catch (err: any) {
      toast.error("Error guardando consentimiento: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const nameMatches =
    nombreConfirmado.trim().toLowerCase() === patientName.trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            Consentimiento Informado
          </DialogTitle>
          <DialogDescription>
            Cumplimiento Ley 23 de 1981 — Ética Médica Colombia
          </DialogDescription>
        </DialogHeader>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-2">
          {([1, 2, 3] as const).map((s, i) => (
            <>
              <Badge key={s} variant={step === s ? "default" : step > s ? "secondary" : "outline"} className="text-xs">
                {s === 1 ? "Texto" : s === 2 ? "Confirmación" : "Firma"}
              </Badge>
              {i < 2 && <ChevronRight key={`arrow-${s}`} className="w-3 h-3 text-muted-foreground" />}
            </>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            {!tipoProp && (
              <div className="space-y-2">
                <Label>Tipo de consentimiento</Label>
                <Select
                  value={selectedTipo}
                  onValueChange={(v) => setSelectedTipo(v as ConsentimientoTipo)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(TIPO_LABELS) as [ConsentimientoTipo, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="h-64 overflow-y-auto rounded-lg border bg-muted/30 p-4">
              <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground">
                {consentText}
              </pre>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Checkbox
                id="leido"
                checked={leido}
                onCheckedChange={(c) => setLeido(c === true)}
                className="mt-0.5"
              />
              <Label htmlFor="leido" className="text-sm cursor-pointer leading-relaxed">
                He leído y comprendido el texto anterior.
              </Label>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
              <Button onClick={handleStep1Next} disabled={!leido}>
                Continuar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Para verificar su identidad, confirme su nombre completo exactamente como aparece en su documento de identidad.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-name">Confirme su nombre completo</Label>
              <Input
                id="confirm-name"
                value={nombreConfirmado}
                onChange={(e) => setNombreConfirmado(e.target.value)}
                placeholder={patientName}
                className={nombreConfirmado && !nameMatches ? "border-red-400" : ""}
              />
              {nombreConfirmado && !nameMatches && (
                <p className="text-xs text-red-600">El nombre no coincide con: {patientName}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button onClick={handleStep2Next} disabled={!nameMatches}>
                Continuar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Dibuje su firma como aparece en su documento de identidad.</strong> La firma es opcional pero proporciona mayor respaldo legal.
              </p>
            </div>

            <SignaturePad
              onSignatureChange={(url) => setFirmaUrl(url)}
              initialSignature={null}
            />

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={() => setStep(2)} disabled={isSaving}>
                Atrás
              </Button>
              <Button
                variant="outline"
                onClick={() => handleConfirm(false)}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Omitir firma
              </Button>
              <Button
                onClick={() => handleConfirm(true)}
                disabled={isSaving || !firmaUrl}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar con firma
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
