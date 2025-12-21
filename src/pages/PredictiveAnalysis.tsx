import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar,
  Cloud,
  Thermometer,
  Users,
  Package,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const PredictiveAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const predictions = [
    {
      category: "Limpiezas Dentales",
      increase: 15,
      month: "Marzo",
      reason: "Temporada de inicio de año",
      impact: "high",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      category: "Consultas de Alergias",
      increase: 35,
      month: "Abril-Mayo",
      reason: "Temporada de polen primaveral",
      impact: "high",
      icon: Cloud,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      category: "Chequeos Generales",
      increase: 20,
      month: "Enero-Febrero",
      reason: "Propósitos de año nuevo",
      impact: "medium",
      icon: Calendar,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      category: "Vacunación Infantil",
      increase: 25,
      month: "Agosto",
      reason: "Preparación para regreso a clases",
      impact: "high",
      icon: AlertCircle,
      color: "text-info",
      bgColor: "bg-info/10"
    },
    {
      category: "Consultas de Gripe",
      increase: 45,
      month: "Noviembre-Diciembre",
      reason: "Temporada de invierno y clima frío",
      impact: "high",
      icon: Thermometer,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    }
  ];

  const recommendations = [
    {
      title: "Incrementar Stock de Materiales",
      description: "Aumentar inventario de suministros de limpieza dental en 20% para marzo",
      priority: "high",
      icon: Package
    },
    {
      title: "Ajustar Horarios",
      description: "Añadir 2 horas adicionales de consulta los sábados durante temporada alta",
      priority: "medium",
      icon: Calendar
    },
    {
      title: "Campaña Preventiva",
      description: "Enviar recordatorios de vacunación 2 semanas antes de agosto",
      priority: "medium",
      icon: AlertCircle
    }
  ];

  const climateFactors = [
    { name: "Temperatura", value: 75, trend: "up", color: "text-warning" },
    { name: "Humedad", value: 60, trend: "stable", color: "text-info" },
    { name: "Índice de Polen", value: 85, trend: "up", color: "text-destructive" },
    { name: "Calidad del Aire", value: 45, trend: "down", color: "text-success" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <TrendingUp className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Cargando análisis predictivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-feature flex items-center justify-center shadow-feature">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Análisis Predictivo de Demanda</h1>
                  <p className="text-sm text-muted-foreground">
                    Proyecciones basadas en temporada, clima y tendencias de salud
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gradient-hero text-white border-0">
            <CardHeader>
              <CardDescription className="text-white/80">Predicción Global</CardDescription>
              <CardTitle className="text-4xl">+28%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90">Incremento esperado próximos 3 meses</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardDescription>Pico de Demanda</CardDescription>
              <CardTitle className="text-3xl text-warning">Abril-Mayo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Temporada de alergias</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardDescription>Confianza del Modelo</CardDescription>
              <CardTitle className="text-3xl text-success">92%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={92} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Predictions by Category */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Predicciones por Categoría</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {predictions.map((prediction, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg ${prediction.bgColor} flex items-center justify-center`}>
                        <prediction.icon className={`w-6 h-6 ${prediction.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{prediction.category}</CardTitle>
                        <CardDescription>{prediction.month}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={prediction.impact === "high" ? "destructive" : "secondary"}>
                      {prediction.impact === "high" ? "Alto Impacto" : "Impacto Medio"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Incremento esperado</span>
                      <span className="text-2xl font-bold text-success">+{prediction.increase}%</span>
                    </div>
                    <Progress value={prediction.increase} className="h-2" />
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{prediction.reason}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Climate Factors */}
        <Card>
          <CardHeader>
            <CardTitle>Factores Climáticos y Ambientales</CardTitle>
            <CardDescription>Indicadores que afectan la demanda de servicios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {climateFactors.map((factor, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{factor.name}</span>
                    <TrendingUp className={`w-4 h-4 ${factor.color}`} />
                  </div>
                  <div className="text-3xl font-bold">{factor.value}%</div>
                  <Progress value={factor.value} className="h-2" />
                  <span className="text-xs text-muted-foreground capitalize">
                    Tendencia: {factor.trend === "up" ? "↑ Subiendo" : factor.trend === "down" ? "↓ Bajando" : "→ Estable"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Recomendaciones de Acción</CardTitle>
            <CardDescription>Sugerencias para optimizar operaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 bg-background rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-lg ${
                  rec.priority === "high" ? "bg-destructive/10" : "bg-info/10"
                } flex items-center justify-center flex-shrink-0`}>
                  <rec.icon className={`w-5 h-5 ${
                    rec.priority === "high" ? "text-destructive" : "text-info"
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{rec.title}</h3>
                    <Badge variant={rec.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                      {rec.priority === "high" ? "Alta Prioridad" : "Media Prioridad"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Sobre este análisis</h3>
                <p className="text-sm text-muted-foreground">
                  Las predicciones se generan utilizando datos históricos de los últimos 3 años, 
                  combinados con factores climáticos, tendencias estacionales y patrones de salud 
                  pública. La confianza del modelo se actualiza semanalmente con nuevos datos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PredictiveAnalysis;