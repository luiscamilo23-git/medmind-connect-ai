import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DIANProviderConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: {
    id: string;
    name: string;
  };
}

export function DIANProviderConfigDialog({
  open,
  onOpenChange,
  provider,
}: DIANProviderConfigDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    apiKey: "",
    apiUrl: "",
    nit: "",
    nombreEmpresa: "",
    direccion: "",
    telefono: "",
    email: "",
    isSandbox: true,
    isActive: false,
  });

  const getWebhookUrl = (providerId: string) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oidpsdohfbfvqfyyovzy.supabase.co';
    const providerMap: Record<string, string> = {
      'ALEGRA': 'webhook-alegra',
      'SIIGO': 'webhook-siigo',
      'ALANUBE': 'webhook-alanube',
    };
    return `${baseUrl}/functions/v1/${providerMap[providerId]}`;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Desactivar otras configuraciones DIAN activas
      if (config.isActive) {
        await supabase
          .from("api_configurations")
          .update({ is_active: false })
          .eq("doctor_id", user.id)
          .eq("provider_type", "DIAN");
      }

      const configData = {
        nit: config.nit,
        nombre_empresa: config.nombreEmpresa,
        direccion: config.direccion,
        telefono: config.telefono,
        email: config.email,
      };

      const { error } = await supabase.from("api_configurations").upsert({
        doctor_id: user.id,
        provider_type: "DIAN",
        provider_name: provider.id,
        api_url: config.apiUrl,
        config_data: configData,
        is_sandbox: config.isSandbox,
        is_active: config.isActive,
      });

      if (error) throw error;

      toast({
        title: "Configuración guardada",
        description: `${provider.name} configurado correctamente`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar {provider.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL de Webhook</Label>
            <Input
              id="webhookUrl"
              value={getWebhookUrl(provider.id)}
              readOnly
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Configura esta URL en {provider.name} para recibir notificaciones
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <Input
              id="apiKey"
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder={`Tu clave de API de ${provider.name}`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <Input
              id="apiUrl"
              value={config.apiUrl}
              onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
              placeholder="https://api.ejemplo.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nit">NIT *</Label>
              <Input
                id="nit"
                value={config.nit}
                onChange={(e) => setConfig({ ...config, nit: e.target.value })}
                placeholder="123456789-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombreEmpresa">Nombre Empresa *</Label>
              <Input
                id="nombreEmpresa"
                value={config.nombreEmpresa}
                onChange={(e) => setConfig({ ...config, nombreEmpresa: e.target.value })}
                placeholder="Mi Empresa SAS"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea
              id="direccion"
              value={config.direccion}
              onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
              placeholder="Calle 123 # 45-67"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={config.telefono}
                onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                placeholder="+57 300 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                placeholder="facturacion@empresa.com"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="sandbox">Modo Sandbox (Pruebas)</Label>
              <p className="text-sm text-muted-foreground">
                Usa el entorno de pruebas sin afectar DIAN
              </p>
            </div>
            <Switch
              id="sandbox"
              checked={config.isSandbox}
              onCheckedChange={(checked) => setConfig({ ...config, isSandbox: checked })}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="active">Activar Configuración</Label>
              <p className="text-sm text-muted-foreground">
                Usar esta configuración para emisión electrónica
              </p>
            </div>
            <Switch
              id="active"
              checked={config.isActive}
              onCheckedChange={(checked) => setConfig({ ...config, isActive: checked })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
