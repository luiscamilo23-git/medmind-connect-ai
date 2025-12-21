import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useModerator } from "@/hooks/useModerator";
import { ModeratorSidebar } from "@/components/moderator/ModeratorSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, FileText, DollarSign, Package, Globe, Shield, AlertTriangle } from "lucide-react";

interface Stats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  totalInvoices: number;
  invoicesApproved: number;
  invoicesRejected: number;
  totalRIPS: number;
  totalPosts: number;
  inventoryAlerts: number;
}

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  const { isModerator, isLoading: roleLoading, logAction } = useModerator();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isModerator) {
      navigate("/dashboard");
      return;
    }

    if (isModerator) {
      loadStats();
      logAction("VIEW", "moderator_dashboard");
    }
  }, [isModerator, roleLoading, navigate]);

  const loadStats = async () => {
    try {
      const [
        doctorsResult,
        patientsResult,
        appointmentsResult,
        invoicesResult,
        ripsResult,
        postsResult,
        inventoryResult
      ] = await Promise.all([
        supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'doctor'),
        supabase.from('patients').select('id', { count: 'exact' }),
        supabase.from('appointments').select('id', { count: 'exact' }),
        supabase.from('invoices').select('id, estado'),
        supabase.from('rips_batches').select('id', { count: 'exact' }),
        supabase.from('posts').select('id', { count: 'exact' }),
        supabase.from('inventory').select('id, current_stock, minimum_stock'),
      ]);

      const invoices = invoicesResult.data || [];
      const inventory = inventoryResult.data || [];

      setStats({
        totalDoctors: doctorsResult.count || 0,
        totalPatients: patientsResult.count || 0,
        totalAppointments: appointmentsResult.count || 0,
        totalInvoices: invoices.length,
        invoicesApproved: invoices.filter(i => i.estado === 'VALIDADA').length,
        invoicesRejected: invoices.filter(i => i.estado === 'RECHAZADA').length,
        totalRIPS: ripsResult.count || 0,
        totalPosts: postsResult.count || 0,
        inventoryAlerts: inventory.filter(i => i.current_stock <= i.minimum_stock).length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!isModerator) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ModeratorSidebar />
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-orange-500/20 bg-orange-950/5 px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold text-orange-500">Panel de Moderador</h1>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500">
                ACCESO TOTAL
              </Badge>
            </div>
            <div className="ml-auto">
              <button
                onClick={handleLogout}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </header>

          {/* Warning Banner */}
          <div className="mx-6 mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-400">
                Modo Moderador Activo
              </p>
              <p className="text-xs text-muted-foreground">
                Estás visualizando información sensible. Todas tus acciones son registradas en el log de auditoría.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <main className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">Dashboard Global</h2>

            {/* Users & Clinical Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-orange-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Médicos</CardTitle>
                  <Users className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalDoctors || 0}</div>
                  <p className="text-xs text-muted-foreground">Usuarios con rol doctor</p>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
                  <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Citas</CardTitle>
                  <Calendar className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalAppointments || 0}</div>
                  <p className="text-xs text-muted-foreground">Todas las citas</p>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Publicaciones</CardTitle>
                  <Globe className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
                  <p className="text-xs text-muted-foreground">En la red social</p>
                </CardContent>
              </Card>
            </div>

            {/* Billing Stats */}
            <h3 className="text-lg font-semibold mt-6">Facturación & DIAN</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-orange-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
                  <FileText className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalInvoices || 0}</div>
                  <p className="text-xs text-muted-foreground">Emitidas en el sistema</p>
                </CardContent>
              </Card>

              <Card className="border-green-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">DIAN Aprobadas</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats?.invoicesApproved || 0}</div>
                  <p className="text-xs text-muted-foreground">Validadas por DIAN</p>
                </CardContent>
              </Card>

              <Card className="border-red-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">DIAN Rechazadas</CardTitle>
                  <DollarSign className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{stats?.invoicesRejected || 0}</div>
                  <p className="text-xs text-muted-foreground">Requieren corrección</p>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Lotes RIPS</CardTitle>
                  <FileText className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalRIPS || 0}</div>
                  <p className="text-xs text-muted-foreground">Generados</p>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            <h3 className="text-lg font-semibold mt-6">Alertas del Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className={`border-${(stats?.inventoryAlerts || 0) > 0 ? 'red' : 'green'}-500/20`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Alertas de Inventario</CardTitle>
                  <Package className={`h-4 w-4 ${(stats?.inventoryAlerts || 0) > 0 ? 'text-red-500' : 'text-green-500'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(stats?.inventoryAlerts || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {stats?.inventoryAlerts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(stats?.inventoryAlerts || 0) > 0 ? 'Items bajo stock mínimo' : 'Sin alertas'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
