import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PQRSDialog } from "@/components/PQRSDialog";
import {
  Shield,
  Plus,
  FileText,
  AlertCircle,
  Scale,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type PqrsTipo = "peticion" | "queja" | "reclamo" | "sugerencia";
type PqrsEstado = "pendiente" | "en_proceso" | "respondido" | "cerrado";

interface Pqrs {
  id: string;
  tipo: PqrsTipo;
  asunto: string;
  descripcion: string;
  estado: PqrsEstado;
  respuesta: string | null;
  respondido_en: string | null;
  fecha_limite: string;
  created_at: string;
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

export default function PatientPQRS() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<Pqrs[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      loadItems(session.user.id);
    };
    init();
  }, [navigate]);

  const loadItems = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("pqrs")
        .select("*")
        .eq("patient_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data || []) as Pqrs[]);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open && user) loadItems(user.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">PQRS</h1>
              <p className="text-sm text-muted-foreground">Peticiones, Quejas, Reclamos y Sugerencias</p>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva PQRS
          </Button>
        </div>

        {/* Info alert */}
        <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800 dark:text-blue-200">¿Qué es una PQRS?</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Es el mecanismo para radicar <strong>Peticiones</strong>, <strong>Quejas</strong>, <strong>Reclamos</strong> y <strong>Sugerencias</strong> sobre la atención médica recibida.
              Según el Decreto 1011 de 2006, el prestador tiene <strong>15 días hábiles</strong> para responder.
            </p>
          </div>
        </div>

        {/* List */}
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium text-muted-foreground">No has enviado ninguna PQRS</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Usa el botón "Nueva PQRS" para enviar tu solicitud
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva PQRS
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((p) => {
              const tipoConf = TIPO_CONFIG[p.tipo];
              const estadoConf = ESTADO_CONFIG[p.estado];
              const Icon = tipoConf.icon;
              const isExpanded = expandedId === p.id;

              return (
                <Card key={p.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge className={tipoConf.badge}>{tipoConf.label}</Badge>
                            <Badge className={estadoConf.badge}>{estadoConf.label}</Badge>
                            <span className="text-xs font-mono text-muted-foreground">
                              #{p.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                          <p className="font-medium truncate">{p.asunto}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(p.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                            {" · "}Límite: {format(new Date(p.fecha_limite), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      {p.estado === "respondido" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? "Ocultar" : "Ver respuesta"}
                        </Button>
                      )}
                    </div>

                    {isExpanded && p.respuesta && (
                      <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 space-y-1">
                        <p className="text-sm font-semibold text-green-800 dark:text-green-300">Respuesta oficial:</p>
                        <p className="text-sm text-green-900 dark:text-green-200">{p.respuesta}</p>
                        {p.respondido_en && (
                          <p className="text-xs text-green-600">
                            Respondido el {format(new Date(p.respondido_en), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <PQRSDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          patientId={user?.id}
        />
      </div>
    </div>
  );
}
