import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldCheck,
  Lock,
  Server,
  Eye,
  Download,
  FileText,
  Users,
  Database,
  Clock,
  AlertCircle,
  CheckCircle2,
  Globe,
  Key,
  RefreshCw,
  Activity,
  ChevronRight,
  Mail,
} from "lucide-react";

type AccessLog = {
  id: string;
  action: string;
  resource_type: string;
  created_at: string;
  metadata: Record<string, any>;
};

const SECURITY_MEASURES = [
  {
    icon: Lock,
    title: "Cifrado AES-256 en reposo",
    description: "Todos los datos almacenados están cifrados con el mismo estándar que usan los bancos.",
    color: "text-green-400",
    bg: "bg-green-500/10",
    status: "Activo",
  },
  {
    icon: Globe,
    title: "TLS 1.3 en tránsito",
    description: "Cada petición entre tu dispositivo y MEDMIND viaja completamente encriptada.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    status: "Activo",
  },
  {
    icon: Users,
    title: "Row Level Security (RLS)",
    description: "Cada médico solo puede acceder a sus propios pacientes. Imposible ver datos de otro consultorio.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    status: "Activo",
  },
  {
    icon: RefreshCw,
    title: "Backups automáticos diarios",
    description: "Copia de seguridad completa cada 24 horas. Retención de 30 días. Recuperación en < 1 hora.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    status: "Activo",
  },
  {
    icon: Server,
    title: "Infraestructura AWS",
    description: "Servidores en AWS — el mismo proveedor de nube que usa la banca colombiana y el gobierno.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    status: "us-east-1",
  },
  {
    icon: Eye,
    title: "Registro de auditoría completo",
    description: "Cada acceso a datos de pacientes queda registrado con fecha, hora y acción realizada.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    status: "Activo",
  },
  {
    icon: Key,
    title: "Autenticación segura",
    description: "Re-verificación cada 30 días para usuarios de contraseña. Google OAuth para login sin contraseña.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    status: "Activo",
  },
  {
    icon: Shield,
    title: "Verificación de identidad médica",
    description: "Todos los médicos son verificados ante el RETHUS del Ministerio de Salud antes del acceso completo.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    status: "Activo",
  },
];

const LEGAL_COMPLIANCE = [
  {
    law: "Ley 1581 de 2012",
    description: "Ley de Protección de Datos Personales de Colombia",
    detail: "MEDMIND es responsable del tratamiento de datos y garantiza los derechos ARCO (Acceso, Rectificación, Cancelación, Oposición).",
  },
  {
    law: "Decreto 1377 de 2013",
    description: "Reglamentación del tratamiento de datos personales",
    detail: "Contamos con Política de Privacidad actualizada y mecanismos para que los titulares ejerzan sus derechos.",
  },
  {
    law: "Resolución 1995 de 1999",
    description: "Manejo de Historias Clínicas — MinSalud Colombia",
    detail: "Los registros médicos se conservan por el tiempo legalmente requerido (mínimo 20 años) sin posibilidad de eliminación prematura.",
  },
  {
    law: "Ley 1438 de 2011",
    description: "Reforma del Sistema de Salud — Derechos del paciente",
    detail: "Los pacientes tienen derecho a acceder, corregir y conocer quién ha accedido a sus datos clínicos.",
  },
];

const ARCO_RIGHTS = [
  { right: "Acceso", desc: "El paciente puede solicitar qué datos suyos tiene el médico" },
  { right: "Rectificación", desc: "Puede corregir datos incorrectos o desactualizados" },
  { right: "Cancelación", desc: "Puede solicitar eliminación de datos no médicos" },
  { right: "Oposición", desc: "Puede oponerse al uso de sus datos para fines no médicos" },
];

export default function DataSecurity() {
  const navigate = useNavigate();
  const [recentLogs, setRecentLogs] = useState<AccessLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data, count } = await supabase
        .from("data_access_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setRecentLogs(data as AccessLog[]);
      if (count !== null) setTotalLogs(count);
    } catch {}
    setLogsLoading(false);
  };

  const exportLogs = async () => {
    const { data } = await supabase
      .from("data_access_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data) return;

    const headers = ["Fecha", "Acción", "Recurso", "Paciente", "Detalles"];
    const rows = data.map(log => [
      new Date(log.created_at).toLocaleString("es-CO"),
      ACTION_LABELS[log.action] || log.action,
      log.resource_type,
      log.metadata?.patient_name || "—",
      JSON.stringify(log.metadata || {}),
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_medmind_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatAction = (action: string) => ACTION_LABELS[action] || action;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur px-6 h-16 flex items-center gap-4">
            <SidebarTrigger className="-ml-2" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Seguridad y Privacidad</h1>
                <p className="text-xs text-muted-foreground">Cumplimiento Ley 1581 de 2012 — Colombia</p>
              </div>
            </div>
            <div className="ml-auto">
              <Badge className="bg-green-500/10 text-green-400 border-green-500/30 gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                Plataforma segura
              </Badge>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-8 max-w-6xl space-y-8">

              {/* Hero */}
              <div className="relative overflow-hidden bg-gradient-to-br from-green-950/50 to-slate-950 border border-green-500/20 rounded-2xl p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full -mr-32 -mt-32" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="w-7 h-7 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Los datos de tus pacientes están seguros</h2>
                      <p className="text-muted-foreground text-sm">8 capas de seguridad activas · Cumplimiento legal total en Colombia</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {[
                      { label: "Cifrado", value: "AES-256", icon: Lock },
                      { label: "Uptime", value: "99.9%", icon: Activity },
                      { label: "Backups", value: "Diarios", icon: RefreshCw },
                      { label: "Accesos auditados", value: totalLogs.toString(), icon: Eye },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white/5 rounded-xl p-4 text-center">
                        <stat.icon className="w-5 h-5 text-green-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Security measures */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Medidas de seguridad técnicas activas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SECURITY_MEASURES.map((m) => (
                    <div key={m.title} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                      <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center shrink-0`}>
                        <m.icon className={`w-5 h-5 ${m.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm">{m.title}</p>
                          <Badge variant="outline" className="text-xs border-green-500/30 text-green-400 shrink-0">
                            {m.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal compliance */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Marco legal colombiano — Cumplimiento
                </h3>
                <div className="space-y-3">
                  {LEGAL_COMPLIANCE.map((item) => (
                    <div key={item.law} className="flex items-start gap-4 p-4 rounded-xl border border-border/50">
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{item.law}</span>
                          <span className="text-xs text-muted-foreground">— {item.description}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ARCO rights */}
              <Card className="border-blue-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="w-5 h-5 text-blue-400" />
                    Derechos ARCO de los pacientes (Ley 1581)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tus pacientes pueden ejercer estos derechos en cualquier momento enviando un email a{" "}
                    <a href="mailto:soporte@medmindsystem.com" className="text-primary underline underline-offset-2">
                      soporte@medmindsystem.com
                    </a>
                    . MEDMIND responde en máximo 10 días hábiles.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ARCO_RIGHTS.map((r) => (
                      <div key={r.right} className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-center">
                        <p className="font-bold text-blue-400 mb-1">{r.right}</p>
                        <p className="text-xs text-muted-foreground">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Audit log */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Database className="w-5 h-5 text-amber-400" />
                      Registro de auditoría de accesos
                    </CardTitle>
                    <Button size="sm" variant="outline" className="gap-2" onClick={exportLogs}>
                      <Download className="w-3 h-3" />
                      Exportar CSV
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cada vez que se accede a datos de un paciente queda registrado aquí. {totalLogs} entradas en total.
                  </p>
                </CardHeader>
                <CardContent>
                  {logsLoading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Eye className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Sin registros aún</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Los accesos a datos de pacientes aparecerán aquí automáticamente
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentLogs.map((log) => (
                        <div key={log.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{formatAction(log.action)}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.metadata?.patient_name && `Paciente: ${log.metadata.patient_name} · `}
                              {new Date(log.created_at).toLocaleString("es-CO")}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {log.resource_type}
                          </Badge>
                        </div>
                      ))}
                      {totalLogs > 10 && (
                        <p className="text-xs text-center text-muted-foreground pt-2">
                          Mostrando 10 de {totalLogs} registros. Exporta el CSV para ver todos.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* What to tell patients */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    ¿Qué decirle a tus pacientes?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Puedes usar este texto cuando un paciente pregunte por la seguridad de sus datos:
                  </p>
                  <div className="bg-card rounded-lg border border-border p-4 text-sm italic text-muted-foreground">
                    "Sus datos clínicos están almacenados en MEDMIND, plataforma certificada que cumple con la Ley 1581 de 2012 de Protección de Datos de Colombia.
                    Sus datos están cifrados con AES-256, solo yo puedo acceder a ellos, y cada acceso queda registrado en un log de auditoría.
                    Usted tiene derecho a acceder, corregir o solicitar la eliminación de sus datos enviando un email a soporte@medmindsystem.com."
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.open("/privacy-policy", "_blank")}
                    >
                      <FileText className="w-3 h-3" />
                      Ver Política de Privacidad
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        const mailto = "mailto:soporte@medmindsystem.com?subject=Solicitud ARCO — Datos Paciente";
                        window.open(mailto);
                      }}
                    >
                      <Mail className="w-3 h-3" />
                      Contacto privacidad
                    </Button>
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

const ACTION_LABELS: Record<string, string> = {
  VIEW_PATIENT: "Ver perfil de paciente",
  VIEW_RECORD: "Ver historia clínica",
  EXPORT_PDF: "Exportar PDF historia clínica",
  CREATE_RECORD: "Crear historia clínica",
  UPDATE_RECORD: "Actualizar historia clínica",
  DELETE_DATA: "Eliminar datos",
  VIEW_INVOICE: "Ver factura",
  EXPORT_CSV: "Exportar datos CSV",
};
