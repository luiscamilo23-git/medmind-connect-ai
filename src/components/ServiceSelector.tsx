import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, AlertTriangle, FileText, Building2, Stethoscope, Loader2 } from "lucide-react";

export interface SelectedService {
  id: string;
  nombre_servicio: string;
  tipo_servicio: string;
  modalidad: string;
  codigo_cups: string | null;
  precio_unitario: number;
}

interface ServiceSelectorProps {
  selectedService: SelectedService | null;
  onServiceSelect: (service: SelectedService | null) => void;
  disabled?: boolean;
}

export function ServiceSelector({ selectedService, onServiceSelect, disabled }: ServiceSelectorProps) {
  const navigate = useNavigate();
  const [services, setServices] = useState<SelectedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("services")
        .select("id, nombre_servicio, tipo_servicio, modalidad, codigo_cups, precio_unitario")
        .eq("doctor_id", user.id)
        .eq("activo", true)
        .order("nombre_servicio");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId) || null;
    onServiceSelect(service);
  };

  // No services registered - show educational message
  if (!isLoading && services.length === 0) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg text-amber-700 dark:text-amber-300">
              Configura tus Servicios Médicos
            </CardTitle>
          </div>
          <CardDescription className="text-amber-600 dark:text-amber-400">
            Antes de crear historias clínicas, debes registrar tus servicios.
            Esto permite generar RIPS correctamente y mantener cumplimiento normativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
              <p className="font-medium">¿Por qué es importante?</p>
              <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                <li>La historia clínica respalda el acto médico</li>
                <li>El servicio respalda el acto administrativo</li>
                <li>MEDMIND conecta ambos de forma segura</li>
              </ul>
            </div>
            <Button 
              onClick={() => navigate("/billing/services")}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Registrar Servicios Médicos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Stethoscope className="h-4 w-4" />
          Servicio Médico <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedService?.id || ""}
          onValueChange={handleServiceChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoading ? "Cargando servicios..." : "Selecciona un servicio"} />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                <div className="flex items-center gap-2">
                  <span>{service.nombre_servicio}</span>
                  <Badge variant={service.modalidad === "eps_aseguradora" ? "default" : "secondary"} className="text-xs">
                    {service.modalidad === "eps_aseguradora" ? "EPS" : "Particular"}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service info display */}
      {selectedService && (
        <Alert className={selectedService.modalidad === "eps_aseguradora" 
          ? "border-primary/30 bg-primary/5" 
          : "border-secondary/50 bg-secondary/10"
        }>
          <div className="flex items-start gap-3">
            {selectedService.modalidad === "eps_aseguradora" ? (
              <Building2 className="h-4 w-4 text-primary mt-0.5" />
            ) : (
              <FileText className="h-4 w-4 text-secondary-foreground mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <AlertTitle className="text-sm">
                {selectedService.nombre_servicio}
              </AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {selectedService.tipo_servicio}
                  </Badge>
                  {selectedService.codigo_cups && (
                    <Badge variant="outline" className="text-xs font-mono">
                      CUPS: {selectedService.codigo_cups}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    ${selectedService.precio_unitario.toLocaleString('es-CO')}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {selectedService.modalidad === "eps_aseguradora" 
                    ? "📋 Se generarán RIPS automáticamente al guardar"
                    : "ℹ️ Este servicio no requiere RIPS"
                  }
                </p>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Add new service link */}
      <div className="flex justify-end">
        <Button 
          variant="link" 
          size="sm" 
          className="text-xs h-auto p-0"
          onClick={() => navigate("/billing/services")}
        >
          <Plus className="h-3 w-3 mr-1" />
          Agregar nuevo servicio
        </Button>
      </div>
    </div>
  );
}

export default ServiceSelector;
