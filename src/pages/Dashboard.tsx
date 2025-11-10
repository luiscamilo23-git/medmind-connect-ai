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
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
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
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente.",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Pacientes Tratados", value: "342", icon: Users, color: "text-primary" },
    { label: "Tasa de Satisfacción", value: "96%", icon: Star, color: "text-success" },
    { label: "Ingresos Estimados", value: "$45,320", icon: DollarSign, color: "text-accent" },
    { label: "Tiempo Promedio", value: "28 min", icon: Clock, color: "text-info" },
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
      enabled: false
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
      title: "Inteligencia Operativa",
      description: "Analytics y recomendaciones personalizadas",
      icon: LineChart,
      color: "bg-info",
      path: "/analytics",
      enabled: false
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">MedLink AI</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
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
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  {stat.label}
                </CardDescription>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="flex items-center text-sm text-success mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+12% vs mes anterior</span>
                </div>
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
            <Button variant="outline">Publicar en Red Social</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;