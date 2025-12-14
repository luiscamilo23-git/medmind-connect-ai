import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageCircle, QrCode } from "lucide-react";

export function ConnectWhatsApp() {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);

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

      if (data?.error) {
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

        {instanceName && !qrCode && (
          <p className="text-sm text-amber-600 text-center">
            Ya tienes una instancia configurada: {instanceName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
