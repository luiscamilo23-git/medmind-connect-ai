import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MessageSquare, Activity, Heart, TrendingUp, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    unreadMessages: 0,
    wellnessTips: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles?.some(r => r.role === "patient")) {
        toast({
          title: "Acceso denegado",
          description: "Esta sección es solo para pacientes",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setUser(session.user);
      loadStats(session.user.id);
    };

    checkAuth();
  }, [navigate, toast]);

  const loadStats = async (userId: string) => {
    const { data: tips } = await supabase
      .from("ai_wellness_tips")
      .select("*")
      .eq("patient_id", userId)
      .eq("is_read", false);

    const { data: rooms } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("patient_id", userId);

    setStats({
      upcomingAppointments: 0, // TODO: Implement appointments for patients
      unreadMessages: rooms?.length || 0,
      wellnessTips: tips?.length || 0,
    });
  };

  const modules = [
    {
      title: "Explorar Médicos",
      description: "Encuentra especialistas cerca de ti",
      icon: Users,
      path: "/patient/explore",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Mis Citas",
      description: "Gestiona tus próximas consultas",
      icon: Calendar,
      path: "/patient/appointments",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Bienestar IA",
      description: "Recomendaciones personalizadas",
      icon: Activity,
      path: "/patient/wellness",
      color: "from-green-500 to-emerald-500",
      badge: stats.wellnessTips,
    },
    {
      title: "Feed de Salud",
      description: "Consejos y noticias médicas",
      icon: Heart,
      path: "/patient/feed",
      color: "from-red-500 to-orange-500",
    },
    {
      title: "Chat con Médicos",
      description: "Consulta con profesionales",
      icon: MessageSquare,
      path: "/patient/chat",
      color: "from-indigo-500 to-purple-500",
      badge: stats.unreadMessages,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Portal del Paciente
            </h1>
            <p className="text-muted-foreground mt-2">
              Tu centro de salud personalizado
            </p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/");
            }}
          >
            Cerrar Sesión
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card
              key={module.path}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden relative"
              onClick={() => navigate(module.path)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${module.color}`}>
                    <module.icon className="h-6 w-6 text-white" />
                  </div>
                  {module.badge !== undefined && module.badge > 0 && (
                    <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                      {module.badge}
                    </span>
                  )}
                </div>
                <CardTitle className="mt-4">{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {module.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumen de Salud
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.upcomingAppointments}</div>
                <div className="text-sm text-muted-foreground">Citas Próximas</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.wellnessTips}</div>
                <div className="text-sm text-muted-foreground">Tips Nuevos</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.unreadMessages}</div>
                <div className="text-sm text-muted-foreground">Mensajes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;
