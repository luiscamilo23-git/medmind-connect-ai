import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Users,
  Clock,
  LogOut,
  UserCheck,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AppointmentDialog } from "@/components/AppointmentDialog";
import { PatientDialog } from "@/components/PatientDialog";
import { SidebarProvider } from "@/components/ui/sidebar";

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  patients: { full_name: string; phone: string } | null;
}

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Programada", variant: "secondary" },
  confirmed: { label: "Confirmada", variant: "default" },
  in_progress: { label: "En consulta", variant: "default" },
  completed: { label: "Completada", variant: "outline" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  no_show: { label: "No asistió", variant: "destructive" },
};

export default function SecretaryDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>("");
  const [tab, setTab] = useState<"appointments" | "patients">("appointments");
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      // Get the doctor this secretary works for
      const { data: assignment } = await supabase
        .from("secretary_assignments")
        .select("doctor_id, profiles:doctor_id(full_name, clinic_name)")
        .eq("secretary_id", user.id)
        .maybeSingle();

      if (!assignment) {
        toast({
          title: "Sin asignación",
          description: "No estás asignada a ningún médico todavía. Contacta a tu médico para que te invite.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const dId = assignment.doctor_id;
      setDoctorId(dId);
      const profile = assignment.profiles as any;
      setDoctorName(profile?.clinic_name || profile?.full_name || "Tu médico");

      // Load today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [aptsRes, patientsRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("id, title, appointment_date, duration_minutes, status, patients(full_name, phone)")
          .eq("doctor_id", dId)
          .gte("appointment_date", today.toISOString())
          .lt("appointment_date", tomorrow.toISOString())
          .order("appointment_date"),
        supabase
          .from("patients")
          .select("id, full_name, phone, email")
          .eq("doctor_id", dId)
          .order("full_name"),
      ]);

      setTodayAppointments((aptsRes.data as any) || []);
      setPatients((patientsRes.data as any) || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
          <div className="flex h-16 items-center gap-4 px-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Panel Secretaria</h1>
                <p className="text-xs text-muted-foreground">{doctorName}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8 max-w-4xl space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">{todayAppointments.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Citas hoy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">{patients.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Pacientes</p>
              </CardContent>
            </Card>
          </div>

          {/* Tab buttons */}
          <div className="flex gap-2">
            <Button
              variant={tab === "appointments" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("appointments")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Citas de hoy
            </Button>
            <Button
              variant={tab === "patients" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("patients")}
            >
              <Users className="w-4 h-4 mr-2" />
              Pacientes
            </Button>
          </div>

          {/* Appointments tab */}
          {tab === "appointments" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">
                  Agenda del día — {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
                </CardTitle>
                <Button size="sm" onClick={() => setAppointmentDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Nueva cita
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Cargando...</p>
                ) : todayAppointments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No hay citas programadas para hoy</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayAppointments.map((apt) => {
                      const statusInfo = statusLabels[apt.status] || { label: apt.status, variant: "secondary" as const };
                      return (
                        <div key={apt.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="text-center min-w-[50px]">
                            <p className="font-bold text-primary text-sm">{formatTime(apt.appointment_date)}</p>
                            <p className="text-xs text-muted-foreground">{apt.duration_minutes}min</p>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{(apt.patients as any)?.full_name || "Sin paciente"}</p>
                            <p className="text-sm text-muted-foreground">{apt.title}</p>
                          </div>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Patients tab */}
          {tab === "patients" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Pacientes registrados</CardTitle>
                <Button size="sm" onClick={() => { setSelectedPatient(null); setPatientDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-1" />
                  Nuevo paciente
                </Button>
              </CardHeader>
              <CardContent>
                {patients.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No hay pacientes registrados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {patients.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{p.full_name}</p>
                          <p className="text-sm text-muted-foreground">{p.phone}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedPatient(p); setPatientDialogOpen(true); }}
                        >
                          Editar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>

        <AppointmentDialog
          open={appointmentDialogOpen}
          onOpenChange={(open) => {
            setAppointmentDialogOpen(open);
            if (!open) loadData();
          }}
          appointment={null}
        />

        <PatientDialog
          open={patientDialogOpen}
          onOpenChange={(shouldRefresh) => {
            setPatientDialogOpen(false);
            if (shouldRefresh) loadData();
          }}
          patient={selectedPatient}
        />
      </div>
    </SidebarProvider>
  );
}
