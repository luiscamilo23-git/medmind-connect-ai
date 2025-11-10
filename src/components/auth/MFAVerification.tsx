import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft } from "lucide-react";

interface MFAVerificationProps {
  factorId: string;
  onSuccess: () => void;
  onBack: () => void;
}

const MFAVerification = ({ factorId, onSuccess, onBack }: MFAVerificationProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });

      if (verify.error) throw verify.error;

      toast({
        title: "Verificación exitosa",
        description: "Has iniciado sesión correctamente.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Código inválido",
        description: "El código ingresado no es correcto. Inténtalo de nuevo.",
        variant: "destructive",
      });
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow mx-auto">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Verificación de Dos Factores</CardTitle>
          <CardDescription>
            Ingresa el código de tu app de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="mfa-code" className="text-base font-semibold">
                Código de verificación
              </Label>
              <Input
                id="mfa-code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                required
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Abre tu app de autenticación e ingresa el código de 6 dígitos
              </p>
            </div>

            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                {loading ? "Verificando..." : "Verificar"}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">¿No tienes acceso a tu app?</span>
                <br />
                Contacta al soporte para recuperar tu cuenta.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MFAVerification;