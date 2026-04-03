import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Scale,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";

type PqrsTipo = "peticion" | "queja" | "reclamo" | "sugerencia";
type PqrsEstado = "pendiente" | "en_proceso" | "respondido" | "cerrado";

interface Pqrs {
  id: string;
  tipo: PqrsTipo;
  asunto: string;
  descripcion: string;
  nombre_remitente: string | null;
  email_remitente: string | null;
  estado: PqrsEstado;
  respuesta: string | null;
  respondido_en: string | null;
  fecha_limite: string;
  prioridad: string;
  created_at: string;
}

const COLOMBIAN_HOLIDAYS = [
  "01-01", "01-06", "03-24", "04-17", "04-18",
  "05-01", "05-29", "06-19", "06-30", "07-20",
  "08-07", "08-18", "10-13", "11-03", "11-17",
  "12-08", "12-25",
];

function businessDaysRemaining(fechaLimite: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(fechaLimite);
  limit.setHours(0, 0, 0, 0);

  if (limit <= today) return 0;

  let count = 0;
  const cur = new Date(today);
  while (cur < limit) {
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() === 0) continue;
    const mmdd = `${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    if (COLOMBIAN_HOLIDAYS.includes(mmdd)) continue;
    if (cur <= limit) count++;
  }
  return count;
}

const TIPO_CONFIG: Record<PqrsTipo, { label: string; icon: React.ElementType; badge: string }> = {
  peticion: { label: "Petición", icon: FileText, badge: "bg-blue-100 text-blue-700 border-blue-300" },
  queja: { label: "Queja", icon: AlertCircle, badge: "bg-orange-100 text-orange-700 border-orange-300" },
  reclamo: { label: "Reclamo", icon: Scale, badge: "bg-red-100 text-red-700 border-red-300" },
  sugerencia: { label: "Sugerencia", icon: Lightbulb, badge: "bg-green-100 text-green-700 border-green-300" },
};

const ESTADO_CONFIG: Record<PqrsEstado, { label: string; badge: string }> = {
  pendiente: { label: "Pendiente", badge: "bg-amber-100 text-amber-700 border-amber-300" },
  en_proceso: { label: "En proceso", badge: "bg-blue-100 text-blue-700 border-blue-300" },
  respondido: { label: "Respondido", badge: "bg-green-100 text-green-700 border-green-300" },
  cerrado: { label: "Cerrado", badge: "bg-gray-100 text-gray-700 border-gray-300" },
};

type FilterType = "todos" | PqrsEstado;

export default function PQRS() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Pqrs[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("todos");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respuestaText, setRespuestaText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPQRS();
  }, []);

  const loadPQRS = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data, error } = await supabase
        .from("pqrs")
        .select("*")
        .eq("doctor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data || []) as Pqrs[]);
    } catch (err: any) {
      toast.error("Error cargando PQRS: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResponder = async (id: string) => {
    if (!respuestaText.trim()) {
      toast.error("Escribe una respuesta antes de guardar");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pqrs")
        .update({
          respuesta: respuestaText.trim(),
          estado: "respondido",
          respondido_en: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Respuesta guardada exitosamente");
      setRespondingId(null);
      setRespuestaText("");
      loadPQRS();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter((p) => {
    const matchSearch =
      p.asunto.toLowerCase().includes(search.toLowerCase()) ||
      (p.nombre_remitente || "").toLowerCase().includes(search.toLowerCase()) ||
      p.id.slice(0, 8).toUpperCase().includes(search.toUpperCase());
    const matchFilter = filter === "todos" || p.estado === filter;
    return matchSearch && matchFilter;
  });

  const now = new Date();
  const stats = {
    total: items.length,
    pendientes: items.filter((p) => p.estado === "pendiente").length,
    respondidos: items.filter((p) => p.estado === "respondido").length,
    vencidos: items.filter((p) => new Date(p.fecha_limite) < now && p.estado !== "respondido" && p.estado !== "cerrado").length,
  };

  const urgentes = items.filter(
    (p) =>
      p.estado !== "respondido" &&
      p.estado !== "cerrado" &&
      businessDaysRemaining(p.fecha_limite) <= 3 &&
      businessDaysRemaining(p.fecha_limite) > 0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "pendiente", label: "Pendientes" },
    { key: "en_proceso", label: "En proceso" },
    { key: "respondido", label: "Respondidos" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card/95 backdrop-blur px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">PQRS</h1>
            </div>
            <Badge variant="outline" className="ml-auto">
              {filtered.length} registros
            </Badge>
          </header>

          <main className="p-6 space-y-6">
            {/* Alert for urgent */}
            {urgentes.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-400 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>{urgentes.length} PQRS</strong> vence{urgentes.length === 1 ? "" : "n"} en menos de 3 días hábiles.
                  Responda a la brevedad para cumplir con el Decreto 1011/2006.
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total PQRS</div>
                </CardContent>
              </Card>
              <Card className="border-amber-300">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-amber-600">{stats.pendientes}</div>
                  <div className="text-sm text-muted-foreground">Pendientes</div>
                </CardContent>
              </Card>
              <Card className="border-green-300">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{stats.respondidos}</div>
                  <div className="text-sm text-muted-foreground">Respondidos</div>
                </CardContent>
              </Card>
              <Card className="border-red-300">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{stats.vencidos}</div>
                  <div className="text-sm text-muted-foreground">Vencidos</div>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Gestión de PQRS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search + filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder="Buscar por asunto, remitente o radicado..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {filterButtons.map((fb) => (
                      <Button
                        key={fb.key}
                        size="sm"
                        variant={filter === fb.key ? "default" : "outline"}
                        onClick={() => setFilter(fb.key)}
                      >
                        {fb.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Asunto</TableHead>
                        <TableHead>Remitente</TableHead>
                        <TableHead>Radicado</TableHead>
                        <TableHead>Fecha límite</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((p) => {
                        const tipoConf = TIPO_CONFIG[p.tipo];
                        const estadoConf = ESTADO_CONFIG[p.estado];
                        const daysLeft = businessDaysRemaining(p.fecha_limite);
                        const isVencido = new Date(p.fecha_limite) < now && p.estado !== "respondido" && p.estado !== "cerrado";
                        const Icon = tipoConf.icon;

                        return (
                          <>
                            <TableRow key={p.id}>
                              <TableCell>
                                <Badge className={tipoConf.badge}>
                                  <Icon className="w-3 h-3 mr-1" />
                                  {tipoConf.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate font-medium">
                                {p.asunto}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {p.nombre_remitente || "Anónimo"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {p.id.slice(0, 8).toUpperCase()}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {format(new Date(p.fecha_limite), "dd MMM yyyy", { locale: es })}
                                </div>
                                {isVencido ? (
                                  <span className="text-xs font-bold text-red-600">VENCIDO</span>
                                ) : (
                                  <span className={`text-xs ${daysLeft <= 3 ? "text-amber-600 font-semibold" : "text-muted-foreground"}`}>
                                    {daysLeft} días hábiles
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={estadoConf.badge}>{estadoConf.label}</Badge>
                              </TableCell>
                              <TableCell>
                                {p.estado !== "respondido" && p.estado !== "cerrado" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setRespondingId(respondingId === p.id ? null : p.id);
                                      setRespuestaText(p.respuesta || "");
                                    }}
                                  >
                                    Responder
                                  </Button>
                                )}
                                {(p.estado === "respondido" || p.estado === "cerrado") && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setRespondingId(respondingId === p.id ? null : p.id)}
                                  >
                                    Ver respuesta
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                            {respondingId === p.id && (
                              <TableRow key={p.id + "-resp"}>
                                <TableCell colSpan={7}>
                                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                                    <div className="text-sm font-medium">Descripción: <span className="font-normal text-muted-foreground">{p.descripcion}</span></div>
                                    {p.estado !== "respondido" && p.estado !== "cerrado" ? (
                                      <>
                                        <Textarea
                                          placeholder="Escribe la respuesta oficial..."
                                          value={respuestaText}
                                          onChange={(e) => setRespuestaText(e.target.value)}
                                          rows={3}
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => handleResponder(p.id)}
                                            disabled={saving}
                                          >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                                            Guardar respuesta
                                          </Button>
                                          <Button size="sm" variant="ghost" onClick={() => setRespondingId(null)}>
                                            Cancelar
                                          </Button>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-sm">
                                        <strong>Respuesta:</strong> {p.respuesta}
                                        {p.respondido_en && (
                                          <span className="text-xs text-muted-foreground ml-2">
                                            ({format(new Date(p.respondido_en), "dd MMM yyyy HH:mm", { locale: es })})
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-16">
                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                              <Shield className="w-12 h-12 opacity-30" />
                              <p className="font-medium">Sin PQRS registradas</p>
                              <p className="text-sm">No se encontraron PQRS con los filtros actuales</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
