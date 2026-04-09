import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Copy, RefreshCw, Clock, Users, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function DoctorRotationCode() {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateRotationCode = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newCode = generateCode();
      const expires = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 horas

      // Desactivar código anterior si existe
      await supabase
        .from("student_rotations")
        .update({ is_active: false })
        .eq("doctor_id", user.id)
        .eq("is_active", true);

      const { error } = await supabase.from("student_rotations").insert({
        code: newCode,
        doctor_id: user.id,
        is_active: true,
        expires_at: expires.toISOString(),
      });

      if (error) throw error;
      setCode(newCode);
      setExpiresAt(expires);
    } catch (err) {
      toast({ title: "Error generando código", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Código copiado" });
  };

  const isExpired = expiresAt && expiresAt < new Date();

  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-violet-400" />
        <h3 className="font-semibold">Rotación para estudiantes</h3>
        <Badge className="ml-auto bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">MedMind Edu</Badge>
      </div>

      {!code || isExpired ? (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Genera un código para que tu estudiante de rotación observe esta consulta en tiempo real desde su dispositivo.
          </p>
          <Button
            onClick={generateRotationCode}
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <GraduationCap className="w-4 h-4 mr-2" />}
            Generar código de rotación
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">Código para el estudiante</p>
            <p className="text-4xl font-mono font-bold tracking-widest text-violet-400">{code}</p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Válido hasta {expiresAt?.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={copyCode}>
              {copied ? <CheckCircle className="w-4 h-4 mr-1 text-emerald-400" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button variant="outline" size="sm" onClick={generateRotationCode} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-1" /> Nuevo código
            </Button>
          </div>

          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <Users className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-xs text-slate-400">
              El estudiante ingresa en{" "}
              <strong className="text-white">medmindsystem.com/student/rotacion</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
