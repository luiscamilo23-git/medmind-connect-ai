import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Activity,
  Search,
  UserPlus,
  Users,
  Eye,
  Edit,
  Trash2,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PatientDialog } from "@/components/PatientDialog";
import { PatientMedicalHistory } from "@/components/PatientMedicalHistory";
import { PatientDocuments } from "@/components/PatientDocuments";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { HeartbeatLine } from "@/components/HeartbeatLine";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  date_of_birth: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient => 
      patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery) ||
      (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
    }
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("doctor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  const handleViewHistory = (patient: Patient) => {
    setSelectedPatient(patient);
    setHistoryOpen(true);
  };

  const handleViewDocuments = (patient: Patient) => {
    setSelectedPatient(patient);
    setDocumentsOpen(true);
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!patientToDelete) return;

    try {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", patientToDelete.id);

      if (error) throw error;

      toast({
        title: "Paciente eliminado",
        description: "El paciente ha sido eliminado exitosamente.",
      });
      
      loadPatients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleDialogClose = (shouldRefresh: boolean) => {
    setDialogOpen(false);
    setSelectedPatient(null);
    if (shouldRefresh) {
      loadPatients();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Cargando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger className="-ml-2" />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 bg-gradient-purple rounded-lg flex items-center justify-center shadow-purple">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-purple-blue bg-clip-text text-transparent">Gestión de Pacientes</h1>
                  <p className="text-xs text-muted-foreground">{patients.length} pacientes registrados</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Button onClick={() => { setSelectedPatient(null); setDialogOpen(true); }} size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nuevo Paciente
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto relative">
            <HeartbeatLine color="primary" position="bottom" opacity={0.15} speed="slow" className="fixed bottom-0" />
            <div className="container mx-auto px-6 py-8 max-w-6xl">
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Pacientes</CardTitle>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar por nombre, teléfono o email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredPatients.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      {searchQuery ? "No se encontraron pacientes" : "No hay pacientes registrados"}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{patient.full_name}</h3>
                            <div className="text-sm text-muted-foreground space-y-1 mt-1">
                              <p>📞 {patient.phone}</p>
                              {patient.email && <p>📧 {patient.email}</p>}
                              {patient.date_of_birth && (
                                <p>🎂 {new Date(patient.date_of_birth).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleViewHistory(patient)}
                              title="Ver historial médico"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleViewDocuments(patient)}
                              title="Ver documentos médicos"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(patient)}
                              title="Editar paciente"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteClick(patient)}
                              title="Eliminar paciente"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>

        <PatientDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          patient={selectedPatient}
        />

        <PatientMedicalHistory
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          patient={selectedPatient}
        />

        <PatientDocuments
          open={documentsOpen}
          onOpenChange={setDocumentsOpen}
          patient={selectedPatient}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el paciente
                <strong> {patientToDelete?.full_name}</strong> y todos sus registros médicos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SidebarProvider>
  );
};

export default Patients;
