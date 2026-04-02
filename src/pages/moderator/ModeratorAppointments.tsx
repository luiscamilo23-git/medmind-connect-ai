import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useModerator } from "@/hooks/useModerator";
import { ModeratorLayout } from "@/components/moderator/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
  status: string;
  duration_minutes: number;
  doctor_id: string;
  patients: { full_name: string } | null;
  doctor_name?: string;
  doctor_specialty?: string | null;
}

export default function ModeratorAppointments() {
  const { logAction } = useModerator();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadAppointments();
    logAction("VIEW", "appointments_list");
  }, []);

  const loadAppointments = async () => {
    try {
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select('id, title, appointment_date, status, duration_minutes, doctor_id, patients(full_name)')
        .order('appointment_date', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Get unique doctor IDs and fetch their profiles
      const doctorIds = [...new Set(appointmentsData?.map(a => a.doctor_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, specialty')
        .in('id', doctorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedAppointments = (appointmentsData || []).map(apt => ({
        ...apt,
        doctor_name: profileMap.get(apt.doctor_id)?.full_name,
        doctor_specialty: profileMap.get(apt.doctor_id)?.specialty,
      }));

      setAppointments(enrichedAppointments);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.patients?.full_name && a.patients.full_name.toLowerCase().includes(search.toLowerCase())) ||
    (a.doctor_name && a.doctor_name.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'confirmed': return 'bg-primary/20 text-primary border-primary';
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'no_show': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programada';
      case 'confirmed': return 'Confirmada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'no_show': return 'No asistió';
      default: return status;
    }
  };

  return (
    <ModeratorLayout title="Citas" icon={<Calendar className="w-6 h-6 text-orange-500" />}>
      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Todas las Citas</span>
            <Badge variant="outline" className="text-orange-400 border-orange-500">
              {filteredAppointments.length} registros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, paciente o doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="rounded-md border border-orange-500/20">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="text-sm">
                        {format(new Date(apt.appointment_date), "dd MMM yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">{apt.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{apt.doctor_name || "-"}</span>
                          {apt.doctor_specialty && (
                            <span className="text-xs text-muted-foreground">{apt.doctor_specialty}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{apt.patients?.full_name || "-"}</TableCell>
                      <TableCell>{apt.duration_minutes} min</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(apt.status)}>
                          {getStatusLabel(apt.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No se encontraron citas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </ModeratorLayout>
  );
}
