import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bot, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DoctorSettingsData {
  specialty: string;
  services_list: string;
  ai_behavior: string;
}

const DoctorSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DoctorSettingsData>({
    specialty: "",
    services_list: "",
    ai_behavior: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("specialty, services_list, ai_behavior")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          specialty: data.specialty || "",
          services_list: data.services_list || "",
          ai_behavior: data.ai_behavior || "",
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("profiles")
        .update({
          specialty: settings.specialty,
          services_list: settings.services_list,
          ai_behavior: settings.ai_behavior,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Configuración guardada exitosamente");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple/10 shadow-purple">
                <Bot className="h-6 w-6 text-purple" />
              </div>
              <div>
                <CardTitle className="bg-gradient-purple-blue bg-clip-text text-transparent">Configuración de IA del Doctor</CardTitle>
                <CardDescription>
                  Personaliza cómo la IA interactúa con tus pacientes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                placeholder="Ej: Medicina General, Cardiología, Pediatría..."
                value={settings.specialty}
                onChange={(e) => setSettings({ ...settings, specialty: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="services_list">Lista de Servicios y Precios</Label>
              <Textarea
                id="services_list"
                placeholder="Ej:&#10;- Consulta General: $50,000&#10;- Electrocardiograma: $80,000&#10;- Control de seguimiento: $40,000"
                className="min-h-[150px]"
                value={settings.services_list}
                onChange={(e) => setSettings({ ...settings, services_list: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Lista los servicios que ofreces con sus precios para que la IA pueda informar a los pacientes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai_behavior">Reglas de la IA</Label>
              <Textarea
                id="ai_behavior"
                placeholder="Ej:&#10;- Siempre ser amable y profesional&#10;- No dar diagnósticos, solo orientación&#10;- Recomendar agendar cita para casos urgentes&#10;- Mencionar horarios de atención: Lunes a Viernes 8am-5pm"
                className="min-h-[200px]"
                value={settings.ai_behavior}
                onChange={(e) => setSettings({ ...settings, ai_behavior: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Define reglas y comportamientos personalizados para la IA cuando interactúe con tus pacientes.
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorSettings;
