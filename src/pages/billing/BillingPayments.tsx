import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, LogOut, Bell, User, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaymentDialog } from "@/components/billing/PaymentDialog";

type Payment = {
  id: string;
  invoice_id: string;
  monto: number;
  metodo_pago: string;
  estado: string;
  gateway_provider: string;
  transaction_id: string | null;
  fecha_pago: string;
  fecha_aprobacion: string | null;
  invoices: {
    numero_factura_dian: string | null;
    patients: {
      full_name: string;
    };
  };
};

export default function BillingPayments() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          invoices(numero_factura_dian, patients(full_name))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });

  const { data: gatewayConfig } = useQuery({
    queryKey: ["active-gateway"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_gateway_configs")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any, label: string }> = {
      APROBADO: { variant: "default", icon: CheckCircle, label: "Aprobado" },
      PENDIENTE: { variant: "secondary", icon: Clock, label: "Pendiente" },
      PROCESANDO: { variant: "outline", icon: Clock, label: "Procesando" },
      RECHAZADO: { variant: "destructive", icon: XCircle, label: "Rechazado" },
      CANCELADO: { variant: "outline", icon: XCircle, label: "Cancelado" },
    };
    return config[status] || config.PENDIENTE;
  };

  const getGatewayName = (provider: string) => {
    const names: Record<string, string> = {
      WOMPI: "Wompi",
      PAYU: "PayU",
      EPAYCO: "ePayco",
      MANUAL: "Manual",
    };
    return names[provider] || provider;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
            <h1 className="text-2xl font-bold bg-gradient-feature-soft bg-clip-text text-transparent">Pagos y Transacciones</h1>
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
              {/* Gateway Config Alert */}
              {!gatewayConfig && (
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertTitle>Configura tu pasarela de pagos</AlertTitle>
                  <AlertDescription>
                    Para procesar pagos en línea, necesitas configurar tu pasarela de pagos (Wompi, PayU o ePayco).
                    <Button
                      variant="link"
                      className="p-0 h-auto ml-2"
                      onClick={() => navigate("/billing/settings")}
                    >
                      Ir a Configuración
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {gatewayConfig && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Pasarela Activa</CardTitle>
                      <CardDescription>
                        {getGatewayName(gatewayConfig.gateway_provider)} 
                        {gatewayConfig.is_sandbox && " (Modo Sandbox)"}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/billing/settings")}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </CardHeader>
                </Card>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">
                    Historial de pagos y transacciones
                  </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Pago
                </Button>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        payments?.filter((p) => p.estado === "APROBADO")
                          .reduce((sum, p) => sum + p.monto, 0) || 0
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pagos Aprobados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {payments?.filter((p) => p.estado === "APROBADO").length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {payments?.filter((p) => p.estado === "PENDIENTE").length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {payments?.filter((p) => p.estado === "RECHAZADO").length || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payments List */}
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
              ) : payments && payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment) => {
                    const statusConfig = getStatusConfig(payment.estado);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <Card key={payment.id} className="hover:bg-accent/50 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">
                                  {payment.invoices.numero_factura_dian || `Factura ${payment.invoice_id.slice(0, 8)}`}
                                </h3>
                                <Badge variant={statusConfig.variant} className="gap-1">
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </Badge>
                                <Badge variant="outline">
                                  {getGatewayName(payment.gateway_provider)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Paciente</p>
                                  <p className="font-medium">{payment.invoices.patients.full_name}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Método</p>
                                  <p className="font-medium">{payment.metodo_pago.replace(/_/g, " ")}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Fecha</p>
                                  <p className="font-medium">{formatDate(payment.fecha_pago)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Monto</p>
                                  <p className="font-bold text-lg">{formatCurrency(payment.monto)}</p>
                                </div>
                              </div>
                              {payment.transaction_id && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  ID: {payment.transaction_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No hay pagos registrados
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Primer Pago
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>

      <PaymentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        gatewayConfig={gatewayConfig}
      />
    </SidebarProvider>
  );
}
