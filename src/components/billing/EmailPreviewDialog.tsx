import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Eye, Mail, CheckCircle2, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
  onSuccess?: () => void;
}

interface InvoiceData {
  id: string;
  numero_factura_dian: string | null;
  cufe: string | null;
  total: number;
  estado: string;
  fecha_emision: string;
  patients: {
    full_name: string;
    email: string | null;
  };
}

export function EmailPreviewDialog({ 
  open, 
  onOpenChange, 
  invoiceId,
  onSuccess 
}: EmailPreviewDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [doctorInfo, setDoctorInfo] = useState<{ name: string; clinic?: string } | null>(null);

  useEffect(() => {
    if (open && invoiceId) {
      loadInvoiceData();
    }
  }, [open, invoiceId]);

  const loadInvoiceData = async () => {
    setLoading(true);
    try {
      // Fetch invoice with patient data
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("id, numero_factura_dian, cufe, total, estado, fecha_emision, patients(full_name, email)")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      // Fetch doctor profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, clinic_name")
          .eq("id", user.id)
          .single();

        if (profile) {
          setDoctorInfo({
            name: profile.full_name,
            clinic: profile.clinic_name || undefined
          });
        }
      }

      setInvoice(invoiceData);
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la factura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice || !invoice.patients?.email) {
      toast({
        title: "Sin email",
        description: "El paciente no tiene email registrado",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const response = await supabase.functions.invoke("send-invoice-email", {
        body: {
          invoiceId: invoice.id,
          patientEmail: invoice.patients.email,
          patientName: invoice.patients.full_name,
          invoiceNumber: invoice.numero_factura_dian || `#${invoice.id.slice(0, 8)}`,
          total: invoice.total,
          cufe: invoice.cufe,
          status: invoice.estado === "EMITIDA" || invoice.estado === "VALIDADA" ? "approved" : "rejected",
          doctorName: doctorInfo?.name || "Doctor",
          clinicName: doctorInfo?.clinic,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "¡Email enviado!",
        description: `Factura enviada exitosamente a ${invoice.patients.email}`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Error al enviar",
        description: error.message || "No se pudo enviar el email",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isApproved = invoice?.estado === "EMITIDA" || invoice?.estado === "VALIDADA";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Vista Previa del Email
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : invoice ? (
          <div className="space-y-4">
            {/* Email metadata */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground w-16">Para:</span>
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {invoice.patients?.email || (
                    <span className="text-destructive">Sin email registrado</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground w-16">De:</span>
                <span>
                  {doctorInfo?.clinic || doctorInfo?.name || "MedMind"} &lt;facturacion@medmindsystem.com&gt;
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground w-16">Asunto:</span>
                <span>
                  {isApproved ? "✅" : "⚠️"} Factura {invoice.numero_factura_dian || `#${invoice.id.slice(0, 8)}`} - {isApproved ? "Aprobada por DIAN" : "Actualización"}
                </span>
              </div>
            </div>

            <Separator />

            {/* Email preview */}
            <ScrollArea className="h-[400px] rounded-lg border">
              <div className="p-6 bg-background">
                {/* Header */}
                <div 
                  className="text-center py-8 rounded-t-lg mb-6"
                  style={{ 
                    background: isApproved 
                      ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' 
                      : 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)'
                  }}
                >
                  <div className="mx-auto mb-4 flex justify-center">
                    {isApproved ? (
                      <CheckCircle2 className="h-16 w-16 text-white" />
                    ) : (
                      <AlertCircle className="h-16 w-16 text-white" />
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-white">
                    {isApproved ? "¡Factura Aprobada!" : "Actualización de Factura"}
                  </h1>
                  <p className="text-white/80 mt-2">
                    Factura {invoice.numero_factura_dian || `#${invoice.id.slice(0, 8)}`}
                  </p>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <p className="text-foreground">
                    Hola <strong>{invoice.patients?.full_name}</strong>,
                  </p>

                  {isApproved ? (
                    <p className="text-muted-foreground">
                      Tu factura ha sido emitida y validada exitosamente por la DIAN. 
                      A continuación encontrarás los detalles y enlaces para descargar los documentos.
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Hay una actualización importante sobre tu factura. 
                      Por favor revisa los detalles a continuación.
                    </p>
                  )}

                  {/* Invoice Details Box */}
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    <h3 className="font-semibold mb-3">Detalles de la Factura</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Número:</span>
                        <p className="font-medium">
                          {invoice.numero_factura_dian || `#${invoice.id.slice(0, 8)}`}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fecha:</span>
                        <p className="font-medium">{formatDate(invoice.fecha_emision)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <p className="font-bold text-lg">{formatCurrency(invoice.total)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Estado:</span>
                        <div className="mt-1">
                          <Badge variant={isApproved ? "default" : "secondary"}>
                            {invoice.estado}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {invoice.cufe && (
                      <div className="mt-4 pt-3 border-t">
                        <span className="text-muted-foreground text-sm">CUFE:</span>
                        <p className="font-mono text-xs break-all mt-1 bg-muted p-2 rounded">
                          {invoice.cufe}
                        </p>
                      </div>
                    )}
                  </div>

                  {isApproved && (
                    <div className="flex gap-3 justify-center">
                      <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium">
                        📄 Descargar PDF
                      </div>
                      <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                        📋 Descargar XML
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="text-center text-sm text-muted-foreground pt-6 border-t">
                    <p>
                      Enviado por <strong>{doctorInfo?.clinic || doctorInfo?.name || "MedMind"}</strong>
                    </p>
                    <p className="mt-1">
                      Este correo fue generado automáticamente por el sistema de facturación electrónica.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No se encontró la factura
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={loading || sending || !invoice?.patients?.email}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
