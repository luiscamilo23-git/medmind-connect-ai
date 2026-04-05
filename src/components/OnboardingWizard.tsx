import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  ChevronRight,
  Stethoscope,
  Building2,
  FileText,
  Zap,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface OnboardingWizardProps {
  doctorId: string;
  onComplete: () => void;
}

const SPECIALTIES = [
  { value: "MEDICO_GENERAL", label: "Médico General" },
  { value: "PEDIATRIA", label: "Pediatría" },
  { value: "GINECOLOGIA", label: "Ginecología y Obstetricia" },
  { value: "MEDICINA_INTERNA", label: "Medicina Interna" },
  { value: "PSIQUIATRIA", label: "Psiquiatría" },
  { value: "CIRUGIA", label: "Cirugía General" },
  { value: "ESTETICA", label: "Medicina Estética" },
  { value: "NUTRICION", label: "Nutrición y Dietética" },
  { value: "FISIOTERAPIA", label: "Fisioterapia" },
  { value: "MEDICINA_LABORAL", label: "Medicina Laboral" },
];

const SERVICIOS_SUGERIDOS: Record<string, { nombre: string; precio: number; cups: string }[]> = {
  MEDICO_GENERAL: [
    { nombre: "Consulta médica general", precio: 60000, cups: "890201" },
    { nombre: "Consulta de control", precio: 45000, cups: "890202" },
  ],
  PEDIATRIA: [
    { nombre: "Consulta pediátrica", precio: 80000, cups: "890301" },
    { nombre: "Control de crecimiento", precio: 60000, cups: "890302" },
  ],
  GINECOLOGIA: [
    { nombre: "Consulta ginecológica", precio: 100000, cups: "890401" },
    { nombre: "Control prenatal", precio: 90000, cups: "890402" },
  ],
  MEDICINA_INTERNA: [
    { nombre: "Consulta medicina interna", precio: 120000, cups: "890501" },
  ],
  PSIQUIATRIA: [
    { nombre: "Consulta psiquiátrica", precio: 150000, cups: "890601" },
    { nombre: "Seguimiento psiquiátrico", precio: 100000, cups: "890602" },
  ],
  CIRUGIA: [
    { nombre: "Consulta cirugía general", precio: 120000, cups: "890701" },
  ],
  ESTETICA: [
    { nombre: "Consulta medicina estética", precio: 100000, cups: "890801" },
  ],
  NUTRICION: [
    { nombre: "Consulta nutricional", precio: 80000, cups: "890901" },
    { nombre: "Control nutricional", precio: 60000, cups: "890902" },
  ],
  FISIOTERAPIA: [
    { nombre: "Sesión de fisioterapia", precio: 70000, cups: "890201" },
  ],
  MEDICINA_LABORAL: [
    { nombre: "Examen médico ocupacional", precio: 90000, cups: "891001" },
  ],
};

const steps = [
  { id: 1, label: "Bienvenida", icon: Sparkles },
  { id: 2, label: "Tu perfil", icon: Stethoscope },
  { id: 3, label: "Clínica", icon: Building2 },
  { id: 4, label: "Primer servicio", icon: FileText },
  { id: 5, label: "¡Listo!", icon: CheckCircle2 },
];

export function OnboardingWizard({ doctorId, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 2 — perfil
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");

  // Step 3 — clínica
  const [clinicName, setClinicName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [consultationFee, setConsultationFee] = useState("60000");

  // Step 4 — servicio
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceCups, setServiceCups] = useState("");
  const [skipService, setSkipService] = useState(false);

  const selectedSpecialtyLabel = SPECIALTIES.find(s => s.value === specialty)?.label || "";
  const sugeridos = SERVICIOS_SUGERIDOS[specialty] || [];

  const applySugerido = (s: { nombre: string; precio: number; cups: string }) => {
    setServiceName(s.nombre);
    setServicePrice(String(s.precio));
    setServiceCups(s.cups);
  };

  const handleStep2 = async () => {
    if (!fullName.trim() || !specialty) {
      toast({ title: "Completa los campos obligatorios", variant: "destructive" });
      return;
    }
    setLoading(true);
    await supabase.from("profiles").update({ full_name: fullName, specialty, phone }).eq("id", doctorId);
    setLoading(false);
    setStep(3);
  };

  const handleStep3 = async () => {
    if (!clinicName.trim()) {
      toast({ title: "Ingresa el nombre de tu clínica o consultorio", variant: "destructive" });
      return;
    }
    setLoading(true);
    await supabase.from("profiles").update({
      clinic_name: clinicName,
      license_number: licenseNumber,
      consultation_fee: parseFloat(consultationFee) || 60000,
    }).eq("id", doctorId);
    setLoading(false);
    setStep(4);
  };

  const handleStep4 = async () => {
    if (!skipService) {
      if (!serviceName.trim() || !servicePrice) {
        toast({ title: "Ingresa nombre y precio del servicio", variant: "destructive" });
        return;
      }
      setLoading(true);
      await supabase.from("services").insert({
        doctor_id: doctorId,
        nombre_servicio: serviceName,
        precio_unitario: parseFloat(servicePrice) || 0,
        codigo_cups: serviceCups || null,
        tipo_servicio: "particular",
        modalidad: "presencial",
        impuestos_aplican: false,
        porcentaje_impuesto: 0,
        activo: true,
      });
      setLoading(false);
    }
    setStep(5);
  };

  const handleFinish = async () => {
    setLoading(true);
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", doctorId);
    setLoading(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all
                ${done ? "bg-primary text-primary-foreground" : active ? "bg-primary/20 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"}`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-6 h-0.5 transition-all ${done ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-lg mt-16">
        {/* STEP 1 — Bienvenida */}
        {step === 1 && (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Bienvenido a MEDMIND</h1>
              <p className="text-muted-foreground text-lg">
                Tu asistente de IA para medicina colombiana. En 2 minutos estarás listo para tu primera consulta.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[
                { icon: "🎙️", label: "Historia clínica por voz" },
                { icon: "🧾", label: "Facturación DIAN automática" },
                { icon: "📋", label: "RIPS para EPS" },
              ].map(item => (
                <div key={item.label} className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
            <Button size="lg" className="w-full" onClick={() => setStep(2)}>
              Empezar configuración <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* STEP 2 — Perfil médico */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Tu perfil médico</h2>
              <p className="text-muted-foreground">Esta información aparecerá en tus historias clínicas y documentos.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo *</Label>
                <Input
                  id="fullName"
                  placeholder="Dr. Juan Pérez"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Especialidad *</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono de contacto</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 000 0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button className="flex-1" onClick={handleStep2} disabled={loading}>
                {loading ? "Guardando..." : "Continuar"} <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Clínica */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Tu clínica o consultorio</h2>
              <p className="text-muted-foreground">Necesario para la facturación electrónica DIAN.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinicName">Nombre de clínica / consultorio *</Label>
                <Input
                  id="clinicName"
                  placeholder="Consultorio Médico Dr. Pérez"
                  value={clinicName}
                  onChange={e => setClinicName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Número de registro médico (RETHUS)</Label>
                <Input
                  id="licenseNumber"
                  placeholder="ej: 123456789"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Lo encuentras en tu tarjeta profesional del Tribunal Ético Médico.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">Valor consulta particular (COP)</Label>
                <Input
                  id="fee"
                  type="number"
                  placeholder="60000"
                  value={consultationFee}
                  onChange={e => setConsultationFee(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
              <Button className="flex-1" onClick={handleStep3} disabled={loading}>
                {loading ? "Guardando..." : "Continuar"} <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — Primer servicio */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Crea tu primer servicio</h2>
              <p className="text-muted-foreground">Los servicios son la base de tus facturas. Puedes crear más después.</p>
            </div>

            {sugeridos.length > 0 && !skipService && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Sugeridos para {selectedSpecialtyLabel}:</p>
                <div className="grid gap-2">
                  {sugeridos.map(s => (
                    <button
                      key={s.cups}
                      onClick={() => applySugerido(s)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors hover:border-primary hover:bg-primary/5
                        ${serviceName === s.nombre ? "border-primary bg-primary/10" : "border-border"}`}
                    >
                      <span className="font-medium">{s.nombre}</span>
                      <span className="text-muted-foreground ml-2">${s.precio.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground ml-2">CUPS {s.cups}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!skipService && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Nombre del servicio *</Label>
                  <Input placeholder="ej: Consulta médica general" value={serviceName} onChange={e => setServiceName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Precio (COP) *</Label>
                    <Input type="number" placeholder="60000" value={servicePrice} onChange={e => setServicePrice(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Código CUPS</Label>
                    <Input placeholder="890201" value={serviceCups} onChange={e => setServiceCups(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)}>Atrás</Button>
              <Button
                variant="ghost"
                onClick={() => { setSkipService(true); setStep(5); }}
                className="text-muted-foreground"
              >
                Omitir
              </Button>
              <Button className="flex-1" onClick={handleStep4} disabled={loading}>
                {loading ? "Guardando..." : "Continuar"} <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5 — Listo */}
        {step === 5 && (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">¡Todo listo, {fullName.split(" ")[0] || "doctor"}!</h2>
              <p className="text-muted-foreground text-lg">
                Tu cuenta está configurada. Puedes empezar a crear historias clínicas ahora mismo.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p className="font-medium text-sm">¿Qué sigue?</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> Registra tu primer paciente en "Pacientes"</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> Crea tu primera historia clínica con IA</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> Genera la factura electrónica DIAN al finalizar</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => { handleFinish(); navigate("/patients"); }}>
                Registrar paciente
              </Button>
              <Button onClick={() => { handleFinish(); navigate("/voicenotes"); }}>
                Iniciar consulta <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
