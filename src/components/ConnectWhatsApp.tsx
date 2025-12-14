import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageCircle, QrCode, CheckCircle } from "lucide-react";

export function ConnectWhatsApp() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      // Call edge function to verify instance exists in Evolution API
      const { data, error } = await supabase.functions.invoke('check-whatsapp-instance');

      if (error) {
        console.error("Error checking WhatsApp status:", error);
        // Fallback to local check
        await checkLocalStatus();
        return;
      }

      if (data?.wasCleared) {
        toast({
          title: "Instancia desconectada",
          description: "Tu instancia de WhatsApp fue eliminada externamente",
          variant: "destructive",
        });
      }

      setIsConnected(data?.connected || false);
      setInstanceName(data?.instanceName || null);
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
      await checkLocalStatus();
    } finally {
      setCheckingStatus(false);
    }
  };

  const checkLocalStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("whatsapp_instance_name")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.whatsapp_instance_name) {
        setIsConnected(true);
        setInstanceName(data.whatsapp_instance_name);
      }
    } catch (error) {
      console.error("Error checking local WhatsApp status:", error);
    }
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    setQrCode(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-whatsapp-instance');

      if (error) {
        console.error('Error calling create-whatsapp-instance:', error);
        toast({
          title: "Error",
          description: error.message || "No se pudo generar el código QR",
          variant: "destructive",
        });
        return;
      }

      if (data?.alreadyConnected) {
        setIsConnected(true);
        setInstanceName(data.instanceName);
        toast({
          title: "Ya conectado",
          description: "Tu WhatsApp ya está vinculado a MEDMIND",
        });
        return;
      }

      if (data?.error && !data?.alreadyConnected) {
        toast({
          title: "Aviso",
          description: data.error,
          variant: "destructive",
        });
        if (data.instanceName) {
          setInstanceName(data.instanceName);
        }
        return;
      }

      if (data?.qrCode) {
        setQrCode(data.qrCode);
        setInstanceName(data.instanceName);
        toast({
          title: "QR Generado",
          description: "Escanea el código con WhatsApp para conectar",
        });
      } else {
        toast({
          title: "Sin QR",
          description: "La instancia fue creada pero no se recibió código QR",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
          </div>
          <CardTitle className="text-xl text-emerald-600">WhatsApp Vinculado</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Tu asistente de WhatsApp está conectado y listo para usar
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {instanceName && (
            <p className="text-xs text-muted-foreground text-center">
              Instancia: <span className="font-mono bg-muted px-2 py-1 rounded">{instanceName}</span>
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={checkConnectionStatus}
            className="text-xs"
          >
            Verificar estado
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Conectar WhatsApp</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Escanea este código para conectar tu Asistente
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {qrCode ? (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-xl shadow-lg">
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="WhatsApp QR Code"
                className="w-64 h-64 object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Abre WhatsApp → Menú → Dispositivos vinculados → Vincular dispositivo
            </p>
            {instanceName && (
              <p className="text-xs text-muted-foreground">
                Instancia: <span className="font-mono">{instanceName}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-32 w-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <QrCode className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Haz clic en el botón para generar tu código QR
            </p>
          </div>
        )}

        <Button
          onClick={handleGenerateQR}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : qrCode ? (
            "Regenerar QR"
          ) : (
            "Generar QR"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
