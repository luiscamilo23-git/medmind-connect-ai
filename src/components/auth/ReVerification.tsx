import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff } from "lucide-react";

interface ReVerificationProps {
  isOpen: boolean;
  onVerified: () => void;
}

const ReVerification = ({ isOpen, onVerified }: ReVerificationProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No user found");

      // Re-authenticate with password
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) throw error;

      // Generate device fingerprint
      const deviceFingerprint = await generateDeviceFingerprint();

      // Update verification timestamp
      const { error: upsertError } = await supabase
        .from("device_verifications")
        .upsert({
          user_id: user.id,
          device_fingerprint: deviceFingerprint,
          last_verified_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,device_fingerprint"
        });

      if (upsertError) throw upsertError;

      toast({
        title: "Verificación exitosa",
        description: "Tu identidad ha sido confirmada.",
      });

      setPassword("");
      onVerified();
    } catch (error: any) {
      toast({
        title: "Error de verificación",
        description: error.message === "Invalid login credentials" 
          ? "Contraseña incorrecta" 
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDeviceFingerprint = async (): Promise<string> => {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset().toString(),
      screen.colorDepth.toString(),
      screen.width + "x" + screen.height,
    ].join("|");

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center text-xl">Verificación de Seguridad</DialogTitle>
          <DialogDescription className="text-center">
            Por tu seguridad, necesitamos verificar tu identidad. Esta verificación se realiza periódicamente para proteger tu cuenta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleVerify} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="reverify-password">Confirma tu contraseña</Label>
            <div className="relative">
              <Input
                id="reverify-password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-info/10 border border-info/20 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Esta verificación se solicita cada 30 días o cuando accedes desde un nuevo dispositivo para mantener tu cuenta segura.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verificando..." : "Verificar Identidad"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReVerification;