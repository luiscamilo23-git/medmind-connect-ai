import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Bot, Save, Plus, Trash2, MapPin, Clock, FileText, DollarSign } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ConnectWhatsApp } from "@/components/ConnectWhatsApp";

interface Service {
  name: string;
  price: string;
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
          setServices(data.business_services as unknown as Service[]);
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
        title: "Guardado",
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
    setServices([...services, { name: "", price: "", description: "" }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof Service, value: string) => {
    const updated = [...services];
    
    // For price field, only allow numbers and store raw numeric value
    if (field === 'price') {
      const numericValue = value.replace(/\D/g, '');
      updated[index] = { ...updated[index], [field]: numericValue };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setServices(updated);
  };

  // Format price for display with $ and thousands separator
  const formatPrice = (value: string): string => {
    if (!value) return '';
    const num = parseInt(value, 10);
    if (isNaN(num)) return '';
    return `$ ${num.toLocaleString('es-CO')}`;
  };

  // Parse formatted price back to raw number for editing
  const parsePrice = (formatted: string): string => {
    return formatted.replace(/\D/g, '');
  };

  // Listen for WhatsApp connection changes
  const handleConnectionChange = () => {
    loadProfileData();
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
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">Mi Agente IA</h1>
              </div>
            </div>
          </header>

          <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Step 1: Connect WhatsApp */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                  Conectar WhatsApp
                </CardTitle>
                <CardDescription>
                  Primero vincula tu WhatsApp para activar el agente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectWhatsApp />
              </CardContent>
            </Card>

            {/* Step 2: Knowledge Base (only shown when connected) */}
            {isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                    Base de Conocimiento
                  </CardTitle>
                  <CardDescription>
                    Configura la información que tu agente usará para responder
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Business Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Descripción del Negocio
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe tu consultorio o clínica. Por ejemplo: Somos una clínica de medicina general especializada en atención familiar..."
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Ubicación
                    </Label>
                    <Input
                      id="location"
                      placeholder="Dirección completa de tu consultorio"
                      value={businessLocation}
                      onChange={(e) => setBusinessLocation(e.target.value)}
                    />
                  </div>

                  {/* Business Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="hours" className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Horario de Atención
                    </Label>
                    <Input
                      id="hours"
                      placeholder="Ej: Lunes a Viernes 8:00 AM - 6:00 PM, Sábados 9:00 AM - 1:00 PM"
                      value={businessHours}
                      onChange={(e) => setBusinessHours(e.target.value)}
                    />
                  </div>

                  {/* Services */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        Servicios y Precios
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addService}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar
                      </Button>
                    </div>
                    
                    {services.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                        No hay servicios configurados. Haz clic en "Agregar" para añadir uno.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {services.map((service, index) => (
                          <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/30">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <Input
                                placeholder="Nombre del servicio"
                                value={service.name}
                                onChange={(e) => updateService(index, "name", e.target.value)}
                              />
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                <Input
                                  placeholder="0"
                                  value={service.price ? parseInt(service.price, 10).toLocaleString('es-CO') : ''}
                                  onChange={(e) => updateService(index, "price", e.target.value)}
                                  className="pl-7 text-right font-mono"
                                />
                              </div>
                              <Input
                                placeholder="Descripción breve (opcional)"
                                value={service.description || ""}
                                onChange={(e) => updateService(index, "description", e.target.value)}
                                className="col-span-2"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeService(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-2">
                    <Label htmlFor="additional" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Información Adicional
                    </Label>
                    <Textarea
                      id="additional"
                      placeholder="Cualquier otra información relevante que el agente deba conocer (especialidades, certificaciones, métodos de pago aceptados, etc.)"
                      value={businessAdditionalInfo}
                      onChange={(e) => setBusinessAdditionalInfo(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Guardar Base de Conocimiento
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}