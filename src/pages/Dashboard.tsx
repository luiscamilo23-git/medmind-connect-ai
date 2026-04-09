import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  X,
  ChevronRight,
  FileText,
  CheckCircle2,
  Circle,
  UserPlus,
  Stethoscope,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReVerification } from "@/hooks/useReVerification";
import ReVerification from "@/components/auth/ReVerification";
import { NotificationBell } from "@/components/NotificationBell";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DoctorAIAssistant } from "@/components/DoctorAIAssistant";
import { OnboardingWizard } from "@/components/OnboardingWizard";

type Appointment = {
  id: string;
  title: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  patients?: { full_name: string } | null;
};

type RecentPatient = {
  id: string;
  full_name: string;
  created_at: string;
  phone: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Programada", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  confirmed: { label: "Confirmada", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  completed: { label: "Completada", color: "bg-muted text-muted-foreground border-border" },
  cancelled: { label: "Cancelada", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  no_show: { label: "No asistió", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
};

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
  const [rethusVerified, setRethusVerified] = useState<boolean | null>(null);
  const [accountDaysSinceCreated, setAccountDaysSinceCreated] = useState(0);
  const [showRethusBanner, setShowRethusBanner] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [todayRecords, setTodayRecords] = useState(0);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    completedToday: 0,
    pendingToday: 0,
    trends: { patients: 0, appointments: 0 },
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const { needsVerification, checking, markAsVerified } = useReVerification();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long",
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await Promise.all([
          loadStats(session.user.id),
          loadDoctorProfile(session.user.id),
          loadSubscription(session.user.id),
          loadTodayData(session.user.id),
        ]);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
      else {
        loadStats(session.user.id);
        loadDoctorProfile(session.user.id);
        loadTodayData(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadTodayData = async (doctorId: string) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 14);
      const nextWeekStr = nextWeek.toISOString().split("T")[0];

      const [todayRes, upcomingRes, patientsRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("id, title, appointment_date, duration_minutes, status, patients(full_name)")
          .eq("doctor_id", doctorId)
          .gte("appointment_date", todayStr)
          .lt("appointment_date", tomorrowStr)
          .order("appointment_date", { ascending: true }),
        supabase
          .from("appointments")
          .select("id, title, appointment_date, duration_minutes, status, patients(full_name)")
          .eq("doctor_id", doctorId)
          .gte("appointment_date", tomorrowStr)
          .lte("appointment_date", nextWeekStr)
          .neq("status", "cancelled")
          .order("appointment_date", { ascending: true })
          .limit(5),
        supabase
          .from("patients")
          .select("id, full_name, created_at, phone")
          .eq("doctor_id", doctorId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (todayRes.data) setTodayAppointments(todayRes.data as any);
      if (upcomingRes.data) setUpcomingAppointments(upcomingRes.data as any);
      if (patientsRes.data) setRecentPatients(patientsRes.data);

      // Contar historias clínicas creadas hoy para calcular tiempo ahorrado
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const { count } = await supabase
        .from("medical_records")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .gte("created_at", todayStr)
        .lt("created_at", tomorrow.toISOString().split("T")[0]);
      setTodayRecords(count ?? 0);
    } catch {}
  };

  const loadDoctorProfile = async (doctorId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, specialty, clinic_name, license_number, onboarding_completed, rethus_verified, created_at")
        .eq("id", doctorId)
        .maybeSingle();

      if (profile?.full_name) setDoctorName(profile.full_name);
      if (profile?.specialty) setSpecialty(profile.specialty);

      // Verificación RETHUS
      const verified = profile?.rethus_verified === true;
      setRethusVerified(verified);
      if (!verified && profile?.created_at) {
        const days = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);
        setAccountDaysSinceCreated(days);
        if (days >= 5) setShowRethusBanner(true);
      }

      const localDone = localStorage.getItem(`onboarding_done_${doctorId}`) === "true";
      const dbDone = profile?.onboarding_completed === true;
      const hasBasicProfile = !!(profile?.full_name && profile?.clinic_name);

      if (!localDone && !dbDone && !hasBasicProfile) {
        const { data: authData } = await supabase.auth.getUser();
        const metaName = authData?.user?.user_metadata?.full_name || "";
        setOnboardingInitialName(profile?.full_name || metaName);
        setOnboardingInitialSpecialty(profile?.specialty || authData?.user?.user_metadata?.specialty || "");
        setShowOnboarding(true);
        return;
      }

      const warnings: string[] = [];
      if (!profile?.clinic_name) warnings.push("nombre de clínica");
      if (!profile?.license_number) warnings.push("número RETHUS");
      if (warnings.length > 0) {
        setProfileWarnings(warnings);
        setShowProfileBanner(true);
      }
    } catch {}
  };

  const loadSubscription = async (doctorId: string) => {
    try {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status, trial_ends_at")
        .eq("doctor_id", doctorId)
        .maybeSingle();

      if (sub?.status === "trial" && sub.trial_ends_at) {
        const days = Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86400000);
        if (days <= 5 && days >= 0) {
          setTrialDaysLeft(days);
          setShowTrialBanner(true);
        }
      }
    } catch {}
  };

  const loadStats = async (doctorId: string) => {
    try {
      const startOfThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString();
      const endOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0, 23, 59, 59).toISOString();

      const [patientsCount, thisMonthPats, lastMonthPats, thisMonthApts, lastMonthApts] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }).eq("doctor_id", doctorId),
        supabase.from("patients").select("*", { count: "exact", head: true }).eq("doctor_id", doctorId).gte("created_at", startOfThisMonth),
        supabase.from("patients").select("*", { count: "exact", head: true }).eq("doctor_id", doctorId).gte("created_at", startOfLastMonth).lte("created_at", endOfLastMonth),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("doctor_id", doctorId).gte("appointment_date", startOfThisMonth),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("doctor_id", doctorId).gte("appointment_date", startOfLastMonth).lte("appointment_date", endOfLastMonth),
      ]);

      const calcTrend = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

      setStats({
        totalPatients: patientsCount.count || 0,
        totalAppointments: thisMonthApts.count || 0,
        completedToday: 0,
        pendingToday: 0,
        trends: {
          patients: calcTrend(thisMonthPats.count || 0, lastMonthPats.count || 0),
          appointments: calcTrend(thisMonthApts.count || 0, lastMonthApts.count || 0),
        },
      });
    } catch {}
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente." });
    navigate("/");
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  };

  const formatRelativeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.round((d.getTime() - Date.now()) / 86400000);
    if (diff === 1) return "Mañana";
    if (diff < 7) return d.toLocaleDateString("es-CO", { weekday: "long" });
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
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

  const completedToday = todayAppointments.filter(a => a.status === "completed").length;
  const pendingToday = todayAppointments.filter(a => a.status !== "completed" && a.status !== "cancelled").length;

  const quickActions = [
    { title: "Nueva Consulta", icon: Brain, color: "text-primary bg-primary/10", path: "/voicenotes" },
    { title: "Notas Inteligentes", icon: BrainCircuit, color: "text-purple-400 bg-purple-500/10", path: "/smart-notes" },
    { title: "Agendar Cita", icon: Calendar, color: "text-blue-400 bg-blue-500/10", path: "/scheduler" },
    { title: "Nuevo Paciente", icon: UserPlus, color: "text-green-400 bg-green-500/10", path: "/patients" },
    { title: "Facturación", icon: FileText, color: "text-amber-400 bg-amber-500/10", path: "/billing/invoices" },
    { title: "Inventario", icon: Package, color: "text-cyan-400 bg-cyan-500/10", path: "/supplylens" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {showOnboarding && user && (
          <OnboardingWizard
            doctorId={user.id}
            initialName={onboardingInitialName}
            initialSpecialty={onboardingInitialSpecialty}
            onComplete={() => { setShowOnboarding(false); loadDoctorProfile(user.id); }}
          />
        )}

        <ReVerification isOpen={needsVerification} onVerified={markAsVerified} />
        <AppSidebar />

        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger className="-ml-2" />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold">MEDMIND</h1>
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

          {/* Banners */}
          {showProfileBanner && profileWarnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Tu perfil está incompleto: falta <strong>{profileWarnings.join(" y ")}</strong>. Esto puede afectar la facturación DIAN.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900" onClick={() => navigate("/profile")}>
                  Completar perfil
                </Button>
                <button onClick={() => setShowProfileBanner(false)} className="opacity-70 hover:opacity-100 text-amber-800 dark:text-amber-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {showRethusBanner && !rethusVerified && (
            <div className={`px-6 py-3 flex items-center justify-between gap-4 border-b ${
              accountDaysSinceCreated >= 27
                ? "bg-red-600 text-white border-red-700"
                : "bg-orange-500/10 text-orange-800 dark:text-orange-300 border-orange-500/20"
            }`}>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {accountDaysSinceCreated >= 27
                    ? <><strong>Tu cuenta se suspenderá en {30 - accountDaysSinceCreated} días.</strong> Verifica tu número RETHUS para continuar usando MEDMIND.</>
                    : <>Tu cuenta está en revisión. Estamos verificando tu número RETHUS ante el Ministerio de Salud. <strong>Este proceso toma hasta 24h.</strong></>
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant={accountDaysSinceCreated >= 27 ? "secondary" : "outline"}
                  className="h-7 px-3 text-xs"
                  onClick={() => navigate("/profile")}
                >
                  Ver perfil
                </Button>
                <button onClick={() => setShowRethusBanner(false)}>
                  <X className="w-4 h-4 opacity-70 hover:opacity-100" />
                </button>
              </div>
            </div>
          )}

          {showTrialBanner && trialDaysLeft !== null && (
            <div className="bg-amber-500 text-white px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {trialDaysLeft === 0 ? "Tu prueba gratuita vence hoy." : `Tu prueba gratuita vence en ${trialDaysLeft} día${trialDaysLeft === 1 ? "" : "s"}.`} ¡Activa tu plan!
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" className="bg-white text-amber-600 hover:bg-amber-50 font-semibold h-7 px-3 text-xs" onClick={() => navigate("/pricing")}>
                  Activar plan
                </Button>
                <button onClick={() => setShowTrialBanner(false)} className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-6 max-w-7xl space-y-6">

              {/* Hero */}
              <div className="relative overflow-hidden bg-primary rounded-2xl p-6 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-5 h-5 opacity-80" />
                      <span className="text-white/70 text-sm capitalize">{todayFormatted}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-1">
                      {getGreeting()}, {doctorName ? `Dr. ${doctorName.split(" ")[0]}` : user?.email?.split("@")[0]}
                    </h2>
                    <p className="text-white/80 text-sm">
                      {todayAppointments.length === 0
                        ? "No tienes citas programadas para hoy"
                        : `Tienes ${todayAppointments.length} cita${todayAppointments.length > 1 ? "s" : ""} hoy — ${completedToday} completada${completedToday !== 1 ? "s" : ""}, ${pendingToday} pendiente${pendingToday !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <Button
                      variant="secondary"
                      className="bg-white/15 hover:bg-white/25 text-white border-0 gap-2"
                      onClick={() => navigate("/voicenotes")}
                    >
                      <Brain className="w-4 h-4" />
                      Nueva consulta
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-white/15 hover:bg-white/25 text-white border-0 gap-2"
                      onClick={() => navigate("/scheduler")}
                    >
                      <Calendar className="w-4 h-4" />
                      Ver agenda
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Pacientes totales",
                    value: stats.totalPatients,
                    icon: Users,
                    color: "text-primary",
                    trend: stats.trends.patients,
                    suffix: "",
                  },
                  {
                    label: "Citas este mes",
                    value: stats.totalAppointments,
                    icon: Calendar,
                    color: "text-blue-400",
                    trend: stats.trends.appointments,
                    suffix: "",
                  },
                  {
                    label: "Citas hoy",
                    value: todayAppointments.length,
                    icon: Stethoscope,
                    color: "text-green-400",
                    trend: 0,
                    suffix: "",
                  },
                  {
                    label: "Completadas hoy",
                    value: completedToday,
                    icon: CheckCircle2,
                    color: "text-emerald-400",
                    trend: 0,
                    suffix: `/ ${todayAppointments.length}`,
                  },
                ].map((s, i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold">{s.value}</span>
                        {s.suffix && <span className="text-sm text-muted-foreground mb-0.5">{s.suffix}</span>}
                      </div>
                      {s.trend !== 0 && (
                        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${s.trend > 0 ? "text-green-400" : "text-red-400"}`}>
                          {s.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(s.trend)}% vs mes anterior
                        </div>
                      )}
                      {s.trend === 0 && <p className="text-xs text-muted-foreground mt-1">en tiempo real</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Tiempo ahorrado hoy — insight card */}
              {todayRecords > 0 && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/40 border border-emerald-500/20 px-6 py-4 flex items-center justify-between gap-4">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                  </div>
                  <div className="relative">
                    <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest mb-0.5">IA en acción · hoy</p>
                    <p className="text-2xl font-bold text-white">
                      {todayRecords * 12} min de papeleo eliminados
                    </p>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {todayRecords} historia{todayRecords !== 1 ? "s" : ""} clínica{todayRecords !== 1 ? "s" : ""} documentada{todayRecords !== 1 ? "s" : ""} con IA · ~12 min ahorrados por consulta
                    </p>
                  </div>
                  <div className="relative shrink-0 text-right hidden sm:block">
                    <p className="text-4xl font-black text-emerald-400">{todayRecords * 12}<span className="text-lg font-normal text-emerald-600">m</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">devueltos a tus pacientes</p>
                  </div>
                </div>
              )}

              {/* Main content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Agenda de hoy + Próximas citas */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Agenda de hoy */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Calendar className="w-4 h-4 text-primary" />
                          Agenda de Hoy
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/scheduler")}>
                          Ver todo <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {todayAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Sin citas para hoy</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Agenda una cita o disfruta el día libre</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => navigate("/scheduler")}>
                            Agendar cita
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {todayAppointments.map((apt) => {
                            const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;
                            const isCompleted = apt.status === "completed";
                            return (
                              <div
                                key={apt.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 ${isCompleted ? "opacity-60" : ""}`}
                              >
                                <div className="shrink-0">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${isCompleted ? "line-through" : ""}`}>
                                    {apt.patients?.full_name || apt.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{formatTime(apt.appointment_date)} · {apt.duration_minutes} min</p>
                                </div>
                                <Badge variant="outline" className={`text-xs shrink-0 ${cfg.color}`}>
                                  {cfg.label}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Próximas citas */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Clock className="w-4 h-4 text-blue-400" />
                          Próximas Citas
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/scheduler")}>
                          Agenda <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {upcomingAppointments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No hay citas programadas próximamente</p>
                      ) : (
                        <div className="space-y-2">
                          {upcomingAppointments.map((apt) => (
                            <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              <div className="w-12 text-center shrink-0">
                                <p className="text-xs text-muted-foreground">{formatRelativeDate(apt.appointment_date)}</p>
                                <p className="text-sm font-semibold">{formatTime(apt.appointment_date)}</p>
                              </div>
                              <div className="w-px h-8 bg-border shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{apt.patients?.full_name || apt.title}</p>
                                <p className="text-xs text-muted-foreground">{apt.duration_minutes} min</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Quick actions + Recent patients */}
                <div className="space-y-6">

                  {/* Quick actions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Acciones Rápidas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        {quickActions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => navigate(action.path)}
                            className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors text-center group"
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                              <action.icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-medium leading-tight">{action.title}</span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent patients */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Users className="w-4 h-4 text-green-400" />
                          Pacientes Recientes
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/patients")}>
                          Ver todos <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {recentPatients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                          <p className="text-sm text-muted-foreground">Sin pacientes aún</p>
                          <Button size="sm" variant="outline" onClick={() => navigate("/patients")}>
                            Agregar paciente
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {recentPatients.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-3 py-2 cursor-pointer hover:bg-muted/50 px-2 rounded-lg transition-colors"
                              onClick={() => navigate("/patients")}
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-xs font-semibold text-primary">
                                  {p.full_name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{p.full_name}</p>
                                <p className="text-xs text-muted-foreground">{p.phone}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>

          {/* Floating AI Button */}
          {!showAIAssistant && (
            <Button
              onClick={() => setShowAIAssistant(true)}
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 hover:scale-110 transition-transform z-50"
              size="icon"
            >
              <Bot className="w-6 h-6" />
            </Button>
          )}

          {showAIAssistant && (
            <div className={`fixed z-50 transition-all duration-300 ${aiExpanded ? "inset-4 md:inset-8" : "bottom-6 right-6 w-[380px] max-w-[calc(100vw-3rem)]"}`}>
              <DoctorAIAssistant
                expanded={aiExpanded}
                onToggleExpand={() => setAiExpanded(!aiExpanded)}
                onClose={() => { setShowAIAssistant(false); setAiExpanded(false); }}
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
