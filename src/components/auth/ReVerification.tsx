import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, LogOut } from "lucide-react";

const passwordSchema = z
  .string()
  .min(1, "Ingresa tu contraseña")
  .max(128, "Contraseña demasiado larga");

interface ReVerificationProps {
  isOpen: boolean;
  onVerified: () => void;
}

const ReVerification = ({ isOpen, onVerified }: ReVerificationProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [exitLoading, setExitLoading] = useState<"reset" | "signout" | null>(null);

  const handleRequestClose = () => {
    setExitDialogOpen(true);
  };

  const handleSignOut = async () => {
    setExitLoading("signout");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "No se pudo cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExitLoading(null);
      setExitDialogOpen(false);
    }
  };

  const handleSendResetAndSignOut = async () => {
    setExitLoading("reset");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) throw new Error("No se pudo obtener tu email");

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Email de recuperación enviado",
        description: "Revisa tu correo para restablecer tu contraseña.",
      });

      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error al enviar recuperación",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExitLoading(null);
      setExitDialogOpen(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast({
        title: "Contraseña inválida",
        description: parsed.error.issues[0]?.message ?? "Revisa la contraseña",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No user found");

      // Re-authenticate with password
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: parsed.data,
      });

      if (error) throw error;

      // Generate device fingerprint
      const deviceFingerprint = await generateDeviceFingerprint();

      // Update verification timestamp
      const { error: upsertError } = await supabase
        .from("device_verifications")
        .upsert(
          {
            user_id: user.id,
            device_fingerprint: deviceFingerprint,
            last_verified_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,device_fingerprint",
          },
        );

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
        description:
          error.message === "Invalid login credentials" ? "Contraseña incorrecta" : error.message,
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
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleRequestClose();
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
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

            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                className="px-0"
                onClick={() => setExitDialogOpen(true)}
                disabled={loading}
              >
                Olvidé mi contraseña
              </Button>
              <Button type="submit" className="min-w-40" disabled={loading}>
                {loading ? "Verificando..." : "Verificar Identidad"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No puedes cerrar sin verificar</AlertDialogTitle>
            <AlertDialogDesc>
              Si no recuerdas tu contraseña, puedes enviar un email de recuperación y volver a iniciar sesión.
            </AlertDialogDesc>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!exitLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              className="gap-2"
              disabled={!!exitLoading}
            >
              <LogOut className="h-4 w-4" />
              {exitLoading === "signout" ? "Saliendo..." : "Salir"}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleSendResetAndSignOut}
              className="gap-2"
              disabled={!!exitLoading}
            >
              {exitLoading === "reset" ? "Enviando..." : "Recuperar y salir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReVerification;