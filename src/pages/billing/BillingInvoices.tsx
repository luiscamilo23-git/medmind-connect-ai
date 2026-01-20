import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, LogOut, Bell, User, Filter, Send, CheckCircle2, AlertCircle, FileText, Webhook, Download, RefreshCw, BarChart3, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DIANEmissionLogsDialog } from "@/components/billing/DIANEmissionLogsDialog";
import { DIANWebhookEventsDialog } from "@/components/billing/DIANWebhookEventsDialog";
import { InvoiceReemissionDialog } from "@/components/billing/InvoiceReemissionDialog";
import { DIANRealtimeNotifications } from "@/components/billing/DIANRealtimeNotifications";
import { InvoiceDialog } from "@/components/billing/InvoiceDialog";
import { EmailPreviewDialog } from "@/components/billing/EmailPreviewDialog";
import { generateInvoicePDF } from "@/utils/pdfGenerator";

type Invoice = {
  id: string;
  numero_factura_dian: string | null;
  cufe: string | null;
  patient_id: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  subtotal: number;
  impuestos: number;
  total: number;
  estado: string;
  payment_status: string;
  proveedor_dian: string | null;
  patients: {
    full_name: string;
  };
};

export default function BillingInvoices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [emittingInvoice, setEmittingInvoice] = useState<string | null>(null);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [webhooksDialogOpen, setWebhooksDialogOpen] = useState(false);
  const [selectedInvoiceForLogs, setSelectedInvoiceForLogs] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<{ id: string; format: 'pdf' | 'xml' } | null>(null);
  const [reemissionDialogOpen, setReemissionDialogOpen] = useState(false);
  const [selectedInvoiceForReemission, setSelectedInvoiceForReemission] = useState<string | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<string | null>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, patients(full_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "secondary",
      EMITIDA: "default",
      VALIDADA: "default",
      RECHAZADA: "destructive",
      ANULADA: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDIENTE: "secondary",
      PAGADA: "default",
      PARCIAL: "outline",
      VENCIDA: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const handleEmitToDIAN = async (invoiceId: string) => {
    setEmittingInvoice(invoiceId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "No autenticado",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke("emit-invoice-dian", {
        body: { invoiceId },
      });

      if (response.error) {
        console.error("Emission error:", response.error);
        toast({
          title: "Error al emitir",
          description: response.error.message || "Error desconocido",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "¡Factura emitida exitosamente!",
        description: `CUFE: ${response.data.cufe?.substring(0, 20)}...`,
      });

      // Refresh invoices
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Error al emitir factura",
        variant: "destructive",
      });
    } finally {
      setEmittingInvoice(null);
    }
  };

  const handleViewLogs = (invoiceId: string) => {
    setSelectedInvoiceForLogs(invoiceId);
    setLogsDialogOpen(true);
  };

  const handleViewWebhooks = (invoiceId: string) => {
    setSelectedInvoiceForLogs(invoiceId);
    setWebhooksDialogOpen(true);
  };

  const handleDownloadDocument = async (invoiceId: string, format: 'pdf' | 'xml') => {
    try {
      setDownloadingFormat({ id: invoiceId, format });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "No estás autenticado",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('generate-invoice-documents', {
        body: { invoiceId, format },
      });

      if (response.error) throw response.error;

      const invoice = invoices?.find(inv => inv.id === invoiceId);
      const filename = `factura-${invoice?.numero_factura_dian || invoiceId}`;

      if (format === 'xml') {
        const blob = new Blob([response.data], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({
          title: "¡XML descargado!",
          description: "Documento XML generado según estándares DIAN",
        });
      } else {
        const pdfData = JSON.parse(atob(response.data.pdf));
        const doc = generateInvoicePDF(
          pdfData.invoice,
          pdfData.items,
          pdfData.patient,
          pdfData.doctor
        );
        doc.save(`${filename}.pdf`);
        toast({
          title: "¡PDF generado!",
          description: "Factura PDF descargada exitosamente",
        });
      }
    } catch (error: any) {
      console.error(`Error downloading ${format.toUpperCase()}:`, error);
      toast({
        title: "Error",
        description: error.message || `Error al descargar ${format.toUpperCase()}`,
        variant: "destructive",
      });
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleReemit = (invoiceId: string) => {
    setSelectedInvoiceForReemission(invoiceId);
    setReemissionDialogOpen(true);
  };

  const handleReemissionSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };

  const handleSendToClient = (invoiceId: string) => {
    setSelectedInvoiceForEmail(invoiceId);
    setEmailPreviewOpen(true);
  };

  const filteredInvoices = invoices?.filter((inv) => 
    statusFilter === "all" || inv.estado === statusFilter
  );

  return (
    <SidebarProvider>
      <DIANRealtimeNotifications />
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
            <h1 className="text-2xl font-bold bg-gradient-feature-soft bg-clip-text text-transparent">Facturación Electrónica</h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">
                    Gestiona tus facturas electrónicas - Cumplimiento normativo colombiano
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate('/billing/monitoring')}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Monitoreo DIAN
                  </Button>
                  <Button onClick={() => setInvoiceDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Factura
                  </Button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(invoices?.reduce((sum, inv) => sum + inv.total, 0) || 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        invoices?.filter((inv) => inv.payment_status === "PENDIENTE")
                          .reduce((sum, inv) => sum + inv.total, 0) || 0
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Facturas Emitidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {invoices?.filter((inv) => inv.estado === "EMITIDA").length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Borradores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {invoices?.filter((inv) => inv.estado === "DRAFT").length || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="DRAFT">Borradores</TabsTrigger>
                  <TabsTrigger value="EMITIDA">Emitidas</TabsTrigger>
                  <TabsTrigger value="VALIDADA">Validadas</TabsTrigger>
                  <TabsTrigger value="RECHAZADA">Rechazadas</TabsTrigger>
                </TabsList>

                <TabsContent value={statusFilter} className="mt-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-6">
                            <div className="space-y-2">
                              <div className="h-4 bg-muted rounded w-3/4"></div>
                              <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredInvoices && filteredInvoices.length > 0 ? (
                    <div className="space-y-4">
                       {filteredInvoices.map((invoice) => (
                        <Card key={invoice.id} className="hover:bg-accent/50 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">
                                    {invoice.numero_factura_dian || `Factura #${invoice.id.slice(0, 8)}`}
                                  </h3>
                                  {getStatusBadge(invoice.estado)}
                                  {getPaymentBadge(invoice.payment_status)}
                                  {invoice.cufe && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge variant="outline" className="gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            CUFE
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs max-w-xs break-all">{invoice.cufe}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  {invoice.proveedor_dian && (
                                    <Badge variant="secondary" className="text-xs">
                                      {invoice.proveedor_dian}
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Paciente</p>
                                    <p className="font-medium">{invoice.patients.full_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Fecha</p>
                                    <p className="font-medium">{formatDate(invoice.fecha_emision)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Vencimiento</p>
                                    <p className="font-medium">{formatDate(invoice.fecha_vencimiento)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Total</p>
                                    <p className="font-bold text-lg">{formatCurrency(invoice.total)}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Enviar al Cliente - visible para todas las facturas */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSendToClient(invoice.id)}
                                      >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Enviar al Cliente
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Enviar factura por email al paciente</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {invoice.estado === "DRAFT" && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEmitToDIAN(invoice.id)}
                                          disabled={emittingInvoice === invoice.id}
                                        >
                                          {emittingInvoice === invoice.id ? (
                                            <>
                                              <span className="animate-spin mr-2">⏳</span>
                                              Emitiendo...
                                            </>
                                          ) : (
                                            <>
                                              <Send className="h-4 w-4 mr-2" />
                                              Emitir DIAN
                                            </>
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Emitir factura electrónica a DIAN</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {invoice.estado === "RECHAZADA" && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleReemit(invoice.id)}
                                        >
                                          <RefreshCw className="h-4 w-4 mr-2" />
                                          Reemitir
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Analizar errores y reemitir factura</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {(invoice.estado === "EMITIDA" || invoice.estado === "VALIDADA" || invoice.cufe) && (
                                  <>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadDocument(invoice.id, 'pdf')}
                                            disabled={downloadingFormat?.id === invoice.id && downloadingFormat?.format === 'pdf'}
                                          >
                                            <Download className="h-4 w-4 mr-2" />
                                            PDF
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Descargar factura en PDF</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadDocument(invoice.id, 'xml')}
                                            disabled={downloadingFormat?.id === invoice.id && downloadingFormat?.format === 'xml'}
                                          >
                                            <FileText className="h-4 w-4 mr-2" />
                                            XML
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Descargar XML DIAN</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleViewLogs(invoice.id)}
                                          >
                                            <FileText className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Ver logs de emisión DIAN</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleViewWebhooks(invoice.id)}
                                          >
                                            <Webhook className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Ver eventos webhook</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </>
                                )}
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground mb-4">
                          No hay facturas en esta categoría
                        </p>
                        <Button onClick={() => setInvoiceDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Primera Factura
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {selectedInvoiceForLogs && (
        <>
          <DIANEmissionLogsDialog
            open={logsDialogOpen}
            onOpenChange={setLogsDialogOpen}
            invoiceId={selectedInvoiceForLogs}
          />
          <DIANWebhookEventsDialog
            open={webhooksDialogOpen}
            onOpenChange={setWebhooksDialogOpen}
            invoiceId={selectedInvoiceForLogs}
          />
        </>
      )}

      {selectedInvoiceForReemission && (
        <InvoiceReemissionDialog
          invoiceId={selectedInvoiceForReemission}
          open={reemissionDialogOpen}
          onOpenChange={setReemissionDialogOpen}
          onSuccess={handleReemissionSuccess}
        />
      )}

      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
      />

      <EmailPreviewDialog
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        invoiceId={selectedInvoiceForEmail}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["invoices"] })}
      />
    </SidebarProvider>
  );
}
