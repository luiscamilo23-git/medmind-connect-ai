import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const QuickPatientForm = () => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (!phone.trim()) {
      toast.error("El teléfono es requerido");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from("patients")
        .insert([{
          doctor_id: user.id,
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
        }]);

      if (error) throw error;

      toast.success(`Paciente ${fullName} creado exitosamente`);
      
      // Reset form
      setFullName("");
      setPhone("");
      setEmail("");
    } catch (error: any) {
      console.error("Error creating patient:", error);
      toast.error(error.message || "Error al crear paciente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Agregar Paciente Rápido
        </CardTitle>
        <CardDescription>
          Crea un nuevo paciente de forma manual sin necesidad de grabación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-name">Nombre Completo *</Label>
              <Input
                id="quick-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: María González"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-phone">Teléfono *</Label>
              <Input
                id="quick-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 3001234567"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-email">Email (Opcional)</Label>
              <Input
                id="quick-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                disabled={loading}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !fullName.trim() || !phone.trim()}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Crear Paciente
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuickPatientForm;
