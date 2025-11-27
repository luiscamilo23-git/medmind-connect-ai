import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface DIANEmissionLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}

interface EmissionLog {
  id: string;
  provider: string;
  status: string;
  error_message: string | null;
  cufe: string | null;
  numero_dian: string | null;
  created_at: string;
  request_payload: any;
  response_payload: any;
}

export function DIANEmissionLogsDialog({
  open,
  onOpenChange,
  invoiceId,
}: DIANEmissionLogsDialogProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["dian-logs", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dian_emission_logs")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EmissionLog[];
    },
    enabled: open,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "ERROR":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      SUCCESS: "default",
      ERROR: "destructive",
      PENDING: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de Emisión DIAN</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="space-y-4 py-4">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{log.provider}</span>
                            {getStatusBadge(log.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString("es-CO")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {log.cufe && (
                      <div className="bg-muted p-3 rounded">
                        <p className="text-xs font-medium mb-1">CUFE</p>
                        <p className="text-xs font-mono break-all">{log.cufe}</p>
                      </div>
                    )}

                    {log.numero_dian && (
                      <div className="bg-muted p-3 rounded">
                        <p className="text-xs font-medium mb-1">Número DIAN</p>
                        <p className="text-sm font-mono">{log.numero_dian}</p>
                      </div>
                    )}

                    {log.error_message && (
                      <div className="bg-destructive/10 border border-destructive/20 p-3 rounded">
                        <p className="text-xs font-medium mb-1 text-destructive">Error</p>
                        <p className="text-sm text-destructive">{log.error_message}</p>
                      </div>
                    )}

                    {log.response_payload && (
                      <details className="cursor-pointer">
                        <summary className="text-xs font-medium text-muted-foreground">
                          Ver respuesta completa
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                          {JSON.stringify(log.response_payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay intentos de emisión registrados para esta factura
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
