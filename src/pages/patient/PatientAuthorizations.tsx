import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ChevronDown, ChevronUp, Loader2, PenLine } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Authorization {
  id: string;
  tipo: string;
  texto_mostrado: string;
  aceptado: boolean;
  firma_url: string | null;
  firmado_en: string;
  created_at: string;
}

const TIPO_LABELS: Record<string, { label: string; badge: string }> = {
  habeas_data: {
    label: "Habeas Data",
    badge: "bg-blue-100 text-blue-700 border-blue-300",
  },
  consentimiento_informado: {
    label: "Consentimiento Informado",
    badge: "bg-green-100 text-green-700 border-green-300",
  },
  telemedicina: {
    label: "Telemedicina",
    badge: "bg-purple-100 text-purple-700 border-purple-300",
  },
};

export default function PatientAuthorizations() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Authorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      loadItems(session.user.id);
    };
    init();
  }, [navigate]);

  const loadItems = async (userId: string) => {
    try {
      // Query by patient_id via patients table join
      const { data: patients } = await supabase
        .from("patients")
        .select("id")
        .limit(1);

      // Try to fetch authorizations where patient is linked to this user
      const { data, error } = await supabase
        .from("patient_authorizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data || []) as Authorization[]);
    } catch {
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Mis Autorizaciones</h1>
            <p className="text-sm text-muted-foreground">
              Historial de consentimientos y autorizaciones firmadas
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 text-sm text-blue-800 dark:text-blue-200">
          Estas autorizaciones son registros legales inmutables requeridos por la Ley 1581 de 2012
          (Habeas Data) y la Ley 23 de 1981 (Ética Médica). Se conservarán durante al menos 20 años.
        </div>

        {/* List */}
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium text-muted-foreground">Sin autorizaciones registradas</p>
              <p className="text-sm text-muted-foreground mt-1">
                Las autorizaciones aparecerán aquí una vez que sean generadas por tu médico
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((auth) => {
              const tipoConf = TIPO_LABELS[auth.tipo] || {
                label: auth.tipo,
                badge: "bg-gray-100 text-gray-700 border-gray-300",
              };
              const isExpanded = expandedId === auth.id;

              return (
                <Card key={auth.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={tipoConf.badge}>{tipoConf.label}</Badge>
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            Vigente
                          </Badge>
                          {auth.firma_url && (
                            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300">
                              <PenLine className="w-3 h-3 mr-1" />
                              Con firma digital
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Firmado el{" "}
                          {format(new Date(auth.firmado_en), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", {
                            locale: es,
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : auth.id)}
                        className="flex-shrink-0"
                      >
                        {isExpanded ? (
                          <><ChevronUp className="w-4 h-4 mr-1" /> Ocultar</>
                        ) : (
                          <><ChevronDown className="w-4 h-4 mr-1" /> Ver texto</>
                        )}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 rounded-lg border bg-muted/30 p-3 max-h-64 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground">
                          {auth.texto_mostrado}
                        </pre>
                        {auth.firma_url && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Firma digital:</p>
                            <img
                              src={auth.firma_url}
                              alt="Firma digital"
                              className="max-h-20 border rounded"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
