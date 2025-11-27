import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Bell } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

interface WebhookNotification {
  id: string;
  event_type: string;
  provider: string;
  invoice_id: string;
  processed: boolean;
  error_message: string | null;
  created_at: string;
}

export function DIANRealtimeNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<WebhookNotification[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    console.log('Setting up Supabase Realtime for webhook events...');

    // Subscribe to realtime changes on dian_webhook_events
    const channel = supabase
      .channel('dian-webhook-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dian_webhook_events'
        },
        (payload) => {
          console.log('New webhook event received:', payload);
          const newEvent = payload.new as WebhookNotification;
          
          setNotifications(prev => [newEvent, ...prev].slice(0, 5));
          setShowAlert(true);

          // Determine notification type
          const isApproved = newEvent.event_type.includes('approved') || 
                            newEvent.event_type.includes('validada');
          const isRejected = newEvent.event_type.includes('rejected') || 
                            newEvent.event_type.includes('rechazada');

          // Show toast notification
          toast({
            title: isApproved ? "✅ Factura Aprobada" : isRejected ? "❌ Factura Rechazada" : "📬 Nueva Notificación DIAN",
            description: isApproved 
              ? `La factura ha sido aprobada exitosamente por la DIAN (${newEvent.provider})`
              : isRejected
              ? `La factura fue rechazada por la DIAN. ${newEvent.error_message || ''}`
              : `Nuevo evento recibido del proveedor ${newEvent.provider}`,
            variant: isRejected ? "destructive" : "default",
            duration: 8000,
          });

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["dian-emission-logs"] });

          // Send email notification automatically
          if (isApproved || isRejected) {
            sendEmailNotification(newEvent.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to webhook events');
        }
      });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [toast, queryClient]);

  const sendEmailNotification = async (webhookEventId: string) => {
    try {
      console.log('Sending email notification for webhook event:', webhookEventId);
      const response = await supabase.functions.invoke('send-invoice-email', {
        body: { webhookEventId },
      });

      if (response.error) {
        console.error('Error sending email:', response.error);
      } else {
        console.log('Email sent successfully:', response.data);
      }
    } catch (error) {
      console.error('Error calling send-invoice-email function:', error);
    }
  };

  const handleDismiss = () => {
    setShowAlert(false);
    setNotifications([]);
  };

  if (!showAlert || notifications.length === 0) {
    return null;
  }

  const latestNotification = notifications[0];
  const isApproved = latestNotification.event_type.includes('approved') || 
                     latestNotification.event_type.includes('validada');

  return (
    <div className="fixed top-20 right-6 z-50 max-w-md animate-in slide-in-from-top-5">
      <Alert variant={isApproved ? "default" : "destructive"} className="shadow-lg">
        <div className="flex items-start gap-3">
          {isApproved ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <div className="flex-1">
            <AlertTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {isApproved ? "Factura Aprobada" : "Factura Rechazada"}
            </AlertTitle>
            <AlertDescription className="text-sm mt-2">
              <p className="font-medium">{latestNotification.provider}</p>
              {latestNotification.error_message && (
                <p className="mt-1 text-xs">{latestNotification.error_message}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(latestNotification.created_at).toLocaleString('es-CO')}
              </p>
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </Alert>
      
      {notifications.length > 1 && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          +{notifications.length - 1} notificaciones más
        </p>
      )}
    </div>
  );
}
