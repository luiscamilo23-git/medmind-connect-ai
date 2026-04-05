import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, UserCheck } from "lucide-react";

interface InviteSecretaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteSecretaryDialog({ open, onOpenChange, onSuccess }: InviteSecretaryDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInvite = async () => {
    if (!email.includes("@")) {
      toast({ title: "Email inválido", description: "Por favor ingresa un email válido.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-secretary", {
        body: { email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Secretaria invitada", description: data.message });
      setEmail("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo enviar la invitación.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Invitar Secretaria / Auxiliar
          </DialogTitle>
          <DialogDescription>
            Ingresa el email de tu secretaria. Recibirá un enlace para crear su cuenta y acceder a tu agenda y pacientes.
            No tendrá acceso a facturación ni DIAN.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="secretary-email">Email de la secretaria</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="secretary-email"
                type="email"
                placeholder="secretaria@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">¿Qué puede hacer la secretaria?</p>
            <p>✅ Ver y gestionar tu agenda de citas</p>
            <p>✅ Ver y registrar pacientes</p>
            <p>❌ No puede ver facturas ni DIAN</p>
            <p>❌ No puede ver historias clínicas</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleInvite} disabled={loading || !email}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar invitación
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
