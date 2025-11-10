import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  ArrowLeft, 
  Users, 
  Calendar, 
  FileText, 
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Sparkles,
  RefreshCw
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const Analytics = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadAnalytics(session.user.id);
    };
    checkUser();
  }, [navigate]);

  const loadAnalytics = async (userId: string) => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [patientsRes, appointmentsRes, recordsRes, inventoryRes] = await Promise.all([
        supabase.from("patients").select("*").eq("doctor_id", userId),
        supabase.from("appointments").select("*").eq("doctor_id", userId),
        supabase.from("medical_records").select("*").eq("doctor_id", userId),
        supabase.from("inventory").select("*").eq("doctor_id", userId),
      ]);

      const patients = patientsRes.data || [];
      const appointments = appointmentsRes.data || [];
      const records = recordsRes.data || [];
      const inventory = inventoryRes.data || [];

      // Calculate metrics
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const appointmentsThisMonth = appointments.filter(
        (apt) => new Date(apt.appointment_date) >= firstDayOfMonth
      );

      const completedAppointments = appointments.filter(
        (apt) => apt.status === "completed"
      ).length;

      const cancelledAppointments = appointments.filter(
        (apt) => apt.status === "cancelled"
      ).length;

      const cancellationRate = appointments.length > 0 
        ? ((cancelledAppointments / appointments.length) * 100).toFixed(1)
        : "0";

      const lowStockItems = inventory.filter(
        (item) => item.current_stock <= item.minimum_stock
      );

      // Appointments by status
      const appointmentsByStatus = [
        { name: "Programadas", value: appointments.filter(a => a.status === "scheduled").length, color: "hsl(var(--primary))" },
        { name: "Completadas", value: completedAppointments, color: "hsl(var(--success))" },
        { name: "Canceladas", value: cancelledAppointments, color: "hsl(var(--destructive))" },
      ];

      // Appointments trend (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const appointmentsTrend = last7Days.map(date => {
        const count = appointments.filter(apt => 
          apt.appointment_date.split('T')[0] === date
        ).length;
        return {
          date: new Date(date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
          citas: count
        };
      });

      // Inventory value
      const totalInventoryValue = inventory.reduce(
        (sum, item) => sum + (item.current_stock * (item.unit_cost || 0)), 
        0
      );

      const metricsData = {
        totalPatients: patients.length,
        appointmentsThisMonth: appointmentsThisMonth.length,
        completedAppointments,
        cancellationRate: parseFloat(cancellationRate),
        medicalRecords: records.length,
        inventoryItems: inventory.length,
        lowStockItems: lowStockItems.length,
        totalInventoryValue,
        appointmentsByStatus,
        appointmentsTrend,
        trends: {
          patientsGrowth: calculateGrowth(patients),
          appointmentsGrowth: calculateGrowth(appointments),
        }
      };

      setMetrics(metricsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (data: any[]) => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthCount = data.filter(
      item => new Date(item.created_at) >= lastMonth && new Date(item.created_at) < thisMonth
    ).length;

    const thisMonthCount = data.filter(
      item => new Date(item.created_at) >= thisMonth
    ).length;

    if (lastMonthCount === 0) return thisMonthCount > 0 ? 100 : 0;
    return (((thisMonthCount - lastMonthCount) / lastMonthCount) * 100).toFixed(1);
  };

  const generateInsights = async () => {
    if (!metrics) return;

    try {
      setInsightsLoading(true);
      const { data, error } = await supabase.functions.invoke("generate-insights", {
        body: { analyticsData: metrics }
      });

      if (error) throw error;

      setAiInsights(data.insights);
      toast({
        title: "Insights generados",
        description: "Las recomendaciones de IA están listas",
      });
    } catch (error: any) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron generar los insights",
        variant: "destructive",
      });
    } finally {
      setInsightsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map(i => <Skeleton key={i} className="h-80" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Inteligencia Operativa</h1>
                <p className="text-sm text-muted-foreground">Analytics y recomendaciones de IA</p>
              </div>
            </div>
          </div>
          <Button onClick={generateInsights} disabled={insightsLoading}>
            <Sparkles className="w-4 h-4 mr-2" />
            {insightsLoading ? "Generando..." : "Generar Insights con IA"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics?.totalPatients}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {parseFloat(metrics?.trends.patientsGrowth) >= 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span className="text-success">+{metrics?.trends.patientsGrowth}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-destructive" />
                    <span className="text-destructive">{metrics?.trends.patientsGrowth}%</span>
                  </>
                )}
                <span className="ml-1">vs mes anterior</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Citas Este Mes</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics?.appointmentsThisMonth}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {parseFloat(metrics?.trends.appointmentsGrowth) >= 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span className="text-success">+{metrics?.trends.appointmentsGrowth}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-destructive" />
                    <span className="text-destructive">{metrics?.trends.appointmentsGrowth}%</span>
                  </>
                )}
                <span className="ml-1">vs mes anterior</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Completación</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {((metrics?.completedAppointments / (metrics?.appointmentsThisMonth || 1)) * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics?.completedAppointments} citas completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{metrics?.lowStockItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                De {metrics?.inventoryItems} items totales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Appointments Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Citas (Últimos 7 días)</CardTitle>
              <CardDescription>Número de citas programadas por día</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics?.appointmentsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="citas" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Appointments by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Citas</CardTitle>
              <CardDescription>Distribución por estado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics?.appointmentsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {metrics?.appointmentsByStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historias Clínicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.medicalRecords}</div>
              <p className="text-sm text-muted-foreground">Total generadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tasa de Cancelación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.cancellationRate}%</div>
              <p className="text-sm text-muted-foreground">De todas las citas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valor de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics?.totalInventoryValue.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Valor total en stock</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        {aiInsights && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle>Insights y Recomendaciones de IA</CardTitle>
              </div>
              <CardDescription>
                Análisis inteligente de tus métricas y sugerencias de mejora
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-foreground">{aiInsights}</div>
            </CardContent>
          </Card>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => user && loadAnalytics(user.id)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar Datos
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
