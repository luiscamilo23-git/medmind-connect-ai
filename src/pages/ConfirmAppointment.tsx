import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Calendar, Clock, User, Building2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AppointmentInfo {
  title: string;
  date: string;
  duration: number;
  patientName: string;
  doctorName: string;
  clinicName: string;
  confirmedAt: string;
}

type State = "loading" | "confirmed" | "already_confirmed" | "error";

export default function ConfirmAppointment() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>("loading");
  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMessage("Enlace inválido. No se encontró el token de confirmación.");
      return;
    }
    confirmAppointment(token);
  }, [token]);

  const confirmAppointment = async (tok: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("confirm-appointment", {
        body: { token: tok },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAppointment(data.appointment);
      setState(data.alreadyConfirmed ? "already_confirmed" : "confirmed");
    } catch (err: any) {
      setState("error");
      setErrorMessage(err.message || "No se pudo confirmar la cita.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">M</span>
            </div>
            MedMind
          </div>
          <p className="text-muted-foreground text-sm mt-1">Sistema de Gestión Médica</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            {state === "loading" && (
              <>
                <div className="flex justify-center mb-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
                <CardTitle>Confirmando tu cita...</CardTitle>
              </>
            )}
            {(state === "confirmed" || state === "already_confirmed") && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-green-700">
                  {state === "already_confirmed" ? "Cita ya confirmada" : "¡Cita confirmada!"}
                </CardTitle>
              </>
            )}
            {state === "error" && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                  </div>
                </div>
                <CardTitle className="text-destructive">Error al confirmar</CardTitle>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {state === "error" && (
              <div className="text-center">
                <p className="text-muted-foreground">{errorMessage}</p>
              </div>
            )}

            {(state === "confirmed" || state === "already_confirmed") && appointment && (
              <>
                <p className="text-center text-muted-foreground text-sm">
                  {state === "already_confirmed"
                    ? "Tu cita ya había sido confirmada previamente."
                    : "Tu asistencia ha sido confirmada exitosamente. Te esperamos."}
                </p>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha y hora</p>
                      <p className="font-medium text-sm">{formatDate(appointment.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duración</p>
                      <p className="font-medium text-sm">{appointment.duration} minutos</p>
                    </div>
                  </div>

                  {appointment.patientName && (
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Paciente</p>
                        <p className="font-medium text-sm">{appointment.patientName}</p>
                      </div>
                    </div>
                  )}

                  {appointment.doctorName && (
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Médico</p>
                        <p className="font-medium text-sm">{appointment.doctorName}</p>
                      </div>
                    </div>
                  )}

                  {appointment.clinicName && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Consultorio</p>
                        <p className="font-medium text-sm">{appointment.clinicName}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Confirmado el</p>
                      <p className="font-medium text-sm text-green-700">
                        {formatDate(appointment.confirmedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Si necesitas cancelar o reprogramar tu cita, comunícate directamente con el consultorio.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by{" "}
          <Link to="/" className="text-primary hover:underline">
            MedMind
          </Link>
        </p>
      </div>
    </div>
  );
}
