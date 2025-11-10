import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Copy, CheckCircle } from "lucide-react";
import QRCode from "qrcode";

interface MFASetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

const MFASetup = ({ onComplete, onSkip }: MFASetupProps) => {
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [factorId, setFactorId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setupMFA();
  }, []);

  const setupMFA = async () => {
    try {
      const { data: factorData, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "MEDMIND Authenticator"
      });

      if (enrollError) throw enrollError;

      if (factorData) {
        setFactorId(factorData.id);
        setSecret(factorData.totp.secret);
        
        // Generate QR code
        const otpauthUrl = factorData.totp.uri;
        const qr = await QRCode.toDataURL(otpauthUrl);
        setQrCode(qr);
      }
    } catch (error: any) {
      console.error("Error setting up MFA:", error);
      toast({
        title: "Error al configurar MFA",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      });

      if (error) throw error;

      toast({
        title: "MFA Activado",
        description: "La autenticación de dos factores ha sido activada exitosamente.",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error al verificar código",
        description: "El código ingresado no es válido. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({
      title: "Copiado",
      description: "La clave secreta ha sido copiada al portapapeles.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow mx-auto">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Configurar Autenticación de Dos Factores</CardTitle>
          <CardDescription>
            Protege tu cuenta con un código de verificación adicional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {qrCode && (
            <>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Paso 1: Escanea el código QR</Label>
                <p className="text-sm text-muted-foreground">
                  Usa una app de autenticación como Google Authenticator, Authy o Microsoft Authenticator
                </p>
                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">O ingresa esta clave manualmente:</Label>
                <div className="flex items-center gap-2">
                  <Input value={secret} readOnly className="font-mono text-sm" />
                  <Button type="button" size="icon" variant="outline" onClick={copySecret}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <form onSubmit={handleVerifyAndEnable} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verify-code" className="text-base font-semibold">
                    Paso 2: Ingresa el código de verificación
                  </Label>
                  <Input
                    id="verify-code"
                    type="text"
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Ingresa el código de 6 dígitos de tu app de autenticación
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={onSkip} className="flex-1">
                    Omitir por ahora
                  </Button>
                  <Button type="submit" disabled={loading || verifyCode.length !== 6} className="flex-1">
                    {loading ? "Verificando..." : "Activar MFA"}
                  </Button>
                </div>
              </form>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Seguridad mejorada</p>
                    <p className="text-muted-foreground">
                      Con MFA activado, necesitarás tu contraseña y un código de tu app de autenticación para iniciar sesión.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MFASetup;