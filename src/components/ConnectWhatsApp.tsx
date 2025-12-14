import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageCircle, QrCode, CheckCircle, Wifi, WifiOff, Unplug, RefreshCw, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function ConnectWhatsApp() {
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | 'unknown' | 'disconnected'>('disconnected');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkConnectionStatus();
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const qrTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const MAX_POLL_COUNT = 40; // 40 * 3s = 2 minutos de tiempo para escanear

  // Start polling when QR is displayed
  useEffect(() => {
    if (qrCode && !isConnected) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return () => stopPolling();
  }, [qrCode, isConnected]);

  const startPolling = () => {
    stopPolling();
    pollCountRef.current = 0;
    console.log('Starting WhatsApp connection polling (max 2 min)...');
    
    pollingRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      console.log(`Polling for WhatsApp connection... (${pollCountRef.current}/${MAX_POLL_COUNT})`);
      
      const connected = await checkConnectionStatusSilent();
      if (connected) {
        stopPolling();
        setQrCode(null);
        toast({
          title: "¡Conectado!",
          description: "Tu WhatsApp se ha vinculado exitosamente",
        });
        return;
      }
      
      // Si excedemos el tiempo máximo, regenerar QR automáticamente
      if (pollCountRef.current >= MAX_POLL_COUNT) {
        console.log('QR expired, regenerating...');
        stopPolling();
        toast({
          title: "QR Expirado",
          description: "Generando un nuevo código QR...",
        });
        handleGenerateQR();
      }
    }, 3000); // Check every 3 seconds
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      console.log('Stopping polling');
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const checkConnectionStatusSilent = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-whatsapp-instance');

      if (error) {
        console.error("Error checking WhatsApp status:", error);
        return false;
      }

      if (data?.connected && (data?.status === 'online' || data?.status === 'offline')) {
        setIsConnected(true);
        setInstanceName(data?.instanceName || null);
        setStatus(data?.status || 'unknown');
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
      return false;
    }
  };

  const checkConnectionStatus = async () => {
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-whatsapp-instance');

      if (error) {
        console.error("Error checking WhatsApp status:", error);
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
      setStatus(data?.status || 'disconnected');
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
        .select("whatsapp_instance_name, whatsapp_last_sync_at")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.whatsapp_instance_name) {
        setIsConnected(true);
        setInstanceName(data.whatsapp_instance_name);
        setStatus('unknown');
        setLastSyncAt(data.whatsapp_last_sync_at || null);
      }
    } catch (error) {
      console.error("Error checking local WhatsApp status:", error);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('disconnect-whatsapp-instance');

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo desconectar WhatsApp",
          variant: "destructive",
        });
        return;
      }

      setIsConnected(false);
      setInstanceName(null);
      setStatus('disconnected');
      setQrCode(null);

      toast({
        title: "Desconectado",
        description: "Tu WhatsApp ha sido desvinculado exitosamente",
      });
    } catch (err) {
      console.error('Error disconnecting:', err);
      toast({
        title: "Error",
        description: "Ocurrió un error al desconectar",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSyncSettings = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-instance-settings');

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo sincronizar la configuración",
          variant: "destructive",
        });
        return;
      }

      if (data?.syncedAt) {
        setLastSyncAt(data.syncedAt);
      }

      toast({
        title: "✅ Sincronizado",
        description: "Instancia actualizada correctamente",
      });
    } catch (err) {
      console.error('Error syncing:', err);
      toast({
        title: "Error",
        description: "Ocurrió un error al sincronizar",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    setQrCode(null);

    try {
      // Verificar sesión antes de llamar
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast({
          title: "Error de sesión",
          description: "Debes iniciar sesión para conectar WhatsApp",
          variant: "destructive",
        });
        return;
      }

      console.log("Llamando create-whatsapp-instance con sesión activa");
      
      const { data, error } = await supabase.functions.invoke('create-whatsapp-instance');

      console.log("Respuesta del Edge Function:", data, error);

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

      // Verificar qrCode (respuesta del Edge Function)
      const qr = data?.qrCode || data?.qrcode;
      if (qr) {
        setQrCode(qr);
        setInstanceName(data.instanceName);
        toast({
          title: "QR Generado",
          description: "Escanea el código con WhatsApp para conectar",
        });
      } else {
        console.error("No se recibió QR. Data:", data);
        toast({
          title: "Sin QR",
          description: "La instancia fue creada pero no se recibió código QR. Intenta de nuevo.",
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
          <CardTitle className="text-xl text-emerald-600 flex items-center justify-center gap-2">
            WhatsApp Vinculado
            {status === 'online' && (
              <Badge className="bg-emerald-500 text-white text-[10px] gap-1">
                <Wifi className="h-3 w-3" />
                Online
              </Badge>
            )}
            {status === 'offline' && (
              <Badge variant="secondary" className="text-amber-600 bg-amber-100 text-[10px] gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            {status === 'unknown' && (
              <Badge variant="outline" className="text-muted-foreground text-[10px]">
                Verificando...
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Tu asistente de WhatsApp está conectado
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {instanceName && (
            <p className="text-xs text-muted-foreground text-center">
              Instancia: <span className="font-mono bg-muted px-2 py-1 rounded">{instanceName}</span>
            </p>
          )}
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnectionStatus}
              className="flex-1 text-xs"
              disabled={checkingStatus}
            >
              {checkingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar estado"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              className="flex-1 text-xs gap-1"
              disabled={disconnecting}
            >
              {disconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Unplug className="h-4 w-4" />
                  Desconectar
                </>
              )}
            </Button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSyncSettings}
            className="w-full text-xs gap-1"
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                🔄 Sincronizar Configuración
              </>
            )}
          </Button>
          {lastSyncAt && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Última sincronización: {format(new Date(lastSyncAt), "d MMM yyyy, HH:mm", { locale: es })}
            </p>
          )}
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
            <div className="p-4 bg-white rounded-xl shadow-lg relative">
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="WhatsApp QR Code"
                className="w-64 h-64 object-contain"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-[10px] text-primary font-medium">Esperando escaneo...</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
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
