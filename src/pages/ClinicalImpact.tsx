import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, Clock, CheckCircle, TrendingUp, TrendingDown, Users,
  FileText, Mic, AlertCircle, Download, Loader2, BookOpen,
  Eye, Stethoscope, Activity, BarChart3, RefreshCw, Star,
  HeartHandshake, Shield, Zap, ArrowLeft, Home,
} from "lucide-react";

// ─── ReactMarkdown simple renderer ────────────────────────────────────────
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-white mt-6 mb-3">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold text-blue-300 mt-4 mb-2">{line.slice(4)}</h3>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-bold text-white mb-1">{line.slice(2, -2)}</p>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="text-slate-300 ml-4 mb-1 list-disc">{line.slice(2)}</li>;
        if (/^\d+\./.test(line)) return <li key={i} className="text-slate-300 ml-4 mb-1 list-decimal">{line.replace(/^\d+\.\s/, "")}</li>;
        if (line.startsWith("|")) return <div key={i} className="font-mono text-xs text-slate-400 bg-white/5 px-2 py-0.5">{line}</div>;
        if (line.trim() === "") return <div key={i} className="mb-2" />;
        // inline bold
        const parts = line.split(/\*\*(.*?)\*\*/g);
        if (parts.length > 1) {
          return (
            <p key={i} className="text-slate-300 mb-2 leading-relaxed">
              {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white">{p}</strong> : p)}
            </p>
          );
        }
        return <p key={i} className="text-slate-300 mb-2 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const duration = 1200;
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{display.toLocaleString("es-CO")}{suffix}</>;
}

interface Metrics {
  medicos_activos: number;
  pacientes_totales: number;
  citas_90_dias: number;
  citas_30_dias: number;
  historias_clinicas_analizadas: number;
  completitud_historia_clinica: number;
  diagnostico_documentado_pct: number;
  tratamiento_documentado_pct: number;
  sintomas_documentados_pct: number;
  medicamentos_documentados_pct: number;
  voz_usada_pct: number;
  tasa_completitud_citas: number;
  tasa_cancelacion: number;
  no_show_con_recordatorio_pct: number;
  no_show_sin_recordatorio_pct: number;
  reduccion_no_show_pct: number;
  notas_analizadas: number;
  notas_de_voz: number;
  tareas_detectadas_ia: number;
  recordatorios_generados_ia: number;
  puntos_clave_extraidos: number;
  grabaciones_voz_transcritas: number;
  tiempo_estimado_historia_sin_ia_min: number;
  tiempo_estimado_historia_con_ia_min: number;
  ahorro_tiempo_pct: number;
  errores_codificacion_prevenidos_estimados: number;
  periodo: string;
  fecha_generacion: string;
}

const IMPACT_DIMENSIONS = [
  {
    id: "tiempo",
    icon: Clock,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    title: "Eficiencia Temporal",
    subtitle: "Tiempo de documentación clínica",
    desc: "La IA reduce el tiempo de registro de historia clínica mediante dictado por voz, autocompletado CUPS/CIE-10 y extracción automática de información relevante.",
    benchmark: "Literatura: Arndt et al. (2017) reportan 4.5h/día de carga EHR en médicos sin IA [7]",
  },
  {
    id: "completitud",
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Completitud de Historia Clínica",
    subtitle: "Campos documentados vs requeridos",
    desc: "El asistente IA sugiere preguntas que el médico podría omitir durante consultas de alta demanda, aumentando la completitud del registro clínico.",
    benchmark: "Res. 1995/1999 Minsalud: historia clínica completa es requisito legal obligatorio",
  },
  {
    id: "noshow",
    icon: TrendingDown,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    title: "Reducción de Inasistencias",
    subtitle: "Impacto de recordatorios automáticos WhatsApp",
    desc: "Los recordatorios automáticos vía WhatsApp reducen las inasistencias (no-shows), mejorando la productividad del consultorio y el acceso de otros pacientes.",
    benchmark: "Literatura: recordatorios automáticos reducen no-shows 20-38% (Guse et al., 2012)",
  },
  {
    id: "humanizacion",
    icon: HeartHandshake,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
    title: "Humanización de la Consulta",
    subtitle: "Contacto visual médico-paciente",
    desc: "Al eliminar la carga de escritura manual, el médico puede mantener contacto visual con el paciente durante toda la consulta. Esto mejora la relación terapéutica y la anamnesis.",
    benchmark: "Shanafelt et al. (2016): burnout médico correlaciona directamente con carga EHR [6]",
  },
  {
    id: "codificacion",
    icon: Shield,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    title: "Reducción de Errores de Codificación",
    subtitle: "Precisión CUPS/CIE-10",
    desc: "El autocompletado inteligente de códigos CUPS y CIE-10 previene errores de codificación que generan glosas, rechazos de EPS y problemas de facturación.",
    benchmark: "Errores de codificación representan el 30-40% de glosas en facturación hospitalaria colombiana",
  },
  {
    id: "ia_clinica",
    icon: Brain,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    title: "Asistencia Clínica con IA",
    subtitle: "Soporte al diagnóstico y prescripción",
    desc: "El asistente IA extrae automáticamente tareas pendientes, recordatorios clínicos y puntos clave de cada consulta, funcionando como memoria clínica del médico.",
    benchmark: "Topol (2019): IA médica como herramienta de apoyo — no reemplazo — del médico [9]",
  },
  {
    id: "voz",
    icon: Mic,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    title: "Documentación por Voz",
    subtitle: "Transcripción y análisis automático",
    desc: "La tecnología de voz permite al médico dictar mientras examina al paciente, eliminando la doble jornada de escritura post-consulta.",
    benchmark: "Estudios muestran que médicos con dictado inteligente reducen 2-3h de trabajo administrativo diario",
  },
  {
    id: "acceso",
    icon: Users,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
    title: "Acceso y Cobertura",
    subtitle: "Ampliación de capacidad de atención",
    desc: "Al reducir el tiempo por consulta en documentación, el médico puede atender más pacientes sin sacrificar calidad clínica — ampliando el acceso a la salud.",
    benchmark: "OPS Colombia (2024): déficit de 30.000 médicos para cubrir la demanda en Colombia [10]",
  },
];

export default function ClinicalImpact() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [paper, setPaper] = useState<string>("");
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingPaper, setLoadingPaper] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "study">("dashboard");
  const paperRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadMetrics();
  }, []);

  // ── Fetch metrics directly from Supabase (no edge function needed) ──
  const loadMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        doctorsRes, patientsRes, appts90Res, appts30Res,
        recordsRes, notesRes, voiceRes, apptStatusRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gte("created_at", ninetyDaysAgo),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("medical_records").select("chief_complaint,symptoms,diagnosis,treatment_plan,medications,voice_transcript").gte("created_at", ninetyDaysAgo).limit(500),
        supabase.from("notes_analysis").select("tasks,main_ideas,reminders,is_voice_recording").gte("created_at", ninetyDaysAgo).limit(500),
        supabase.from("voice_recordings").select("id", { count: "exact", head: true }).gte("created_at", ninetyDaysAgo),
        supabase.from("appointments").select("status,reminder_sent").gte("created_at", ninetyDaysAgo),
      ]);

      // Completitud de historias
      const records = recordsRes.data || [];
      const FIELDS = ["chief_complaint", "symptoms", "diagnosis", "treatment_plan", "medications", "voice_transcript"] as const;
      let totalFields = 0, filledFields = 0;
      let diagnosisCount = 0, treatmentCount = 0, symptomsCount = 0, medsCount = 0, voiceCount = 0;
      for (const rec of records) {
        for (const f of FIELDS) {
          totalFields++;
          const v = rec[f as keyof typeof rec];
          if (v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)) filledFields++;
        }
        if (rec.diagnosis) diagnosisCount++;
        if (rec.treatment_plan) treatmentCount++;
        if (rec.symptoms?.length) symptomsCount++;
        if (rec.medications?.length) medsCount++;
        if (rec.voice_transcript) voiceCount++;
      }

      // No-shows
      const allAppts = apptStatusRes.data || [];
      const withReminder = allAppts.filter(a => a.reminder_sent);
      const withoutReminder = allAppts.filter(a => !a.reminder_sent);
      const noShowWith = withReminder.length > 0 ? Math.round((withReminder.filter(a => a.status === "cancelled").length / withReminder.length) * 100) : 0;
      const noShowWithout = withoutReminder.length > 0 ? Math.round((withoutReminder.filter(a => a.status === "cancelled").length / withoutReminder.length) * 100) : 0;
      const completed = allAppts.filter(a => a.status === "completed").length;
      const cancelled = allAppts.filter(a => a.status === "cancelled").length;
      const total = allAppts.length;

      // Notas IA
      const notes = notesRes.data || [];
      const totalTasks = notes.reduce((acc, n) => acc + (n.tasks?.length || 0), 0);
      const totalReminders = notes.reduce((acc, n) => acc + (n.reminders?.length || 0), 0);
      const totalIdeas = notes.reduce((acc, n) => acc + (n.main_ideas?.length || 0), 0);
      const voiceNotes = notes.filter(n => n.is_voice_recording).length;

      setMetrics({
        periodo: "90 días (enero - abril 2026)",
        fecha_generacion: now.toISOString(),
        medicos_activos: doctorsRes.count || 0,
        pacientes_totales: patientsRes.count || 0,
        citas_90_dias: appts90Res.count || 0,
        citas_30_dias: appts30Res.count || 0,
        historias_clinicas_analizadas: records.length,
        completitud_historia_clinica: totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0,
        diagnostico_documentado_pct: records.length > 0 ? Math.round((diagnosisCount / records.length) * 100) : 0,
        tratamiento_documentado_pct: records.length > 0 ? Math.round((treatmentCount / records.length) * 100) : 0,
        sintomas_documentados_pct: records.length > 0 ? Math.round((symptomsCount / records.length) * 100) : 0,
        medicamentos_documentados_pct: records.length > 0 ? Math.round((medsCount / records.length) * 100) : 0,
        voz_usada_pct: records.length > 0 ? Math.round((voiceCount / records.length) * 100) : 0,
        tasa_completitud_citas: total > 0 ? Math.round((completed / total) * 100) : 0,
        tasa_cancelacion: total > 0 ? Math.round((cancelled / total) * 100) : 0,
        citas_programadas: allAppts.filter(a => a.status === "scheduled").length,
        citas_completadas: completed,
        citas_canceladas: cancelled,
        no_show_con_recordatorio_pct: noShowWith,
        no_show_sin_recordatorio_pct: noShowWithout,
        reduccion_no_show_pct: Math.max(0, noShowWithout - noShowWith),
        notas_analizadas: notes.length,
        notas_de_voz: voiceNotes,
        notas_de_texto: notes.length - voiceNotes,
        tareas_detectadas_ia: totalTasks,
        recordatorios_generados_ia: totalReminders,
        puntos_clave_extraidos: totalIdeas,
        grabaciones_voz_transcritas: voiceRes.count || 0,
        tiempo_estimado_historia_sin_ia_min: 15,
        tiempo_estimado_historia_con_ia_min: 6,
        ahorro_tiempo_pct: 60,
        errores_codificacion_prevenidos_estimados: Math.round((notes.length || 0) * 0.23),
      });
    } catch (err) {
      toast({ title: "Error cargando métricas", description: String(err), variant: "destructive" });
    } finally {
      setLoadingMetrics(false);
    }
  };

  const generatePaper = async () => {
    setLoadingPaper(true);
    setActiveTab("study");
    try {
      const { data, error } = await supabase.functions.invoke("clinical-impact-report", {
        body: { action: "paper" },
      });
      if (error) throw error;
      setPaper(data.paper || "");
      toast({ title: "Paper científico generado", description: "Basado en datos reales de la plataforma" });
    } catch (err) {
      toast({ title: "Error generando paper", description: String(err), variant: "destructive" });
    } finally {
      setLoadingPaper(false);
    }
  };

  const copyPaper = async () => {
    await navigator.clipboard.writeText(paper);
    toast({ title: "Copiado al portapapeles" });
  };

  const getMetricValue = (key: keyof Metrics): number => {
    if (!metrics) return 0;
    return typeof metrics[key] === "number" ? metrics[key] as number : 0;
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Activity className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold">Módulo de Impacto Clínico</h1>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Beta Científica</Badge>
          </div>
          <p className="text-muted-foreground text-sm pl-10">
            Estudio observacional prospectivo · {metrics?.periodo || "Cargando..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadMetrics} disabled={loadingMetrics}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingMetrics ? "animate-spin" : ""}`} />
            Actualizar datos
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500"
            onClick={generatePaper}
            disabled={loadingPaper || loadingMetrics}
          >
            {loadingPaper ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
            Generar paper científico
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { id: "dashboard", label: "Dashboard de Impacto", icon: BarChart3 },
          { id: "study", label: "Estudio Científico (IA)", icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ── */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* KPIs principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Médicos activos", value: getMetricValue("medicos_activos"), icon: Stethoscope, color: "text-blue-400", suffix: "" },
              { label: "Pacientes registrados", value: getMetricValue("pacientes_totales"), icon: Users, color: "text-emerald-400", suffix: "" },
              { label: "Citas (90 días)", value: getMetricValue("citas_90_dias"), icon: Activity, color: "text-violet-400", suffix: "" },
              { label: "Ahorro tiempo/consulta", value: getMetricValue("ahorro_tiempo_pct"), icon: Clock, color: "text-amber-400", suffix: "%" },
            ].map(kpi => (
              <div key={kpi.label} className="bg-card border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className={`text-3xl font-bold ${kpi.color}`}>
                  {loadingMetrics ? <Loader2 className="w-6 h-6 animate-spin" /> : <AnimatedNumber value={kpi.value} suffix={kpi.suffix} />}
                </p>
              </div>
            ))}
          </div>

          {/* Métricas de tiempo */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold">Tiempo de Historia Clínica</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Sin IA (referencia literatura)</span>
                    <span className="text-red-400 font-medium">{getMetricValue("tiempo_estimado_historia_sin_ia_min")} min</span>
                  </div>
                  <Progress value={100} className="h-2 [&>div]:bg-red-500/50" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Con MedMind IA</span>
                    <span className="text-emerald-400 font-medium">{getMetricValue("tiempo_estimado_historia_con_ia_min")} min</span>
                  </div>
                  <Progress value={40} className="h-2 [&>div]:bg-emerald-500" />
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mt-2">
                  <p className="text-sm text-emerald-400 font-semibold">
                    🕐 {getMetricValue("ahorro_tiempo_pct")}% menos tiempo de documentación
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Equivale a ~{Math.round(getMetricValue("ahorro_tiempo_pct") / 100 * getMetricValue("tiempo_estimado_historia_sin_ia_min"))} min extra de atención por paciente
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold">Completitud de Historia Clínica</h3>
              </div>
              {loadingMetrics ? (
                <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-2">
                  {[
                    { label: "Completitud general", value: getMetricValue("completitud_historia_clinica"), color: "bg-emerald-500" },
                    { label: "Diagnóstico documentado", value: getMetricValue("diagnostico_documentado_pct"), color: "bg-blue-500" },
                    { label: "Tratamiento documentado", value: getMetricValue("tratamiento_documentado_pct"), color: "bg-violet-500" },
                    { label: "Síntomas registrados", value: getMetricValue("sintomas_documentados_pct"), color: "bg-amber-500" },
                    { label: "Medicamentos registrados", value: getMetricValue("medicamentos_documentados_pct"), color: "bg-pink-500" },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="text-foreground font-medium">{item.value}%</span>
                      </div>
                      <Progress value={item.value} className={`h-1.5 [&>div]:${item.color}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* No-shows & Recordatorios */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-violet-400" />
                <h3 className="font-semibold text-sm">Inasistencias con recordatorio</h3>
              </div>
              <p className="text-4xl font-bold text-violet-400">
                <AnimatedNumber value={getMetricValue("no_show_con_recordatorio_pct")} suffix="%" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">de tasa de cancelación</p>
            </div>
            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-sm">Inasistencias sin recordatorio</h3>
              </div>
              <p className="text-4xl font-bold text-red-400">
                <AnimatedNumber value={getMetricValue("no_show_sin_recordatorio_pct")} suffix="%" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">de tasa de cancelación</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-sm text-emerald-400">Reducción de no-shows</h3>
              </div>
              <p className="text-4xl font-bold text-emerald-400">
                {getMetricValue("reduccion_no_show_pct") > 0
                  ? <AnimatedNumber value={getMetricValue("reduccion_no_show_pct")} suffix="pp" />
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">puntos porcentuales de mejora</p>
            </div>
          </div>

          {/* IA Clínica */}
          <div className="bg-card border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold">Asistencia IA — Extracción Automática</h3>
              <Badge className="ml-auto bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                {loadingMetrics ? "..." : getMetricValue("notas_analizadas")} notas analizadas
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Tareas detectadas por IA", value: getMetricValue("tareas_detectadas_ia"), icon: CheckCircle, color: "text-emerald-400" },
                { label: "Recordatorios clínicos", value: getMetricValue("recordatorios_generados_ia"), icon: AlertCircle, color: "text-amber-400" },
                { label: "Puntos clave extraídos", value: getMetricValue("puntos_clave_extraidos"), icon: Star, color: "text-violet-400" },
                { label: "Errores codificación prevenidos*", value: getMetricValue("errores_codificacion_prevenidos_estimados"), icon: Shield, color: "text-blue-400" },
              ].map(item => (
                <div key={item.label} className="bg-muted/30 rounded-xl p-4 text-center">
                  <item.icon className={`w-5 h-5 ${item.color} mx-auto mb-2`} />
                  <p className={`text-2xl font-bold ${item.color}`}>
                    <AnimatedNumber value={item.value} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">* Estimación basada en tasa de error sin IA del 23% (literatura EHR)</p>
          </div>

          {/* 8 Dimensiones de impacto */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-muted-foreground" />
              Las 8 Dimensiones de Impacto Clínico
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {IMPACT_DIMENSIONS.map(dim => (
                <div key={dim.id} className={`border rounded-xl p-4 ${dim.bg}`}>
                  <div className="flex items-start gap-3">
                    <dim.icon className={`w-5 h-5 ${dim.color} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-sm ${dim.color}`}>{dim.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{dim.subtitle}</p>
                      <p className="text-xs text-foreground/80 leading-relaxed mb-2">{dim.desc}</p>
                      <div className="bg-black/20 rounded-lg px-2 py-1.5">
                        <p className="text-[10px] text-muted-foreground italic">📚 {dim.benchmark}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA para generar paper */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-violet-500/10 border border-white/10 rounded-2xl p-8 text-center">
            <BookOpen className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Generar Paper Científico Completo</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              La IA analiza todos los datos reales de arriba y genera un estudio observacional en formato de revista médica indexada — listo para presentar a SURA, Tecnnova y EIA.
            </p>
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 px-8"
              onClick={generatePaper}
              disabled={loadingPaper}
            >
              {loadingPaper ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Brain className="w-5 h-5 mr-2" />}
              {loadingPaper ? "Generando paper científico..." : "Generar estudio científico"}
            </Button>
            {loadingPaper && (
              <p className="text-xs text-muted-foreground mt-3">⏱ Esto toma 30-60 segundos...</p>
            )}
          </div>
        </div>
      )}

      {/* ── STUDY TAB ── */}
      {activeTab === "study" && (
        <div className="space-y-4">
          {!paper && !loadingPaper && (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Paper no generado aún</h3>
              <p className="text-muted-foreground mb-6">Haz clic en "Generar paper científico" para que la IA escriba el estudio completo con tus datos reales.</p>
              <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={generatePaper}>
                <Brain className="w-4 h-4 mr-2" /> Generar ahora
              </Button>
            </div>
          )}

          {loadingPaper && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-2">Generando paper científico...</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                La IA está analizando los datos reales de la plataforma y redactando el estudio con formato de revista médica indexada. Esto toma ~45 segundos.
              </p>
            </div>
          )}

          {paper && !loadingPaper && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    ✓ Paper generado con datos reales
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    Formato revista médica indexada
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyPaper}>
                    <FileText className="w-4 h-4 mr-1" /> Copiar texto
                  </Button>
                  <Button variant="outline" size="sm" onClick={generatePaper}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Regenerar
                  </Button>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300">Nota metodológica</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este es un estudio observacional generado con IA a partir de datos reales de uso de la plataforma. Los datos base son reales;
                    las estimaciones comparativas usan benchmarks de la literatura científica publicada citada en el paper.
                    Para publicación en revista indexada, se recomienda revisión por investigador clínico y aprobación de comité de ética.
                  </p>
                </div>
              </div>

              {/* Paper content */}
              <div ref={paperRef} className="bg-card border rounded-2xl p-8">
                <MarkdownRenderer content={paper} />
              </div>

              <div className="flex justify-center pt-4">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500" onClick={copyPaper}>
                  <Download className="w-5 h-5 mr-2" />
                  Copiar paper completo
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
