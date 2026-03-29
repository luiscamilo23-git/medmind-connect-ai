import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Clock, AlertCircle, Webhook } from "lucide-react";

interface DIANWebhookEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}

interface WebhookEvent {
  id: string;
  provider: string;
  event_type: string;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
  payload: any;
}

export function DIANWebhookEventsDialog({
  open,
  onOpenChange,
  invoiceId,
}: DIANWebhookEventsDialogProps) {
  const { data: events, isLoading } = useQuery({
    queryKey: ["webhook-events", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dian_webhook_events")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WebhookEvent[];
    },
    enabled: open,
  });

  const getStatusIcon = (processed: boolean, errorMessage: string | null) => {
    if (errorMessage) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (processed) {
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    }
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (processed: boolean, errorMessage: string | null) => {
    if (errorMessage) {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (processed) {
      return <Badge variant="default">Procesado</Badge>;
    }
    return <Badge variant="secondary">Pendiente</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Eventos Webhook DIAN
          </DialogTitle>
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
        ) : events && events.length > 0 ? (
          <div className="space-y-4 py-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(event.processed, event.error_message)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{event.provider}</span>
                            {getStatusBadge(event.processed, event.error_message)}
                            <Badge variant="outline" className="text-xs">
                              {event.event_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Recibido: {new Date(event.created_at).toLocaleString("es-CO")}
                          </p>
                          {event.processed_at && (
                            <p className="text-xs text-muted-foreground">
                              Procesado: {new Date(event.processed_at).toLocaleString("es-CO")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {event.error_message && (
                      <div className="bg-destructive/10 border border-destructive/20 p-3 rounded">
                        <p className="text-xs font-medium mb-1 text-destructive">Error</p>
                        <p className="text-sm text-destructive">{event.error_message}</p>
                      </div>
                    )}

                    <details className="cursor-pointer">
                      <summary className="text-xs font-medium text-muted-foreground">
                        Ver payload completo
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </details>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay eventos webhook registrados para esta factura
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Los eventos aparecerán aquí cuando el proveedor DIAN envíe notificaciones
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
