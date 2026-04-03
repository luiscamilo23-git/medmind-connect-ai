import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Send, List, LogOut, Bell, User, AlertCircle, CheckCircle, Clock, Sparkles, Filter, Building2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RIPSBatchDialog } from "@/components/billing/RIPSBatchDialog";
import { RIPSBatchDetail } from "@/components/billing/RIPSBatchDetail";
import { AIRIPSAssistant } from "@/components/billing/AIRIPSAssistant";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  cuv: string | null;
  fecha_cuv: string | null;
  created_at: string;
  modalidad?: string;
};

export default function BillingRIPS() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [modalidadFilter, setModalidadFilter] = useState<string>("all");
  const [detailBatch, setDetailBatch] = useState<{ id: string; pagador: string; fecha_inicio: string; fecha_fin: string } | null>(null);

  const { data: batches, isLoading } = useQuery({
    queryKey: ["rips-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rips_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as RIPSBatch[];
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

  const submitAdresMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const { data, error } = await supabase.functions.invoke("submit-rips-adres", {
        body: { batchId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rips-batches"] });
      toast.success(`RIPS enviado a ADRES — CUV: ${data?.cuv ?? "pendiente"}`);
    },
    onError: (error: any) => {
      toast.error(`Error al enviar a ADRES: ${error.message}`);
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

  const getModalidadBadge = (batch: RIPSBatch) => {
    const isEPS = batch.nit_pagador || batch.pagador?.toLowerCase().includes("eps") || 
                  batch.pagador?.toLowerCase().includes("nueva") || 
                  batch.pagador?.toLowerCase().includes("sura") ||
                  batch.pagador?.toLowerCase().includes("salud");
    
    if (isEPS) {
      return (
        <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/30">
          <Building2 className="h-3 w-3" />
          EPS
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/30">
        <Wallet className="h-3 w-3" />
        Particular
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

  const handleDownloadFiltered = (modalidad: "eps" | "particular" | "all") => {
    const batchesToDownload = batches?.filter(batch => {
      if (batch.estado !== "GENERADO" && batch.estado !== "VALIDADO") return false;
      if (modalidad === "all") return true;
      
      const isEPS = batch.nit_pagador || batch.pagador?.toLowerCase().includes("eps") || 
                    batch.pagador?.toLowerCase().includes("nueva") || 
                    batch.pagador?.toLowerCase().includes("sura") ||
                    batch.pagador?.toLowerCase().includes("salud");
      if (modalidad === "eps") return isEPS;
      if (modalidad === "particular") return !isEPS;
      return true;
    });

    if (!batchesToDownload || batchesToDownload.length === 0) {
      toast.error("No hay RIPS generados para descargar con ese filtro");
      return;
    }

    // Descargar cada archivo
    batchesToDownload.forEach(batch => {
      if (batch.archivo_rips_url) {
        window.open(batch.archivo_rips_url, "_blank");
      }
    });
    
    toast.success(`Descargando ${batchesToDownload.length} archivo(s) RIPS`);
  };

  // Stats por modalidad
  const epsCount = batches?.filter(b => {
    const isEPS = b.nit_pagador || b.pagador?.toLowerCase().includes("eps");
    return isEPS;
  }).length || 0;
  
  const particularCount = (batches?.length || 0) - epsCount;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
            <h1 className="text-2xl font-bold bg-gradient-feature-soft bg-clip-text text-transparent">RIPS - Resolución 2275/2023</h1>
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
                  (Mecanismo Único de Validación). <strong>Los servicios Particulares no generan RIPS obligatorios.</strong>
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-muted-foreground">
                    Genera y valida tus archivos RIPS en formato JSON
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => setIsAIOpen(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Asistente IA
                  </Button>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Lote RIPS
                  </Button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Lotes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{batches?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card className="border-blue-500/30 bg-blue-500/5">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      EPS/Aseguradoras
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{epsCount}</div>
                  </CardContent>
                </Card>
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      Particulares
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{particularCount}</div>
                    <p className="text-xs text-muted-foreground">No requieren RIPS</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Validados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {batches?.filter((b) => b.estado === "VALIDADO").length || 0}
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

              {/* Filtros y Descarga */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtrar y Descargar RIPS
                  </CardTitle>
                  <CardDescription>
                    Filtra los lotes por modalidad y descarga solo los que necesites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Filtrar por:</span>
                      <Select value={modalidadFilter} onValueChange={setModalidadFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Todas las modalidades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="eps">Solo EPS/Aseguradoras</SelectItem>
                          <SelectItem value="particular">Solo Particulares</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 ml-auto">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadFiltered("eps")}
                        className="border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar EPS
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadFiltered("particular")}
                        className="border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Particulares
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleDownloadFiltered("all")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Todos
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs por Modalidad */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="eps" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    EPS
                  </TabsTrigger>
                  <TabsTrigger value="particular" className="gap-2">
                    <Wallet className="h-4 w-4" />
                    Particular
                  </TabsTrigger>
                </TabsList>

                {["all", "eps", "particular"].map((tab) => (
                  <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
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
                    ) : (
                      (() => {
                        const tabFilteredBatches = batches?.filter(batch => {
                          if (tab === "all") return true;
                          const isEPS = batch.nit_pagador || batch.pagador?.toLowerCase().includes("eps") || 
                                        batch.pagador?.toLowerCase().includes("nueva") || 
                                        batch.pagador?.toLowerCase().includes("sura") ||
                                        batch.pagador?.toLowerCase().includes("salud");
                          if (tab === "eps") return isEPS;
                          if (tab === "particular") return !isEPS;
                          return true;
                        });

                        if (!tabFilteredBatches || tabFilteredBatches.length === 0) {
                          return (
                            <Card>
                              <CardContent className="flex flex-col items-center justify-center py-12">
                                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground mb-4">
                                  {tab === "eps" && "No tienes lotes RIPS de EPS/Aseguradoras"}
                                  {tab === "particular" && "No tienes lotes de servicios particulares"}
                                  {tab === "all" && "No tienes lotes RIPS generados"}
                                </p>
                                {tab !== "particular" && (
                                  <Button onClick={() => setIsDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Crear Lote RIPS
                                  </Button>
                                )}
                                {tab === "particular" && (
                                  <p className="text-sm text-muted-foreground text-center max-w-md">
                                    Los servicios particulares no requieren generación obligatoria de RIPS según la normativa colombiana.
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          );
                        }

                        return tabFilteredBatches.map((batch) => (
                          <Card key={batch.id} className="hover:bg-accent/50 transition-colors">
                            <CardHeader>
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                  <CardTitle className="flex items-center gap-2 flex-wrap">
                                    Lote RIPS - {batch.pagador}
                                    {getStatusBadge(batch.estado)}
                                    {getModalidadBadge(batch)}
                                  </CardTitle>
                                  <CardDescription>
                                    Período: {formatDate(batch.fecha_inicio)} - {formatDate(batch.fecha_fin)}
                                  </CardDescription>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDetailBatch({ id: batch.id, pagador: batch.pagador, fecha_inicio: batch.fecha_inicio, fecha_fin: batch.fecha_fin })}
                                  >
                                    <List className="h-4 w-4 mr-2" />
                                    Ver registros
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedBatchId(batch.id);
                                      setIsAIOpen(true);
                                    }}
                                  >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    IA
                                  </Button>
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
                                  {batch.estado === "VALIDADO" && !batch.cuv && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        if (confirm("¿Enviar RIPS a ADRES/SISPRO?")) {
                                          submitAdresMutation.mutate(batch.id);
                                        }
                                      }}
                                      disabled={submitAdresMutation.isPending}
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Enviar a ADRES
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

                              {/* CUV y plazo ADRES */}
                              {batch.cuv ? (
                                <div className="mt-3 flex items-center gap-2 text-sm bg-green-500/10 border border-green-500/30 rounded-md px-3 py-2">
                                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                  <span className="text-green-700 font-medium">CUV ADRES:</span>
                                  <span className="font-mono text-green-800">{batch.cuv}</span>
                                  {batch.fecha_cuv && (
                                    <span className="text-green-600 ml-auto text-xs">{formatDate(batch.fecha_cuv)}</span>
                                  )}
                                </div>
                              ) : batch.estado === "VALIDADO" ? (
                                <div className="mt-3 flex items-center gap-2 text-sm bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2">
                                  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                                  <span className="text-amber-700">
                                    Pendiente envío a ADRES —{" "}
                                    <strong>
                                      plazo: 22 días hábiles desde{" "}
                                      {formatDate(batch.fecha_fin)}
                                    </strong>
                                  </span>
                                </div>
                              ) : null}

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
                        ));
                      })()
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      <RIPSBatchDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <AIRIPSAssistant
        open={isAIOpen}
        onOpenChange={setIsAIOpen}
        batchId={selectedBatchId || undefined}
        onSuggestionsApplied={() => queryClient.invalidateQueries({ queryKey: ["rips-batches"] })}
      />

      {detailBatch && (
        <RIPSBatchDetail
          open={!!detailBatch}
          onOpenChange={(open) => { if (!open) setDetailBatch(null); }}
          batchId={detailBatch.id}
          batchInfo={{ pagador: detailBatch.pagador, fecha_inicio: detailBatch.fecha_inicio, fecha_fin: detailBatch.fecha_fin }}
        />
      )}
    </SidebarProvider>
  );
}