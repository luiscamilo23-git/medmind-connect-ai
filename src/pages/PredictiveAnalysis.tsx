import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Users,
  AlertCircle,
  Loader2,
  BarChart2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface MonthlyData {
  month: string;
  count: number;
}

interface DiagnosisData {
  diagnosis: string;
  count: number;
}

interface PredictiveStats {
  monthlyAppointments: MonthlyData[];
  topDiagnoses: DiagnosisData[];
  busiestDayOfWeek: string;
  busiestMonth: string;
  avgAppointmentsPerMonth: number;
  growthRate: number;
  totalLast3Months: number;
  totalPrev3Months: number;
  cancellationRate: number;
}

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const PredictiveAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PredictiveStats | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      await loadData(session.user.id);
    };
    load();
  }, [navigate]);

  const loadData = async (doctorId: string) => {
    try {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const [aptsRes, recordsRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("appointment_date, status")
          .eq("doctor_id", doctorId)
          .gte("appointment_date", twelveMonthsAgo.toISOString()),
        supabase
          .from("medical_records")
          .select("diagnosis, created_at")
          .eq("doctor_id", doctorId)
          .gte("created_at", twelveMonthsAgo.toISOString())
          .not("diagnosis", "is", null),
      ]);

      const apts = aptsRes.data || [];
      const records = recordsRes.data || [];

      // Monthly counts for last 12 months
      const monthlyCounts: Record<string, number> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyCounts[key] = 0;
      }
      apts.forEach((a) => {
        const key = a.appointment_date.slice(0, 7);
        if (key in monthlyCounts) monthlyCounts[key]++;
      });

      const monthlyAppointments: MonthlyData[] = Object.entries(monthlyCounts).map(([key, count]) => {
        const [year, month] = key.split("-");
        return { month: `${MONTHS_ES[parseInt(month) - 1]} ${year.slice(2)}`, count };
      });

      // Busiest day of week
      const dayCount: number[] = [0, 0, 0, 0, 0, 0, 0];
      apts.forEach((a) => {
        const day = new Date(a.appointment_date).getDay();
        dayCount[day]++;
      });
      const busiestDay = dayCount.indexOf(Math.max(...dayCount));

      // Busiest month
      const monthCount: number[] = new Array(12).fill(0);
      apts.forEach((a) => {
        const m = new Date(a.appointment_date).getMonth();
        monthCount[m]++;
      });
      const busiestMonthIdx = monthCount.indexOf(Math.max(...monthCount));

      // Growth rate: last 3 months vs previous 3 months
      const now = new Date();
      const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(now.getMonth() - 3);
      const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(now.getMonth() - 6);
      const last3 = apts.filter(a => new Date(a.appointment_date) >= threeMonthsAgo).length;
      const prev3 = apts.filter(a => {
        const d = new Date(a.appointment_date);
        return d >= sixMonthsAgo && d < threeMonthsAgo;
      }).length;
      const growthRate = prev3 === 0 ? (last3 > 0 ? 100 : 0) : Math.round(((last3 - prev3) / prev3) * 100);

      // Cancellation rate
      const cancelled = apts.filter(a => a.status === "cancelled").length;
      const cancellationRate = apts.length > 0 ? Math.round((cancelled / apts.length) * 100) : 0;

      // Average per month (only months with data)
      const monthValues = Object.values(monthlyCounts).filter(v => v > 0);
      const avgAppointmentsPerMonth = monthValues.length > 0
        ? Math.round(monthValues.reduce((a, b) => a + b, 0) / monthValues.length)
        : 0;

      // Top diagnoses
      const diagCount: Record<string, number> = {};
      records.forEach((r) => {
        if (!r.diagnosis) return;
        const d = r.diagnosis.trim().slice(0, 50);
        diagCount[d] = (diagCount[d] || 0) + 1;
      });
      const topDiagnoses: DiagnosisData[] = Object.entries(diagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([diagnosis, count]) => ({ diagnosis, count }));

      setStats({
        monthlyAppointments,
        topDiagnoses,
        busiestDayOfWeek: DAYS_ES[busiestDay],
        busiestMonth: MONTHS_ES[busiestMonthIdx],
        avgAppointmentsPerMonth,
        growthRate,
        totalLast3Months: last3,
        totalPrev3Months: prev3,
        cancellationRate,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const maxCount = stats ? Math.max(...stats.monthlyAppointments.map(m => m.count), 1) : 1;
  const maxDiag = stats ? Math.max(...stats.topDiagnoses.map(d => d.count), 1) : 1;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4 flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-feature flex items-center justify-center shadow-feature">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Análisis Predictivo</h1>
                  <p className="text-sm text-muted-foreground">Basado en tus datos reales de los últimos 12 meses</p>
                </div>
              </div>
            </div>
          </header>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                <p className="text-muted-foreground">Analizando tus datos...</p>
              </div>
            </div>
          ) : !stats || stats.monthlyAppointments.every(m => m.count === 0) ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 max-w-sm">
                <BarChart2 className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                <h3 className="font-semibold text-lg">Sin datos suficientes aún</h3>
                <p className="text-muted-foreground text-sm">
                  El análisis predictivo se activa cuando tienes al menos 1 mes de citas registradas.
                  Sigue usando MEDMIND y los patrones aparecerán aquí.
                </p>
              </div>
            </div>
          ) : (
            <main className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">

              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-5 text-center">
                    <p className="text-3xl font-bold text-primary">{stats.avgAppointmentsPerMonth}</p>
                    <p className="text-xs text-muted-foreground mt-1">Citas/mes promedio</p>
                  </CardContent>
                </Card>
                <Card className={stats.growthRate >= 0 ? "border-green-500/30" : "border-red-500/30"}>
                  <CardContent className="pt-5 text-center">
                    <p className={`text-3xl font-bold ${stats.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {stats.growthRate >= 0 ? "+" : ""}{stats.growthRate}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Crecimiento últimos 3 meses</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 text-center">
                    <p className="text-3xl font-bold text-primary">{stats.busiestMonth}</p>
                    <p className="text-xs text-muted-foreground mt-1">Mes más ocupado</p>
                  </CardContent>
                </Card>
                <Card className={stats.cancellationRate > 20 ? "border-orange-500/30" : ""}>
                  <CardContent className="pt-5 text-center">
                    <p className={`text-3xl font-bold ${stats.cancellationRate > 20 ? "text-orange-500" : "text-primary"}`}>
                      {stats.cancellationRate}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Tasa de cancelación</p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly bar chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Citas por Mes — últimos 12 meses
                  </CardTitle>
                  <CardDescription>
                    Últimos 3 meses: <strong>{stats.totalLast3Months}</strong> citas •
                    Trimestre anterior: <strong>{stats.totalPrev3Months}</strong> citas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1 h-32">
                    {stats.monthlyAppointments.map((m, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-muted-foreground">{m.count || ""}</span>
                        <div
                          className="w-full rounded-t bg-primary/80 transition-all"
                          style={{ height: `${Math.max((m.count / maxCount) * 100, m.count > 0 ? 4 : 0)}%` }}
                        />
                        <span className="text-[8px] text-muted-foreground truncate w-full text-center">{m.month}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top diagnoses */}
              {stats.topDiagnoses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-primary" />
                      Diagnósticos más frecuentes
                    </CardTitle>
                    <CardDescription>Top 5 de los últimos 12 meses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stats.topDiagnoses.map((d, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium truncate flex-1 mr-2">{d.diagnosis}</span>
                          <Badge variant="secondary">{d.count} casos</Badge>
                        </div>
                        <Progress value={(d.count / maxDiag) * 100} className="h-1.5" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Patterns */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Día más ocupado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{stats.busiestDayOfWeek}</p>
                    <p className="text-sm text-muted-foreground mt-1">Es cuando más citas recibes. Asegúrate de tener personal disponible.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Tendencia de crecimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${stats.growthRate >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {stats.growthRate >= 0 ? "↑" : "↓"} {Math.abs(stats.growthRate)}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.growthRate >= 0
                        ? "Tu práctica está creciendo. Considera aumentar tu disponibilidad."
                        : "Las citas bajaron este trimestre. Considera activar recordatorios automáticos."}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations based on real data */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Recomendaciones basadas en tus datos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {stats.cancellationRate > 20 && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <p>Tu tasa de cancelación es <strong>{stats.cancellationRate}%</strong>. Activa los recordatorios automáticos por WhatsApp en <strong>SmartScheduler</strong> para reducirla.</p>
                    </div>
                  )}
                  {stats.growthRate > 20 && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <p>Estás creciendo <strong>{stats.growthRate}%</strong> vs el trimestre anterior. Considera ampliar tus horarios o contratar una secretaria.</p>
                    </div>
                  )}
                  {stats.growthRate < -10 && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p>Las citas bajaron <strong>{Math.abs(stats.growthRate)}%</strong>. Activa tu perfil en <strong>Explorar Médicos</strong> para que nuevos pacientes te encuentren.</p>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p>Tus <strong>{stats.busiestDayOfWeek}s</strong> son los más ocupados. Planea el mes de <strong>{stats.busiestMonth}</strong> con anticipación ya que históricamente es tu pico de demanda.</p>
                  </div>
                </CardContent>
              </Card>

            </main>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PredictiveAnalysis;
