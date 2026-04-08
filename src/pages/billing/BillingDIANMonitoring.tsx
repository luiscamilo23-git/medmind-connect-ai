import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Bell, User, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, XCircle, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings2, ArrowRight } from "lucide-react";
import { DIANRealtimeNotifications } from "@/components/billing/DIANRealtimeNotifications";

const COLORS = {
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
};

export default function BillingDIANMonitoring() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: emissionLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["dian-emission-logs", timeRange],
    queryFn: async () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("dian_emission_logs")
        .select("*")
        .gte('created_at', startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices-monitoring"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, estado, proveedor_dian, created_at")
        .in('estado', ['EMITIDA', 'VALIDADA', 'RECHAZADA']);

      if (error) throw error;
      return data;
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Calculate metrics
  const totalEmissions = emissionLogs?.length || 0;
  const successfulEmissions = emissionLogs?.filter(log => log.status === 'success').length || 0;
  const failedEmissions = emissionLogs?.filter(log => log.status === 'error').length || 0;
  const successRate = totalEmissions > 0 ? (successfulEmissions / totalEmissions * 100).toFixed(1) : '0';

  // Provider statistics
  const providerStats = emissionLogs?.reduce((acc, log) => {
    if (!acc[log.provider]) {
      acc[log.provider] = { total: 0, success: 0, error: 0, totalTime: 0 };
    }
    acc[log.provider].total++;
    if (log.status === 'success') {
      acc[log.provider].success++;
    } else {
      acc[log.provider].error++;
    }
    return acc;
  }, {} as Record<string, { total: number; success: number; error: number; totalTime: number }>);

  const providerData = Object.entries(providerStats || {}).map(([provider, stats]) => ({
    provider,
    ...stats,
    successRate: ((stats.success / stats.total) * 100).toFixed(1),
  }));

  // Status distribution
  const statusData = [
    { name: 'Exitosas', value: successfulEmissions, color: COLORS.success },
    { name: 'Fallidas', value: failedEmissions, color: COLORS.destructive },
  ];

  // Timeline data (last 7 days)
  const timelineData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    const dayLogs = emissionLogs?.filter(log => 
      log.created_at.startsWith(dateStr)
    ) || [];

    return {
      date: date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }),
      exitosas: dayLogs.filter(l => l.status === 'success').length,
      fallidas: dayLogs.filter(l => l.status === 'error').length,
    };
  });

  // Common errors
  const errorMessages = emissionLogs
    ?.filter(log => log.status === 'error' && log.error_message)
    .map(log => log.error_message) || [];

  const errorFrequency = errorMessages.reduce((acc, msg) => {
    const key = msg?.substring(0, 100) || 'Error desconocido';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topErrors = Object.entries(errorFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([error, count]) => ({ error, count }));

  // Recent alerts
  const recentAlerts = emissionLogs
    ?.filter(log => log.status === 'error')
    .slice(0, 5) || [];

  return (
    <SidebarProvider>
      <DIANRealtimeNotifications />
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
            <h1 className="text-2xl font-bold bg-gradient-feature-soft bg-clip-text text-transparent">Monitoreo DIAN</h1>
            <div className="flex items-center gap-4">
              <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
                <TabsList>
                  <TabsTrigger value="7d">7 días</TabsTrigger>
                  <TabsTrigger value="30d">30 días</TabsTrigger>
                  <TabsTrigger value="90d">90 días</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* Empty state — sin emisiones aún */}
              {!logsLoading && totalEmissions === 0 && (
                <Card className="border-dashed border-2 border-muted">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">El monitoreo se activará con tu primera factura</h3>
                      <p className="text-muted-foreground max-w-md">
                        Aquí verás en tiempo real el estado de cada factura enviada a la DIAN — aprobadas, rechazadas, errores y tendencias.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 w-full max-w-2xl text-left">
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                        <span className="text-lg font-bold text-primary">1</span>
                        <div>
                          <p className="font-medium text-sm">Configura tu proveedor DIAN</p>
                          <p className="text-xs text-muted-foreground mt-1">Alegra, Siigo o Alanube en Facturación → DIAN</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                        <span className="text-lg font-bold text-primary">2</span>
                        <div>
                          <p className="font-medium text-sm">Emite tu primera factura</p>
                          <p className="text-xs text-muted-foreground mt-1">Ve a Facturas y crea una factura electrónica</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                        <span className="text-lg font-bold text-primary">3</span>
                        <div>
                          <p className="font-medium text-sm">El monitoreo se activa solo</p>
                          <p className="text-xs text-muted-foreground mt-1">Las métricas y alertas aparecen en tiempo real</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="mt-2 gap-2"
                      onClick={() => navigate("/billing/dian")}
                    >
                      <Settings2 className="h-4 w-4" />
                      Configurar proveedor DIAN
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Emisiones</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalEmissions}</div>
                    <p className="text-xs text-muted-foreground">
                      Últimos {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} días
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">{successRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      {successfulEmissions} exitosas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Emisiones Fallidas</CardTitle>
                    <XCircle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{failedEmissions}</div>
                    <p className="text-xs text-muted-foreground">
                      Requieren atención
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Object.keys(providerStats || {}).length}</div>
                    <p className="text-xs text-muted-foreground">
                      Configurados
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencia de Emisiones</CardTitle>
                    <CardDescription>Emisiones por día (últimos 7 días)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="exitosas" 
                          stroke={COLORS.success} 
                          name="Exitosas"
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="fallidas" 
                          stroke={COLORS.destructive} 
                          name="Fallidas"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Estados</CardTitle>
                    <CardDescription>Proporción de emisiones exitosas vs fallidas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Provider Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento por Proveedor</CardTitle>
                  <CardDescription>Comparación de tasas de éxito entre proveedores DIAN</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={providerData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="provider" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="success" fill={COLORS.success} name="Exitosas" />
                      <Bar dataKey="error" fill={COLORS.destructive} name="Fallidas" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-6 space-y-4">
                    {providerData.map((provider) => (
                      <div key={provider.provider} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{provider.provider}</h4>
                          <p className="text-sm text-muted-foreground">
                            {provider.total} emisiones totales
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={parseFloat(provider.successRate) >= 90 ? "default" : "destructive"}>
                            {provider.successRate}% éxito
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {provider.success} exitosas / {provider.error} fallidas
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Common Errors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Errores Más Frecuentes
                  </CardTitle>
                  <CardDescription>Top 5 errores recurrentes que necesitan atención</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topErrors.length > 0 ? (
                      topErrors.map((error, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                          <Badge variant="destructive">{error.count}x</Badge>
                          <div className="flex-1">
                            <p className="text-sm">{error.error}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No hay errores registrados en este período
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Alertas Recientes</CardTitle>
                  <CardDescription>Últimas emisiones fallidas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAlerts.length > 0 ? (
                      recentAlerts.map((alert) => (
                        <Alert key={alert.id} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium mb-1">
                                  {alert.provider} - {new Date(alert.created_at).toLocaleString('es-CO')}
                                </p>
                                <p className="text-sm">{alert.error_message}</p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate('/billing/invoices')}
                              >
                                Ver Factura
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No hay alertas recientes
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
