import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, 
  Brain, 
  Calendar, 
  LogOut, 
  Package, 
  Users,
  Clock,
  DollarSign,
  Star,
  User as UserIcon,
  BrainCircuit,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReVerification } from "@/hooks/useReVerification";
import ReVerification from "@/components/auth/ReVerification";
import { NotificationBell } from "@/components/NotificationBell";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    satisfactionRate: 0,
    estimatedRevenue: 0,
    averageTime: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { needsVerification, checking, markAsVerified } = useReVerification();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadStats(session.user.id);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        loadStats(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadStats = async (doctorId: string) => {
    try {
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId);

      const { data: reviews } = await supabase
        .from('doctor_reviews')
        .select('rating')
        .eq('doctor_id', doctorId);

      const satisfactionRate = reviews && reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length / 5) * 100)
        : 0;

      const { data: appointments } = await supabase
        .from('appointments')
        .select('duration_minutes')
        .eq('doctor_id', doctorId)
        .eq('status', 'completed');

      const { data: profile } = await supabase
        .from('profiles')
        .select('consultation_fee')
        .eq('id', doctorId)
        .maybeSingle();

      const consultationFee = profile?.consultation_fee || 50;
      const estimatedRevenue = appointments 
        ? appointments.length * consultationFee 
        : 0;

      const averageTime = appointments && appointments.length > 0
        ? Math.round(appointments.reduce((sum, a) => sum + a.duration_minutes, 0) / appointments.length)
        : 0;

      setStats({
        totalPatients: patientsCount || 0,
        satisfactionRate,
        estimatedRevenue,
        averageTime
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente.",
    });
    navigate("/");
  };

  if (checking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const statsDisplay = [
    { 
      label: "Pacientes Tratados", 
      value: stats.totalPatients.toString(), 
      icon: Users, 
      color: "text-primary" 
    },
    { 
      label: "Tasa de Satisfacción", 
      value: stats.satisfactionRate > 0 ? `${stats.satisfactionRate}%` : "N/A", 
      icon: Star, 
      color: "text-success" 
    },
    { 
      label: "Ingresos Estimados", 
      value: `$${stats.estimatedRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: "text-accent" 
    },
    { 
      label: "Tiempo Promedio", 
      value: stats.averageTime > 0 ? `${stats.averageTime} min` : "N/A", 
      icon: Clock, 
      color: "text-info" 
    },
  ];

  const quickActions = [
    {
      title: "Nueva Consulta",
      description: "Inicia una consulta con transcripción automática",
      icon: Brain,
      color: "bg-primary",
      path: "/voicenotes"
    },
    {
      title: "Notas Inteligentes",
      description: "Analiza notas y extrae tareas e ideas",
      icon: BrainCircuit,
      color: "bg-blue-500",
      path: "/smart-notes"
    },
    {
      title: "Gestionar Pacientes",
      description: "Ver y editar historiales médicos",
      icon: Users,
      color: "bg-secondary",
      path: "/patients"
    },
    {
      title: "Ver Agenda",
      description: "Consultar y gestionar citas",
      icon: Calendar,
      color: "bg-accent",
      path: "/scheduler"
    },
    {
      title: "Inventario",
      description: "Control de suministros médicos",
      icon: Package,
      color: "bg-emerald-500",
      path: "/supplylens"
    },
    {
      title: "Analytics",
      description: "Métricas e insights de tu práctica",
      icon: Activity,
      color: "bg-orange-500",
      path: "/analytics"
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ReVerification
          isOpen={needsVerification}
          onVerified={markAsVerified}
        />

        <AppSidebar />

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger className="-ml-2" />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">MEDMIND</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} title="Mi Perfil">
                  <UserIcon className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar Sesión">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-8 space-y-8 max-w-7xl">
              <div className="bg-gradient-hero rounded-2xl p-6 md:p-8 text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  ¡Bienvenido de vuelta, {user?.email?.split('@')[0]}! 👋
                </h2>
                <p className="text-white/90">
                  Resumen de tu actividad y productividad
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {statsDisplay.map((stat, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all hover:scale-105 duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardDescription className="text-xs md:text-sm font-medium">
                        {stat.label}
                      </CardDescription>
                      <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Acciones Rápidas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickActions.map((action, index) => (
                    <Card 
                      key={index} 
                      className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      onClick={() => navigate(action.path)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}>
                            <action.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base mb-1">{action.title}</CardTitle>
                            <CardDescription className="text-sm">
                              {action.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Tip del Día
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    💡 Usa <strong>Notas Inteligentes</strong> para transcribir tus consultas por voz y extraer automáticamente tareas, ideas y recordatorios.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
