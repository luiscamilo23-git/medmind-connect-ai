import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserCheck, Mail, Trash2, UserPlus, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { InviteSecretaryDialog } from "@/components/InviteSecretaryDialog";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface SecretaryInfo {
  secretary_id: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function SecretaryManagement() {
  const navigate = useNavigate();
  const [secretaries, setSecretaries] = useState<SecretaryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadSecretaries();
  }, []);

  const loadSecretaries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data, error } = await supabase
        .from("secretary_assignments")
        .select("secretary_id, created_at, profiles:secretary_id(full_name, email)")
        .eq("doctor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSecretaries((data as any) || []);
    } catch (err: any) {
      toast.error("Error al cargar secretarias: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (secretaryId: string) => {
    setRemoving(secretaryId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("secretary_assignments")
        .delete()
        .eq("doctor_id", user.id)
        .eq("secretary_id", secretaryId);

      if (error) throw error;
      toast.success("Secretaria removida correctamente");
      setSecretaries(prev => prev.filter(s => s.secretary_id !== secretaryId));
    } catch (err: any) {
      toast.error("Error al remover secretaria: " + err.message);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card px-6 py-4 flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Gestión de Secretaria</h1>
                <p className="text-xs text-muted-foreground">Invita y administra tu personal auxiliar</p>
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-6 py-8 max-w-3xl space-y-6">

            {/* Qué puede hacer la secretaria */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Puede hacer
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1 text-muted-foreground">
                  <p>✓ Ver agenda del médico</p>
                  <p>✓ Crear y editar citas</p>
                  <p>✓ Registrar y editar pacientes</p>
                </CardContent>
              </Card>
              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> No puede ver
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1 text-muted-foreground">
                  <p>✗ Historias clínicas</p>
                  <p>✗ Facturación y DIAN</p>
                  <p>✗ Analytics y configuración</p>
                </CardContent>
              </Card>
            </div>

            {/* Secretarias activas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Secretarias activas</CardTitle>
                  <CardDescription>
                    {secretaries.length === 0
                      ? "No tienes secretarias asignadas aún"
                      : `${secretaries.length} secretaria${secretaries.length > 1 ? "s" : ""} asignada${secretaries.length > 1 ? "s" : ""}`}
                  </CardDescription>
                </div>
                <Button onClick={() => setInviteOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invitar Secretaria
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-6">Cargando...</p>
                ) : secretaries.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aún no tienes secretarias</p>
                    <p className="text-sm mt-1">Invita a tu secretaria con el botón de arriba</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {secretaries.map((s) => {
                      const profile = s.profiles as any;
                      return (
                        <div key={s.secretary_id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                              <UserCheck className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{profile?.full_name || "Sin nombre"}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {profile?.email || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Activa</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={removing === s.secretary_id}
                              onClick={() => handleRemove(s.secretary_id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instrucciones */}
            <Card className="bg-muted/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">¿Cómo funciona?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>1. Haz clic en <strong>Invitar Secretaria</strong> e ingresa su correo electrónico.</p>
                <p>2. Tu secretaria recibirá un email con instrucciones para crear su cuenta.</p>
                <p>3. Al iniciar sesión, verá automáticamente el panel de secretaria con tu agenda y pacientes.</p>
                <p>4. Puedes removerla en cualquier momento con el ícono de papelera.</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      <InviteSecretaryDialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open) loadSecretaries();
        }}
      />
    </SidebarProvider>
  );
}
