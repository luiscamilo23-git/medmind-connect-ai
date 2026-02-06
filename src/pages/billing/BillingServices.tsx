import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, LogOut, Bell, User, Bot, ArrowRight, Sparkles, Loader2, AlertTriangle, Building2, Wallet, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ServiceDialog } from "@/components/billing/ServiceDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Service = {
  id: string;
  nombre_servicio: string;
  codigo_cups: string | null;
  precio_unitario: number;
  tipo_servicio: string;
  modalidad: string;
  impuestos_aplican: boolean;
  porcentaje_impuesto: number;
  activo: boolean;
  descripcion: string | null;
};

interface KnowledgeBaseService {
  name: string;
  price: string;
  duration?: string;
  description?: string;
}

export default function BillingServices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, nombre_servicio, codigo_cups, precio_unitario, tipo_servicio, modalidad, impuestos_aplican, porcentaje_impuesto, activo, descripcion")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Service[];
    },
  });

  // Fetch knowledge base services from profile
  const { data: knowledgeBaseServices } = useQuery({
    queryKey: ["knowledge-base-services"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("business_services")
        .eq("id", user.id)
        .single();

      if (error) return null;
      if (!data?.business_services || !Array.isArray(data.business_services)) return null;
      return data.business_services as unknown as KnowledgeBaseService[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Servicio eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar servicio");
    },
  });

  const importFromKnowledgeBase = async () => {
    if (!knowledgeBaseServices || knowledgeBaseServices.length === 0) {
      toast.error("No hay servicios en la Base de Conocimiento");
      return;
    }

    setIsImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Convert knowledge base services to billing services
      const servicesToInsert = knowledgeBaseServices
        .filter(s => s.name && s.price)
        .map(service => ({
          doctor_id: user.id,
          nombre_servicio: service.name,
          precio_unitario: parseInt(service.price, 10) || 0,
          tipo_servicio: "CONSULTA" as const, // Default type
          impuestos_aplican: false,
          porcentaje_impuesto: 0,
          activo: true,
          descripcion: service.description || null,
        }));

      if (servicesToInsert.length === 0) {
        toast.error("No hay servicios válidos para importar");
        return;
      }

      const { error } = await supabase
        .from("services")
        .insert(servicesToInsert);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(`${servicesToInsert.length} servicio(s) importado(s) exitosamente`);
    } catch (error) {
      console.error("Error importing services:", error);
      toast.error("Error al importar servicios");
    } finally {
      setIsImporting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este servicio?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  const hasKnowledgeBaseServices = knowledgeBaseServices && knowledgeBaseServices.length > 0;
  const hasNoServices = !services || services.length === 0;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
            <h1 className="text-2xl font-bold bg-gradient-feature-soft bg-clip-text text-transparent">Servicios Médicos</h1>
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
                    Gestiona tus servicios médicos y tarifas
                  </p>
                </div>
                <div className="flex gap-2">
                  {hasKnowledgeBaseServices && (
                    <Button 
                      variant="outline" 
                      onClick={importFromKnowledgeBase}
                      disabled={isImporting}
                      className="gap-2"
                    >
                      {isImporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                      Importar desde Mi Agente IA
                    </Button>
                  )}
                  <Button onClick={() => {
                    setEditingService(null);
                    setIsDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Servicio
                  </Button>
                </div>
              </div>

              {/* Educational Alert - Modalidad y RIPS */}
              <Alert className="border-amber-500/30 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-700">Importante: Modalidad y Generación de RIPS</AlertTitle>
                <AlertDescription className="text-amber-600/90 mt-2 space-y-3">
                  <p>
                    <strong>No mezcles servicios Particulares con EPS/Aseguradora.</strong> Cada servicio debe tener una única modalidad de pago.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <Wallet className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-700">Particular</p>
                        <p className="text-sm text-green-600">
                          No genera RIPS. El código CUPS es opcional. Ideal para consultas privadas sin intermediarios.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-700">EPS / Aseguradora</p>
                        <p className="text-sm text-blue-600">
                          <strong>Genera RIPS automáticamente</strong> según Resolución 2275/2023. El código CUPS es obligatorio.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 p-2 rounded bg-background/50">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Al crear una historia clínica, seleccionarás el servicio y el sistema determinará automáticamente si genera RIPS.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>


              {hasNoServices && hasKnowledgeBaseServices && !isLoading && (
                <Alert className="border-primary/30 bg-primary/5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">¡Ahorra tiempo!</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      Tienes {knowledgeBaseServices.length} servicio(s) configurado(s) en tu Base de Conocimiento.
                      Impórtalos con un clic.
                    </span>
                    <Button 
                      size="sm" 
                      onClick={importFromKnowledgeBase}
                      disabled={isImporting}
                      className="ml-4 gap-2"
                    >
                      {isImporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Importar
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : services && services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <Card key={service.id}>
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {service.nombre_servicio}
                          </CardTitle>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant={service.activo ? "default" : "secondary"}>
                              {service.activo ? "Activo" : "Inactivo"}
                            </Badge>
                            <Badge variant={service.modalidad === "eps_aseguradora" ? "outline" : "secondary"}>
                              {service.modalidad === "eps_aseguradora" ? "EPS" : "Particular"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="font-medium">{service.tipo_servicio}</span>
                          </div>
                          {service.codigo_cups && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">CUPS:</span>
                              <span className="font-mono">{service.codigo_cups}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Precio:</span>
                            <span className="font-semibold text-lg">
                              {formatCurrency(service.precio_unitario)}
                            </span>
                          </div>
                          {service.impuestos_aplican && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">IVA:</span>
                              <span>{service.porcentaje_impuesto}%</span>
                            </div>
                          )}
                          {service.modalidad === "eps_aseguradora" && (
                            <p className="text-xs text-primary mt-2">
                              📋 Genera RIPS automáticamente
                            </p>
                          )}
                          {service.descripcion && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {service.descripcion}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4 text-center">
                      No tienes servicios registrados
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {hasKnowledgeBaseServices ? (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={importFromKnowledgeBase}
                            disabled={isImporting}
                            className="gap-2"
                          >
                            {isImporting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                            Importar desde Mi Agente IA
                          </Button>
                          <span className="text-muted-foreground self-center">o</span>
                        </>
                      ) : null}
                      <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Servicio Manual
                      </Button>
                    </div>
                    {!hasKnowledgeBaseServices && (
                      <p className="text-xs text-muted-foreground mt-4 text-center max-w-md">
                        💡 Tip: Configura tus servicios en{" "}
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-xs"
                          onClick={() => navigate("/mi-agente-ia")}
                        >
                          Mi Agente IA
                        </Button>{" "}
                        y podrás importarlos aquí automáticamente.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>

      <ServiceDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingService(null);
        }}
        service={editingService}
      />
    </SidebarProvider>
  );
}
