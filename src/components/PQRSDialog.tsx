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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  AlertCircle,
  Scale,
  Lightbulb,
  CheckCircle2,
  Loader2,
} from "lucide-react";

type PqrsTipo = "peticion" | "queja" | "reclamo" | "sugerencia";

interface PQRSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId?: string;
  patientId?: string;
}

const TIPO_CONFIG = {
  peticion: {
    label: "Petición",
    description: "Solicitud de información, servicio o documentos",
    icon: FileText,
    color: "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-300",
    iconColor: "text-blue-600",
  },
  queja: {
    label: "Queja",
    description: "Inconformidad con la atención o servicio recibido",
    icon: AlertCircle,
    color: "border-orange-500 bg-orange-50 dark:bg-orange-950/30",
    badgeColor: "bg-orange-100 text-orange-700 border-orange-300",
    iconColor: "text-orange-600",
  },
  reclamo: {
    label: "Reclamo",
    description: "Solicitud de corrección o compensación",
    icon: Scale,
    color: "border-red-500 bg-red-50 dark:bg-red-950/30",
    badgeColor: "bg-red-100 text-red-700 border-red-300",
    iconColor: "text-red-600",
  },
  sugerencia: {
    label: "Sugerencia",
    description: "Propuesta para mejorar la atención o servicio",
    icon: Lightbulb,
    color: "border-green-500 bg-green-50 dark:bg-green-950/30",
    badgeColor: "bg-green-100 text-green-700 border-green-300",
    iconColor: "text-green-600",
  },
} as const;

const COLOMBIAN_HOLIDAYS = [
  "01-01", "01-06", "03-24", "04-17", "04-18",
  "05-01", "05-29", "06-19", "06-30", "07-20",
  "08-07", "08-18", "10-13", "11-03", "11-17",
  "12-08", "12-25",
];

function addBusinessDays(startDate: Date, days: number): Date {
  const date = new Date(startDate);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue; // Sunday
    const mmdd = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (COLOMBIAN_HOLIDAYS.includes(mmdd)) continue;
    added++;
  }
  return date;
}

export const PQRSDialog = ({ open, onOpenChange, doctorId, patientId }: PQRSDialogProps) => {
  const [tipo, setTipo] = useState<PqrsTipo | null>(null);
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nombreRemitente, setNombreRemitente] = useState("");
  const [emailRemitente, setEmailRemitente] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ radicado: string; fechaLimite: Date } | null>(null);

  const resetForm = () => {
    setTipo(null);
    setAsunto("");
    setDescripcion("");
    setNombreRemitente("");
    setEmailRemitente("");
    setSubmitted(null);
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const handleSubmit = async () => {
    if (!tipo) {
      toast.error("Por favor selecciona el tipo de PQRS");
      return;
    }
    if (!asunto.trim()) {
      toast.error("El asunto es requerido");
      return;
    }
    if (!descripcion.trim()) {
      toast.error("La descripción es requerida");
      return;
    }

    setIsSubmitting(true);
    try {
      const fechaLimite = addBusinessDays(new Date(), 15);

      const { data, error } = await supabase
        .from("pqrs")
        .insert([{
          tipo,
          asunto: asunto.trim(),
          descripcion: descripcion.trim(),
          doctor_id: doctorId || null,
          patient_id: patientId || null,
          nombre_remitente: nombreRemitente.trim() || null,
          email_remitente: emailRemitente.trim() || null,
          fecha_limite: fechaLimite.toISOString(),
          estado: "pendiente",
          prioridad: "normal",
        }])
        .select("id")
        .single();

      if (error) throw error;

      const radicado = (data.id as string).slice(0, 8).toUpperCase();
      setSubmitted({ radicado, fechaLimite });
      toast.success("PQRS radicada exitosamente");
    } catch (err: any) {
      toast.error(err.message || "Error al radicar la PQRS");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Radicar PQRS</DialogTitle>
          <DialogDescription>
            Peticiones, Quejas, Reclamos y Sugerencias — Decreto 1011/2006
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-700 dark:text-green-400">
                  PQRS Radicada Exitosamente
                </h3>
                <p className="text-muted-foreground mt-1">
                  Su solicitud ha sido registrada en nuestro sistema
                </p>
              </div>
            </div>

            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Número de radicado:</span>
                  <Badge className="font-mono text-base px-3 py-1 bg-green-100 text-green-800 border-green-300">
                    {submitted.radicado}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Fecha límite de respuesta:</span>
                  <span className="text-sm font-semibold">
                    {submitted.fechaLimite.toLocaleDateString("es-CO", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Tiempo de respuesta:</span>
                  <span className="text-sm">15 días hábiles (Decreto 1011/2006)</span>
                </div>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground text-center">
              Guarde su número de radicado para hacer seguimiento a su solicitud.
            </p>

            <Button onClick={() => handleClose(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Tipo selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tipo de solicitud *</Label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(TIPO_CONFIG) as [PqrsTipo, typeof TIPO_CONFIG[PqrsTipo]][]).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = tipo === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTipo(key)}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? config.color + " border-2"
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isSelected ? config.iconColor : "text-muted-foreground"}`} />
                      <div>
                        <div className={`text-sm font-semibold ${isSelected ? config.iconColor : ""}`}>
                          {config.label}
                        </div>
                        <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                          {config.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Asunto */}
            <div className="space-y-2">
              <Label htmlFor="asunto">Asunto *</Label>
              <Input
                id="asunto"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Resumen breve de su solicitud"
                maxLength={200}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describa detalladamente su solicitud, queja, reclamo o sugerencia..."
                rows={4}
              />
            </div>

            {/* Remitente */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre (opcional)</Label>
                <Input
                  id="nombre"
                  value={nombreRemitente}
                  onChange={(e) => setNombreRemitente(e.target.value)}
                  placeholder="Su nombre completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailRemitente}
                  onChange={(e) => setEmailRemitente(e.target.value)}
                  placeholder="para recibir respuesta"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Radicando...
                  </>
                ) : (
                  "Radicar PQRS"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
