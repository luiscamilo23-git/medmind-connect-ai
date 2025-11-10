import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock, MapPin } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  location: string | null;
  patients?: {
    full_name: string;
    phone: string;
  };
}

interface AppointmentListProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointmentId: string) => void;
  compact?: boolean;
}

export const AppointmentList = ({
  appointments,
  onEdit,
  onDelete,
  compact = false,
}: AppointmentListProps) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-primary text-primary-foreground",
      confirmed: "bg-secondary text-secondary-foreground",
      completed: "bg-info text-info-foreground",
      cancelled: "bg-destructive text-destructive-foreground",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: "Programada",
      confirmed: "Confirmada",
      completed: "Completada",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
  };

  return (
    <div className={`space-y-${compact ? "2" : "3"}`}>
      {appointments.map((apt) => (
        <div
          key={apt.id}
          className={`${
            compact ? "p-3" : "p-4"
          } border rounded-lg hover:bg-muted/50 transition-colors`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className={`font-semibold ${compact ? "text-sm" : "text-base"}`}>
                {apt.patients?.full_name || apt.title}
              </h3>
              <div className={`flex items-center gap-2 text-muted-foreground mt-1 ${compact ? "text-xs" : "text-sm"}`}>
                <Clock className="w-3 h-3" />
                {format(new Date(apt.appointment_date), "PPp", { locale: es })}
                <span className="text-xs">({apt.duration_minutes} min)</span>
              </div>
              {apt.location && (
                <div className={`flex items-center gap-2 text-muted-foreground mt-1 ${compact ? "text-xs" : "text-sm"}`}>
                  <MapPin className="w-3 h-3" />
                  {apt.location}
                </div>
              )}
            </div>
            <Badge className={getStatusColor(apt.status)}>
              {getStatusLabel(apt.status)}
            </Badge>
          </div>

          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(apt)}
            >
              <Edit className="w-3 h-3 mr-1" />
              {compact ? "" : "Editar"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-3 h-3 mr-1 text-destructive" />
                  {compact ? "" : "Eliminar"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente la cita
                    con <strong>{apt.patients?.full_name}</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(apt.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
};
