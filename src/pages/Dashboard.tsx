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
  Zap,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Bot
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReVerification } from "@/hooks/useReVerification";
import ReVerification from "@/components/auth/ReVerification";
import { NotificationBell } from "@/components/NotificationBell";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DoctorAIAssistant } from "@/components/DoctorAIAssistant";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState<string>("");
  const [specialty, setSpecialty] = useState<string>("");
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    satisfactionRate: 0,
    estimatedRevenue: 0,
    averageTime: 0,
    trends: {
      patients: 0,
      satisfaction: 0,
      revenue: 0,
      time: 0
    }
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { needsVerification, checking, markAsVerified } = useReVerification();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadStats(session.user.id);
        await loadDoctorProfile(session.user.id);
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
        loadDoctorProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadDoctorProfile = async (doctorId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, specialty')
        .eq('id', doctorId)
        .maybeSingle();

      if (profile?.full_name) {
        setDoctorName(profile.full_name);
      }
      if (profile?.specialty) {
        setSpecialty(profile.specialty);
      }
    } catch (error) {
      console.error('Error loading doctor profile:', error);
    }
  };

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

      // Simular tendencias (en producción, compararías con mes anterior)
      const trends = {
        patients: Math.floor(Math.random() * 30) - 10, // -10% a +20%
        satisfaction: Math.floor(Math.random() * 20) - 5, // -5% a +15%
        revenue: Math.floor(Math.random() * 40) - 10, // -10% a +30%
        time: Math.floor(Math.random() * 20) - 10 // -10% a +10%
      };

      // Si no hay datos reales, mostrar datos demo para el video
      const hasRealData = (patientsCount || 0) > 0;
      
      if (hasRealData) {
        setStats({
          totalPatients: patientsCount || 0,
          satisfactionRate,
          estimatedRevenue,
          averageTime,
          trends
        });
      } else {
        // Datos demo para presentaciones y videos
        setStats({
          totalPatients: 127,
          satisfactionRate: 96,
          estimatedRevenue: 15840000,
          averageTime: 28,
          trends: {
            patients: 18,
            satisfaction: 4,
            revenue: 23,
            time: -8
          }
        });
      }
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
      color: "text-primary",
      trend: stats.trends.patients
    },
    { 
      label: "Tasa de Satisfacción", 
      value: stats.satisfactionRate > 0 ? `${stats.satisfactionRate}%` : "N/A", 
      icon: Star, 
      color: "text-success",
      trend: stats.trends.satisfaction
    },
    { 
      label: "Ingresos Estimados", 
      value: `$${stats.estimatedRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: "text-accent",
      trend: stats.trends.revenue
    },
    { 
      label: "Tiempo Promedio", 
      value: stats.averageTime > 0 ? `${stats.averageTime} min` : "N/A", 
      icon: Clock, 
      color: "text-info",
      trend: stats.trends.time
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
      color: "bg-purple",
      path: "/smart-notes"
    },
    {
      title: "Gestionar Pacientes",
      description: "Ver y editar historiales médicos",
      icon: Users,
      color: "bg-accent",
      path: "/patients"
    },
    {
      title: "Ver Agenda",
      description: "Consultar y gestionar citas",
      icon: Calendar,
      color: "bg-primary",
      path: "/scheduler"
    },
    {
      title: "Inventario",
      description: "Control de suministros médicos",
      icon: Package,
      color: "bg-success",
      path: "/supplylens"
    },
    {
      title: "Analytics",
      description: "Métricas e insights de tu práctica",
      icon: Activity,
      color: "bg-warning",
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
              <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-secondary rounded-2xl p-6 md:p-8 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-7 h-7 animate-pulse" />
                    <h2 className="text-2xl md:text-3xl font-bold">
                      {getGreeting()}, {doctorName || user?.email?.split('@')[0]}
                    </h2>
                  </div>
                  <p className="text-white/90 text-lg">
                    Resumen de tu actividad y productividad profesional
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {statsDisplay.map((stat, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all hover:scale-105 duration-300 border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardDescription className="text-xs md:text-sm font-medium">
                        {stat.label}
                      </CardDescription>
                      <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between">
                        <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                        {stat.trend !== 0 && (
                          <div className={`flex items-center gap-1 text-xs font-semibold ${
                            stat.trend > 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {stat.trend > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{Math.abs(stat.trend)}%</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">vs mes anterior</p>
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
                      className="group cursor-pointer transition-colors duration-100 hover:border-primary/50 hover:bg-card/80"
                      onClick={() => navigate(action.path)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center shadow-md`}>
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

              <Card className="bg-gradient-to-br from-purple/5 to-primary/5 border-purple/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple" />
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

          {/* Floating AI Assistant Button */}
          {!showAIAssistant && (
            <Button
              onClick={() => setShowAIAssistant(true)}
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-gradient-purple hover:scale-110 transition-transform z-50 shadow-purple"
              size="icon"
            >
              <Bot className="w-6 h-6" />
            </Button>
          )}

          {/* AI Assistant Panel */}
          {showAIAssistant && (
            <div className={`fixed z-50 transition-all duration-300 ${
              aiExpanded 
                ? 'inset-4 md:inset-8' 
                : 'bottom-6 right-6 w-[380px] max-w-[calc(100vw-3rem)]'
            }`}>
              <DoctorAIAssistant 
                expanded={aiExpanded}
                onToggleExpand={() => setAiExpanded(!aiExpanded)}
                onClose={() => {
                  setShowAIAssistant(false);
                  setAiExpanded(false);
                }}
                doctorName={doctorName}
                specialty={specialty}
              />
            </div>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
