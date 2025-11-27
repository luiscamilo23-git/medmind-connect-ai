import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Send, Eye, LogOut, Bell, User, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RIPSBatchDialog } from "@/components/billing/RIPSBatchDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type RIPSBatch = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  pagador: string;
  nit_pagador: string | null;
  total_registros: number;
  total_valor: number;
  estado: string;
  archivo_rips_url: string | null;
  errores_validacion: any;
  fecha_envio: string | null;
  created_at: string;
};

export default function BillingRIPS() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<RIPSBatch | null>(null);

  const { data: batches, isLoading } = useQuery({
    queryKey: ["rips-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rips_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RIPSBatch[];
    },
  });

  const generateRIPSMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const { data, error } = await supabase.functions.invoke("generate-rips", {
        body: { batchId },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rips-batches"] });
      toast.success("RIPS generado correctamente");
    },
    onError: (error: any) => {
      toast.error(`Error al generar RIPS: ${error.message}`);
    },
  });

  const validateRIPSMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const { data, error } = await supabase.functions.invoke("validate-rips", {
        body: { batchId },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rips-batches"] });
      toast.success("RIPS validado correctamente");
    },
    onError: (error: any) => {
      toast.error(`Error al validar RIPS: ${error.message}`);
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
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      DRAFT: { variant: "secondary", icon: Clock },
      GENERADO: { variant: "default", icon: CheckCircle },
      VALIDADO: { variant: "default", icon: CheckCircle },
      RECHAZADO: { variant: "destructive", icon: AlertCircle },
      ENVIADO: { variant: "default", icon: Send },
    };
    
    const { variant, icon: Icon } = config[status] || config.DRAFT;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const handleGenerateRIPS = (batchId: string) => {
    if (confirm("¿Generar archivo RIPS en formato JSON según Resolución 2275/2023?")) {
      generateRIPSMutation.mutate(batchId);
    }
  };

  const handleValidateRIPS = (batchId: string) => {
    if (confirm("¿Validar RIPS con el Mecanismo Único de Validación?")) {
      validateRIPSMutation.mutate(batchId);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
            <h1 className="text-2xl font-bold">RIPS - Resolución 2275/2023</h1>
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
              {/* Info Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Registro Individual de Prestación de Servicios</AlertTitle>
                <AlertDescription>
                  Los RIPS son documentos obligatorios que soportan la prestación de servicios de salud.
                  Este módulo cumple con la Resolución 2275/2023 (formato JSON) y la Resolución 558/2024 
                  (Mecanismo Único de Validación).
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">
                    Genera y valida tus archivos RIPS en formato JSON
                  </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Lote RIPS
                </Button>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Lotes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{batches?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Validados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {batches?.filter((b) => b.estado === "VALIDADO").length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {batches?.filter((b) => b.estado === "DRAFT" || b.estado === "GENERADO").length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatCurrency(batches?.reduce((sum, b) => sum + b.total_valor, 0) || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Batches List */}
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
              ) : batches && batches.length > 0 ? (
                <div className="space-y-4">
                  {batches.map((batch) => (
                    <Card key={batch.id} className="hover:bg-accent/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              Lote RIPS - {batch.pagador}
                              {getStatusBadge(batch.estado)}
                            </CardTitle>
                            <CardDescription>
                              Período: {formatDate(batch.fecha_inicio)} - {formatDate(batch.fecha_fin)}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            {batch.estado === "DRAFT" && (
                              <Button
                                size="sm"
                                onClick={() => handleGenerateRIPS(batch.id)}
                                disabled={generateRIPSMutation.isPending}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Generar JSON
                              </Button>
                            )}
                            {batch.estado === "GENERADO" && (
                              <Button
                                size="sm"
                                onClick={() => handleValidateRIPS(batch.id)}
                                disabled={validateRIPSMutation.isPending}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Validar
                              </Button>
                            )}
                            {batch.archivo_rips_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(batch.archivo_rips_url!, "_blank")}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Registros</p>
                            <p className="font-semibold text-lg">{batch.total_registros}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valor Total</p>
                            <p className="font-semibold text-lg">{formatCurrency(batch.total_valor)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">NIT Pagador</p>
                            <p className="font-medium">{batch.nit_pagador || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Creación</p>
                            <p className="font-medium">{formatDate(batch.created_at)}</p>
                          </div>
                        </div>

                        {batch.errores_validacion && (
                          <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Errores de Validación</AlertTitle>
                            <AlertDescription>
                              <ul className="list-disc list-inside mt-2">
                                {Object.entries(batch.errores_validacion).map(([key, value]: [string, any]) => (
                                  <li key={key}>{value}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No tienes lotes RIPS generados
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primer Lote RIPS
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>

      <RIPSBatchDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </SidebarProvider>
  );
}
