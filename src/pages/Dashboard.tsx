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
  LineChart, 
  LogOut, 
  Package, 
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  Star,
  User as UserIcon,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReVerification } from "@/hooks/useReVerification";
import ReVerification from "@/components/auth/ReVerification";

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
      // Total de pacientes
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId);

      // Calcular tasa de satisfacción desde reviews
      const { data: reviews } = await supabase
        .from('doctor_reviews')
        .select('rating')
        .eq('doctor_id', doctorId);

      const satisfactionRate = reviews && reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length / 5) * 100)
        : 0;

      // Calcular ingresos estimados desde citas completadas
      const { data: appointments } = await supabase
        .from('appointments')
        .select('duration_minutes')
        .eq('doctor_id', doctorId)
        .eq('status', 'completed');

      // Obtener la tarifa de consulta del perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('consultation_fee')
        .eq('id', doctorId)
        .maybeSingle();

      const consultationFee = profile?.consultation_fee || 50;
      const estimatedRevenue = appointments 
        ? appointments.length * consultationFee 
        : 0;

      // Calcular tiempo promedio de citas
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

  if (loading || checking) {
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

  const modules = [
    {
      title: "VoiceNotes MD",
      description: "Transcribe consultas y genera historias clínicas automáticamente",
      icon: Brain,
      color: "bg-primary",
      path: "/voicenotes",
      enabled: true
    },
    {
      title: "SupplyLens",
      description: "Gestión inteligente de inventario y control de costos",
      icon: Package,
      color: "bg-secondary",
      path: "/supplylens",
      enabled: true
    },
    {
      title: "SmartScheduler",
      description: "Agenda predictiva con optimización automática",
      icon: Calendar,
      color: "bg-accent",
      path: "/scheduler",
      enabled: true
    },
    {
      title: "Análisis Predictivo",
      description: "Predice demanda según temporada, clima y tendencias de salud",
      icon: TrendingUp,
      color: "bg-warning",
      path: "/predictive",
      enabled: true
    },
    {
      title: "Inteligencia Operativa",
      description: "Analytics y recomendaciones personalizadas",
      icon: LineChart,
      color: "bg-info",
      path: "/analytics",
      enabled: true
    },
    {
      title: "Red Social Médica",
      description: "Comparte casos y contenido educativo con la comunidad",
      icon: Share2,
      color: "bg-success",
      path: "/social",
      enabled: true
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Re-verification Dialog */}
      <ReVerification
        isOpen={needsVerification}
        onVerified={markAsVerified}
      />

      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">MEDMIND</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} title="Mi Perfil">
              <UserIcon className="w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">¡Bienvenido de vuelta! 👋</h2>
          <p className="text-white/90 text-lg">
            Aquí está un resumen de tu actividad y productividad
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsDisplay.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  {stat.label}
                </CardDescription>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.value !== "N/A" && (
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Activity className="w-4 h-4 mr-1" />
                    <span>Actualizado en tiempo real</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modules Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Módulos de Automatización</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {modules.map((module, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}>
                        <module.icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">{module.title}</CardTitle>
                      <CardDescription className="text-base">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => module.enabled && navigate(module.path)}
                    disabled={!module.enabled}
                  >
                    {module.enabled ? 'Acceder al Módulo' : 'Próximamente'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Funciones de uso frecuente</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/voicenotes")}>Nueva Consulta</Button>
            <Button variant="secondary" onClick={() => navigate("/patients")}>
              <Users className="w-4 h-4 mr-2" />
              Gestionar Pacientes
            </Button>
            <Button variant="outline" onClick={() => navigate("/scheduler")}>
              <Calendar className="w-4 h-4 mr-2" />
              Ver Agenda
            </Button>
            <Button variant="outline" onClick={() => navigate("/social")}>
              <Share2 className="w-4 h-4 mr-2" />
              Publicar en Red Social
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;