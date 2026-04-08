import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { Loader2, MessageCircle, QrCode, CheckCircle, Wifi, WifiOff, Unplug, RefreshCw, Clock, RotateCcw, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function ConnectWhatsApp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | 'unknown' | 'disconnected'>('disconnected');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const { playSound } = useNotificationSound();

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
    const totalSeconds = MAX_POLL_COUNT * 3; // 120 segundos
    setRemainingSeconds(totalSeconds);
    console.log('Starting WhatsApp connection polling (max 2 min)...');
    
    // Countdown cada segundo
    countdownRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    
    pollingRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      console.log(`Polling for WhatsApp connection... (${pollCountRef.current}/${MAX_POLL_COUNT})`);
      
      const connected = await checkConnectionStatusSilent();
      if (connected) {
        stopPolling();
        setQrCode(null);
        playSound('success'); // Sonido de éxito
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
        playSound('warning'); // Sonido de alerta
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
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setRemainingSeconds(0);
  };

  const checkConnectionStatusSilent = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-whatsapp-instance');

      if (error) {
        console.error("Error checking WhatsApp status:", error);
        return false;
      }

      // Solo considerar conectado si status es 'online' o 'offline' (ya escaneado)
      // NO si status es 'connecting' (esperando escaneo)
      const isReallyConnected = data?.connected === true && 
        (data?.status === 'online' || data?.status === 'offline');
      
      console.log(`Silent check: connected=${data?.connected}, status=${data?.status}, isReallyConnected=${isReallyConnected}`);

      if (isReallyConnected) {
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

  const handleReset = async () => {
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-whatsapp-instance');

      // If the function returns a non-2xx, Supabase treats it as error.
      if (error) {
        toast({
          title: "Error",
          description: "No se pudo reiniciar la instancia",
          variant: "destructive",
        });
        return;
      }

      if (data?.success === false) {
        console.warn('Restart failed attempts:', data?.attempts);
        toast({
          title: "No se pudo reiniciar",
          description: data?.message || "Tu servidor no expone el endpoint de reinicio.",
          variant: "destructive",
        });
        return;
      }

      // If we got a new QR code, show it
      if (data?.qrCode) {
        setQrCode(data.qrCode);
        setIsConnected(false);
        toast({
          title: "Instancia reiniciada",
          description: "Escanea el nuevo código QR para reconectar",
        });
      } else {
        toast({
          title: "✅ Reiniciado",
          description: data?.message || "Instancia reiniciada correctamente",
        });
        // Re-check status after reset
        await checkConnectionStatus();
      }
    } catch (err) {
      console.error('Error resetting:', err);
      toast({
        title: "Error",
        description: "Ocurrió un error al reiniciar",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  // Reconnect: disconnect then generate new QR (keeps knowledge base intact)
  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      // Step 1: Disconnect current instance
      const { error: disconnectError } = await supabase.functions.invoke('disconnect-whatsapp-instance');

      if (disconnectError) {
        toast({
          title: "Error",
          description: "No se pudo desconectar la instancia actual",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setIsConnected(false);
      setInstanceName(null);
      setStatus('disconnected');

      // Step 2: Generate new QR
      const { data, error } = await supabase.functions.invoke('create-whatsapp-instance');

      if (error || data?.error) {
        toast({
          title: "Error",
          description: error?.message || data?.error || "No se pudo generar el nuevo QR",
          variant: "destructive",
        });
        return;
      }

      const qr = data?.qrCode || data?.qrcode;
      if (qr) {
        setQrCode(qr);
        setInstanceName(data.instanceName);
        toast({
          title: "QR Generado",
          description: "Tu base de conocimiento se mantiene. Escanea para reconectar.",
        });
      } else {
        toast({
          title: "Sin QR",
          description: "No se recibió código QR. Intenta de nuevo.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error reconnecting:', err);
      toast({
        title: "Error",
        description: "Ocurrió un error al reconectar",
        variant: "destructive",
      });
    } finally {
      setReconnecting(false);
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
      <Card className="w-full max-w-md mx-auto border-primary/30 bg-primary/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl text-primary flex items-center justify-center gap-2">
            WhatsApp Vinculado
            {status === 'online' && (
              <Badge className="bg-primary text-white text-[10px] gap-1">
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
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncSettings}
              className="flex-1 text-xs gap-2 border-primary/30 text-primary hover:bg-primary/10"
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Sincronizar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReconnect}
              className="flex-1 text-xs gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-500"
              disabled={reconnecting}
            >
              {reconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Reconectar
                </>
              )}
            </Button>
          </div>
          {lastSyncAt && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Última sincronización: {format(new Date(lastSyncAt), "d MMM yyyy, HH:mm", { locale: es })}
            </p>
          )}
          <Button
            variant="default"
            size="sm"
            className="w-full gap-2"
            onClick={() => {
              const el = document.getElementById("knowledge-base-section");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              } else {
                navigate("/my-agent");
              }
            }}
          >
            <Settings className="h-4 w-4" />
            Configurar asistente
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
            <div className="p-4 bg-white rounded-xl shadow-lg relative">
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="WhatsApp QR Code"
                className="w-64 h-64 object-contain"
              />
            </div>
            {/* Countdown indicator */}
            {remainingSeconds > 0 && (
              <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-full">
                <div className="relative h-8 w-8">
                  <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-muted/30"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${(remainingSeconds / 120) * 88} 88`}
                      className="text-primary transition-all duration-1000"
                    />
                  </svg>
                  <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-primary" />
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-primary">
                    {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-muted-foreground ml-1">restantes</span>
                </div>
              </div>
            )}
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
