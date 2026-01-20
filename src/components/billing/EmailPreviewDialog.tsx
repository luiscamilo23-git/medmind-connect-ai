import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Eye, Mail, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
  onSuccess?: () => void;
}

interface ServiceItem {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total_linea: number;
}

interface InvoiceData {
  id: string;
  numero_factura_dian: string | null;
  cufe: string | null;
  total: number;
  subtotal: number;
  impuestos: number;
  estado: string;
  fecha_emision: string;
  pdf_url: string | null;
  patients: {
    full_name: string;
    email: string | null;
  };
  invoice_items: ServiceItem[];
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [doctorInfo, setDoctorInfo] = useState<{ name: string; clinic?: string } | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && invoiceId) {
      loadInvoiceData();
    }
  }, [open, invoiceId]);

  const loadInvoiceData = async () => {
    setLoading(true);
    setPdfUrl(null);
    try {
      // Fetch invoice with patient data and items
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          id, numero_factura_dian, cufe, total, subtotal, impuestos, estado, fecha_emision, pdf_url,
          patients(full_name, email),
          invoice_items(descripcion, cantidad, precio_unitario, total_linea)
        `)
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
      
      // If PDF already exists, use it
      if (invoiceData.pdf_url) {
        setPdfUrl(invoiceData.pdf_url);
      }
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

  const generatePdf = async () => {
    if (!invoice) return null;
    
    setGeneratingPdf(true);
    try {
      const response = await supabase.functions.invoke("generate-prefactura-pdf", {
        body: { invoiceId: invoice.id },
      });

      if (response.error) throw response.error;
      
      if (response.data?.pdfUrl) {
        setPdfUrl(response.data.pdfUrl);
        return response.data.pdfUrl;
      }
      return null;
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF de la prefactura",
        variant: "destructive",
      });
      return null;
    } finally {
      setGeneratingPdf(false);
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
      // Generate PDF first if not already generated
      let finalPdfUrl = pdfUrl;
      if (!finalPdfUrl) {
        finalPdfUrl = await generatePdf();
      }

      const response = await supabase.functions.invoke("send-invoice-email", {
        body: {
          invoiceId: invoice.id,
          patientEmail: invoice.patients.email,
          patientName: invoice.patients.full_name,
          invoiceNumber: invoice.numero_factura_dian || `#${invoice.id.slice(0, 8)}`,
          total: invoice.total,
          subtotal: invoice.subtotal,
          impuestos: invoice.impuestos,
          fechaEmision: invoice.fecha_emision,
          doctorName: doctorInfo?.name || "Doctor",
          clinicName: doctorInfo?.clinic,
          pdfUrl: finalPdfUrl,
          services: invoice.invoice_items || [],
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "¡Email enviado!",
        description: `Prefactura enviada exitosamente a ${invoice.patients.email}`,
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clinicOrDoctor = doctorInfo?.clinic || doctorInfo?.name || "Tu proveedor de salud";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Vista Previa del Email - Prefactura
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
                  {clinicOrDoctor} &lt;facturacion@medmindsystem.com&gt;
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground w-16">Asunto:</span>
                <span>
                  Prefactura {invoice.numero_factura_dian || `#${invoice.id.slice(0, 8)}`} - {clinicOrDoctor}
                </span>
              </div>
              {pdfUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-muted-foreground w-16">PDF:</span>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Ver prefactura PDF
                  </a>
                </div>
              )}
            </div>

            <Separator />

            {/* Email preview */}
            <ScrollArea className="h-[450px] rounded-lg border">
              <div className="bg-muted/30 p-6">
                <div className="max-w-[550px] mx-auto bg-background rounded-xl overflow-hidden shadow-sm border">
                  {/* Header */}
                  <div 
                    className="text-center py-8 px-6"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)' }}
                  >
                    <h1 className="text-xl font-bold text-primary-foreground mb-1">📄 Prefactura</h1>
                    <p className="text-primary-foreground/80 text-sm">{clinicOrDoctor}</p>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-5">
                    <p className="text-foreground">
                      Hola <strong>{invoice.patients?.full_name}</strong>,
                    </p>

                    <p className="text-muted-foreground text-sm">
                      Adjunto encontrarás tu prefactura correspondiente a los servicios prestados. A continuación los detalles:
                    </p>

                    {/* Invoice Details Box */}
                    <div className="bg-muted/30 rounded-xl p-5 border">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Número de Prefactura</p>
                          <p className="font-bold text-lg">
                            {invoice.numero_factura_dian || `#${invoice.id.slice(0, 8)}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase">Fecha y Hora</p>
                          <p className="text-sm">{formatDate(invoice.fecha_emision)}</p>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(invoice.subtotal || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">IVA</span>
                          <span>{formatCurrency(invoice.impuestos || 0)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center">
                          <p className="text-muted-foreground text-sm font-medium">Total a Pagar</p>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(invoice.total)}</p>
                            <p className="text-xs text-muted-foreground">COP</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Services Table */}
                    {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Detalle de servicios:</p>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-primary/10">
                                <TableHead className="text-xs">Servicio</TableHead>
                                <TableHead className="text-xs text-center">Cant.</TableHead>
                                <TableHead className="text-xs text-right">P. Unit.</TableHead>
                                <TableHead className="text-xs text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {invoice.invoice_items.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell className="text-sm">{item.descripcion}</TableCell>
                                  <TableCell className="text-sm text-center">{item.cantidad}</TableCell>
                                  <TableCell className="text-sm text-right">{formatCurrency(item.precio_unitario)}</TableCell>
                                  <TableCell className="text-sm text-right font-medium text-primary">{formatCurrency(item.total_linea)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Download button preview */}
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm mb-3">Descarga tu prefactura:</p>
                      <div className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg text-sm font-semibold">
                        📄 Descargar Prefactura PDF
                      </div>
                    </div>

                    {/* Provider info */}
                    <div className="bg-muted/30 rounded-lg p-4 border-t mt-4">
                      <p className="text-xs text-muted-foreground uppercase mb-1">Emitido por</p>
                      <p className="font-semibold">{clinicOrDoctor}</p>
                      {doctorInfo?.name && doctorInfo?.clinic && (
                        <p className="text-muted-foreground text-sm">Dr(a). {doctorInfo.name}</p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                      <p>¿Tienes preguntas? Contacta directamente con {clinicOrDoctor}</p>
                    </div>
                  </div>

                  {/* Footer bar */}
                  <div className="bg-card-foreground text-center py-4 px-6">
                    <p className="text-card text-sm font-medium">{clinicOrDoctor}</p>
                    <p className="text-card/60 text-xs">Prefacturación · Colombia</p>
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
          {!pdfUrl && invoice && (
            <Button 
              variant="secondary"
              onClick={generatePdf} 
              disabled={generatingPdf}
            >
              {generatingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generar PDF
                </>
              )}
            </Button>
          )}
          <Button 
            onClick={handleSendEmail} 
            disabled={loading || sending || generatingPdf || !invoice?.patients?.email}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Prefactura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
