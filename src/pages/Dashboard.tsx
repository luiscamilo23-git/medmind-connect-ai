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
  Bot,
  AlertTriangle,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReVerification } from "@/hooks/useReVerification";
import ReVerification from "@/components/auth/ReVerification";
import { NotificationBell } from "@/components/NotificationBell";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DoctorAIAssistant } from "@/components/DoctorAIAssistant";
import { HeartbeatLine } from "@/components/HeartbeatLine";
import { OnboardingWizard } from "@/components/OnboardingWizard";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState<string>("");
  const [specialty, setSpecialty] = useState<string>("");
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingInitialName, setOnboardingInitialName] = useState("");
  const [onboardingInitialSpecialty, setOnboardingInitialSpecialty] = useState("");
  const [profileWarnings, setProfileWarnings] = useState<string[]>([]);
  const [showProfileBanner, setShowProfileBanner] = useState(false);
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
        await loadSubscription(session.user.id);
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
        .select('full_name, specialty, clinic_name, license_number, onboarding_completed')
        .eq('id', doctorId)
        .maybeSingle();

      if (profile?.full_name) setDoctorName(profile.full_name);
      if (profile?.specialty) setSpecialty(profile.specialty);

      // Determine if onboarding is needed:
      // 1. Check localStorage (works even before DB migration is applied)
      // 2. Check DB flag
      // 3. Fallback: if full_name AND clinic_name exist, consider done
      const localDone = localStorage.getItem(`onboarding_done_${doctorId}`) === "true";
      const dbDone = profile?.onboarding_completed === true;
      const hasBasicProfile = !!(profile?.full_name && profile?.clinic_name);

      if (!localDone && !dbDone && !hasBasicProfile) {
        // New doctor — show wizard pre-filled with data from signup
        // Also try auth metadata as fallback for full_name
        const { data: authData } = await supabase.auth.getUser();
        const metaName = authData?.user?.user_metadata?.full_name || "";
        setOnboardingInitialName(profile?.full_name || metaName);
        setOnboardingInitialSpecialty(profile?.specialty || authData?.user?.user_metadata?.specialty || "");
        setShowOnboarding(true);
        return;
      }

      // Profile completeness warnings for existing doctors
      const warnings: string[] = [];
      if (!profile?.clinic_name) warnings.push("nombre de clínica");
      if (!profile?.license_number) warnings.push("número RETHUS");
      if (warnings.length > 0) {
        setProfileWarnings(warnings);
        setShowProfileBanner(true);
      }
    } catch (error) {
    }
  };

  const loadSubscription = async (doctorId: string) => {
    try {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, trial_ends_at')
        .eq('doctor_id', doctorId)
        .maybeSingle();

      if (sub?.status === 'trial' && sub.trial_ends_at) {
        const msLeft = new Date(sub.trial_ends_at).getTime() - Date.now();
        const days = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
        if (days <= 5 && days >= 0) {
          setTrialDaysLeft(days);
          setShowTrialBanner(true);
        }
      }
    } catch (error) {
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

      // Calcular tendencias reales comparando mes actual vs mes anterior
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      const [thisMonthPats, lastMonthPats, thisMonthApts, lastMonthApts] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId).gte('created_at', startOfThisMonth),
        supabase.from('patients').select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId).gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId).eq('status', 'completed').gte('appointment_date', startOfThisMonth),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId).eq('status', 'completed').gte('appointment_date', startOfLastMonth).lte('appointment_date', endOfLastMonth),
      ]);

      const calcTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const trends = {
        patients: calcTrend(thisMonthPats.count || 0, lastMonthPats.count || 0),
        satisfaction: 0,
        revenue: calcTrend(thisMonthApts.count || 0, lastMonthApts.count || 0),
        time: 0,
      };

      setStats({
        totalPatients: patientsCount || 0,
        satisfactionRate,
        estimatedRevenue,
        averageTime,
        trends
      });
    } catch (error) {
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
      color: "bg-primary",
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
        {showOnboarding && user && (
          <OnboardingWizard
            doctorId={user.id}
            initialName={onboardingInitialName}
            initialSpecialty={onboardingInitialSpecialty}
            onComplete={() => {
              setShowOnboarding(false);
              loadDoctorProfile(user.id);
            }}
          />
        )}

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

          {showProfileBanner && profileWarnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Tu perfil está incompleto: falta <strong>{profileWarnings.join(" y ")}</strong>. Esto puede afectar la facturación DIAN.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                  onClick={() => navigate("/profile")}
                >
                  Completar perfil
                </Button>
                <button onClick={() => setShowProfileBanner(false)} className="opacity-70 hover:opacity-100 text-amber-800 dark:text-amber-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {showTrialBanner && trialDaysLeft !== null && (
            <div className="bg-amber-500 text-white px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {trialDaysLeft === 0
                  ? "Tu prueba gratuita vence hoy. Activa tu plan para seguir usando MEDMIND."
                  : `Tu prueba gratuita vence en ${trialDaysLeft} día${trialDaysLeft === 1 ? "" : "s"}. ¡Activa tu plan con 30% de descuento!`}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  className="bg-white text-amber-600 hover:bg-amber-50 font-semibold h-7 px-3 text-xs"
                  onClick={() => navigate("/pricing")}
                >
                  Activar plan
                </Button>
                <button onClick={() => setShowTrialBanner(false)} className="opacity-70 hover:opacity-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-8 space-y-8 max-w-7xl">
              <div className="relative overflow-hidden bg-primary rounded-2xl p-6 md:p-8 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
                <HeartbeatLine color="muted" variant="card" intensity="low" speed="slow" />
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

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
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
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 hover:scale-110 transition-transform z-50"
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
