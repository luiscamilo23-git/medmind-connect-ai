import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  Loader2, Bot, Save, Plus, Trash2, MapPin, Clock, FileText, 
  DollarSign, MessageCircle, Sparkles, Building2, Calendar,
  Stethoscope, Timer
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ConnectWhatsApp } from "@/components/ConnectWhatsApp";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Service {
  name: string;
  price: string;
  duration: string; // Duration in minutes
  description?: string;
}

export default function MyAgentAI() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Knowledge base state
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [businessAdditionalInfo, setBusinessAdditionalInfo] = useState("");
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("whatsapp_instance_name, business_description, business_location, business_hours, business_additional_info, business_services")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading profile:", error);
        return;
      }

      if (data) {
        setIsConnected(!!data.whatsapp_instance_name);
        setBusinessDescription(data.business_description || "");
        setBusinessLocation(data.business_location || "");
        setBusinessHours(data.business_hours || "");
        setBusinessAdditionalInfo(data.business_additional_info || "");
        
        // Parse services from JSON
        if (data.business_services && Array.isArray(data.business_services)) {
          const parsedServices = (data.business_services as unknown as Service[]).map(s => ({
            ...s,
            duration: s.duration || "30" // Default 30 minutes if not set
          }));
          setServices(parsedServices);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          business_description: businessDescription,
          business_location: businessLocation,
          business_hours: businessHours,
          business_additional_info: businessAdditionalInfo,
          business_services: JSON.parse(JSON.stringify(services)),
        })
        .eq("id", user.id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo guardar la información",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✅ Guardado",
        description: "Tu base de conocimiento ha sido actualizada",
      });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    setServices([...services, { name: "", price: "", duration: "30", description: "" }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof Service, value: string) => {
    const updated = [...services];
    
    // For price field, only allow numbers
    if (field === 'price') {
      const numericValue = value.replace(/\D/g, '');
      updated[index] = { ...updated[index], [field]: numericValue };
    } else if (field === 'duration') {
      // For duration, only allow numbers
      const numericValue = value.replace(/\D/g, '');
      updated[index] = { ...updated[index], [field]: numericValue };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setServices(updated);
  };

  // Format duration for display
  const formatDuration = (minutes: string): string => {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins === 0) return '';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (remainingMins === 0) return `${hours}h`;
    return `${hours}h ${remainingMins}min`;
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="flex h-14 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-feature flex items-center justify-center shadow-md shadow-primary/30">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Mi Agente IA</h1>
                  <p className="text-xs text-muted-foreground">Configura tu asistente de WhatsApp</p>
                </div>
              </div>
              <Badge variant="secondary" className="ml-auto gap-1.5">
                <Sparkles className="h-3 w-3" />
                Potenciado por IA
              </Badge>
            </div>
          </header>

          <div className="p-6 max-w-5xl mx-auto space-y-8">
            {/* Intro Section */}
            <div className="text-center space-y-2 py-4">
              <h2 className="text-2xl font-bold tracking-tight">Configura tu Asistente Inteligente</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Tu agente de IA responderá automáticamente a tus pacientes por WhatsApp, 
                agendará citas y proporcionará información sobre tu consultorio.
              </p>
            </div>

            {/* Step 1: Connect WhatsApp */}
            <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-lg">
                    1
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      Conectar WhatsApp
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Vincula tu número de WhatsApp para activar el asistente
                    </CardDescription>
                  </div>
                  {isConnected && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      ✓ Conectado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ConnectWhatsApp />
              </CardContent>
            </Card>

            {/* Step 2: Knowledge Base (only shown when connected) */}
            {isConnected && (
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-lg">
                      2
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Base de Conocimiento
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Esta información permitirá a tu agente responder con precisión
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Section: About Business */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        Sobre tu Consultorio
                      </h3>
                    </div>
                    <Separator />
                    
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="description" className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          Descripción del Consultorio
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Ej: Somos un consultorio de medicina general con más de 10 años de experiencia, especializado en atención familiar y preventiva..."
                          value={businessDescription}
                          onChange={(e) => setBusinessDescription(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                          Incluye tu especialidad, experiencia y lo que te diferencia.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            Ubicación
                          </Label>
                          <Input
                            id="location"
                            placeholder="Calle 100 #15-25, Consultorio 301, Bogotá"
                            value={businessLocation}
                            onChange={(e) => setBusinessLocation(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="hours" className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Horario de Atención
                          </Label>
                          <Input
                            id="hours"
                            placeholder="Lun-Vie 8AM-6PM, Sáb 9AM-1PM"
                            value={businessHours}
                            onChange={(e) => setBusinessHours(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Services */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                          Servicios y Tarifas
                        </h3>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addService}
                        className="gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar Servicio
                      </Button>
                    </div>
                    <Separator />
                    
                    {services.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/30">
                        <Stethoscope className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No hay servicios configurados
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Agrega los servicios que ofreces con sus precios y duración
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addService}
                          className="mt-4 gap-1.5"
                        >
                          <Plus className="h-4 w-4" />
                          Agregar primer servicio
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {services.map((service, index) => (
                          <div 
                            key={index} 
                            className="group relative p-4 border rounded-xl bg-card hover:shadow-md transition-shadow"
                          >
                            <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">{index + 1}</span>
                            </div>
                            
                            <div className="grid gap-3">
                              {/* Service name */}
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Nombre del servicio (ej: Consulta General)"
                                  value={service.name}
                                  onChange={(e) => updateService(index, "name", e.target.value)}
                                  className="font-medium"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeService(index)}
                                  className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Price and Duration row */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    Precio (COP)
                                  </Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                    <Input
                                      placeholder="0"
                                      value={service.price ? parseInt(service.price, 10).toLocaleString('es-CO') : ''}
                                      onChange={(e) => updateService(index, "price", e.target.value)}
                                      className="pl-7 text-right font-mono"
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Timer className="h-3 w-3" />
                                    Duración
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      placeholder="30"
                                      value={service.duration || ''}
                                      onChange={(e) => updateService(index, "duration", e.target.value)}
                                      className="pr-12 text-right font-mono"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                      min
                                    </span>
                                  </div>
                                  {service.duration && parseInt(service.duration) >= 60 && (
                                    <p className="text-xs text-muted-foreground text-right">
                                      = {formatDuration(service.duration)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Description */}
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Descripción breve (opcional)
                                </Label>
                                <Input
                                  placeholder="Ej: Evaluación completa del estado de salud, incluye examen físico"
                                  value={service.description || ""}
                                  onChange={(e) => updateService(index, "description", e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section: Additional Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        Información Adicional
                      </h3>
                    </div>
                    <Separator />
                    
                    <div className="space-y-2">
                      <Textarea
                        id="additional"
                        placeholder="Incluye cualquier otra información importante: métodos de pago aceptados, indicaciones de llegada, requisitos para primera cita, certificaciones especiales, etc."
                        value={businessAdditionalInfo}
                        onChange={(e) => setBusinessAdditionalInfo(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      size="lg"
                      className="w-full gap-2 shadow-lg"
                    >
                      {saving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Save className="h-5 w-5" />
                      )}
                      Guardar Base de Conocimiento
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Los cambios se aplicarán inmediatamente a tu agente de WhatsApp
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
