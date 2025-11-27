import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, LogOut, Bell, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ServiceDialog } from "@/components/billing/ServiceDialog";

type Service = {
  id: string;
  nombre_servicio: string;
  codigo_cups: string | null;
  precio_unitario: number;
  tipo_servicio: string;
  impuestos_aplican: boolean;
  porcentaje_impuesto: number;
  activo: boolean;
  descripcion: string | null;
};

export default function BillingServices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Service[];
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
            <h1 className="text-2xl font-bold">Servicios Médicos</h1>
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
                <Button onClick={() => {
                  setEditingService(null);
                  setIsDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Servicio
                </Button>
              </div>

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
                          <Badge variant={service.activo ? "default" : "secondary"}>
                            {service.activo ? "Activo" : "Inactivo"}
                          </Badge>
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
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-4">
                      No tienes servicios registrados
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primer Servicio
                    </Button>
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
