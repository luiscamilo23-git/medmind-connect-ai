import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, LogOut, Bell, User, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Invoice = {
  id: string;
  numero_factura_dian: string | null;
  patient_id: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  subtotal: number;
  impuestos: number;
  total: number;
  estado: string;
  payment_status: string;
  patients: {
    full_name: string;
  };
};

export default function BillingInvoices() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const filteredInvoices = invoices?.filter((inv) => 
    statusFilter === "all" || inv.estado === statusFilter
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
            <h1 className="text-2xl font-bold">Facturación Electrónica</h1>
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
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Factura
                </Button>
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
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
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
                        <Button>
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
    </SidebarProvider>
  );
}
