import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Pencil,
} from "lucide-react";

interface OnboardingWizardProps {
  doctorId: string;
  initialName?: string;
  initialSpecialty?: string;
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

const TIPO_SERVICIO_OPTIONS = [
  { value: "CONSULTA", label: "Consulta" },
  { value: "PROCEDIMIENTO", label: "Procedimiento" },
  { value: "CIRUGIA", label: "Cirugía" },
  { value: "LABORATORIO", label: "Laboratorio" },
  { value: "IMAGENES", label: "Imágenes diagnósticas" },
  { value: "TERAPIA", label: "Terapia" },
  { value: "MEDICAMENTO", label: "Medicamento" },
  { value: "OTRO", label: "Otro" },
];

interface ServicioSugerido {
  nombre: string;
  precio: number;
  cups: string;
  tipo_servicio: string;
  modalidad: "particular" | "eps_aseguradora";
}

const SERVICIOS_SUGERIDOS: Record<string, ServicioSugerido[]> = {
  MEDICO_GENERAL: [
    { nombre: "Consulta médica general - Particular", precio: 60000, cups: "890201", tipo_servicio: "CONSULTA", modalidad: "particular" },
    { nombre: "Consulta médica general - EPS", precio: 0, cups: "890201", tipo_servicio: "CONSULTA", modalidad: "eps_aseguradora" },
    { nombre: "Consulta de control", precio: 45000, cups: "890202", tipo_servicio: "CONSULTA", modalidad: "particular" },
  ],
  PEDIATRIA: [
    { nombre: "Consulta pediátrica - Particular", precio: 80000, cups: "890301", tipo_servicio: "CONSULTA", modalidad: "particular" },
    { nombre: "Consulta pediátrica - EPS", precio: 0, cups: "890301", tipo_servicio: "CONSULTA", modalidad: "eps_aseguradora" },
    { nombre: "Control crecimiento y desarrollo", precio: 60000, cups: "890302", tipo_servicio: "CONSULTA", modalidad: "particular" },
  ],
  GINECOLOGIA: [
    { nombre: "Consulta ginecológica - Particular", precio: 100000, cups: "890401", tipo_servicio: "CONSULTA", modalidad: "particular" },
    { nombre: "Consulta ginecológica - EPS", precio: 0, cups: "890401", tipo_servicio: "CONSULTA", modalidad: "eps_aseguradora" },
    { nombre: "Control prenatal", precio: 90000, cups: "890402", tipo_servicio: "CONSULTA", modalidad: "particular" },
  ],
  MEDICINA_INTERNA: [
    { nombre: "Consulta medicina interna - Particular", precio: 120000, cups: "890501", tipo_servicio: "CONSULTA", modalidad: "particular" },
    { nombre: "Consulta medicina interna - EPS", precio: 0, cups: "890501", tipo_servicio: "CONSULTA", modalidad: "eps_aseguradora" },
    { nombre: "Control crónico", precio: 90000, cups: "890502", tipo_servicio: "CONSULTA", modalidad: "particular" },
  ],
  PSIQUIATRIA: [
    { nombre: "Consulta psiquiátrica - Particular", precio: 150000, cups: "890601", tipo_servicio: "CONSULTA", modalidad: "particular" },
    { nombre: "Consulta psiquiátrica - EPS", precio: 0, cups: "890601", tipo_servicio: "CONSULTA", modalidad: "eps_aseguradora" },
    { nombre: "Seguimiento psiquiátrico", precio: 100000, cups: "890602", tipo_servicio: "CONSULTA", modalidad: "particular" },
  ],
  CIRUGIA: [
    { nombre: "Consulta cirugía - Particular", precio: 120000, cups: "890701", tipo_servicio: "CONSULTA", modalidad: "particular" },
    { nombre: "Consulta cirugía - EPS", precio: 0, cups: "890701", tipo_servicio: "CONSULTA", modalidad: "eps_aseguradora" },
    { nombre: "Control post-operatorio", precio: 80000, cups: "890702", tipo_servicio: "PROCEDIMIENTO", modalidad: "particular" },
  ],
  ESTETICA: [
    { nombre: "Consulta medicina estética", precio: 100000, cups: "890801", tipo_servicio: "CONSULTA", modalidad: "particular" },
    { nombre: "Procedimiento estético menor", precio: 200000, cups: "890802", tipo_servicio: "PROCEDIMIENTO", modalidad: "particular" },
  ],
  NUTRICION: [
    { nombre: "Consulta nutricional - Particular", precio: 80000, cups: "890901", tipo_servicio: "CONSULTA", modalidad: "particular" },
    { nombre: "Consulta nutricional - EPS", precio: 0, cups: "890901", tipo_servicio: "CONSULTA", modalidad: "eps_aseguradora" },
    { nombre: "Control nutricional", precio: 60000, cups: "890902", tipo_servicio: "CONSULTA", modalidad: "particular" },
  ],
  FISIOTERAPIA: [
    { nombre: "Sesión de fisioterapia - Particular", precio: 70000, cups: "892601", tipo_servicio: "TERAPIA", modalidad: "particular" },
    { nombre: "Sesión de fisioterapia - EPS", precio: 0, cups: "892601", tipo_servicio: "TERAPIA", modalidad: "eps_aseguradora" },
    { nombre: "Evaluación fisioterapéutica", precio: 90000, cups: "892602", tipo_servicio: "CONSULTA", modalidad: "particular" },
  ],
  MEDICINA_LABORAL: [
    { nombre: "Examen médico de ingreso", precio: 90000, cups: "891001", tipo_servicio: "CONSULTA", modalidad: "particular" },
    { nombre: "Examen médico periódico", precio: 80000, cups: "891002", tipo_servicio: "CONSULTA", modalidad: "particular" },
  ],
};

const steps = [
  { id: 1, label: "Bienvenida", icon: Sparkles },
  { id: 2, label: "Tu perfil", icon: Stethoscope },
  { id: 3, label: "Clínica", icon: Building2 },
  { id: 4, label: "Primer servicio", icon: FileText },
  { id: 5, label: "¡Listo!", icon: CheckCircle2 },
];

export function OnboardingWizard({
  doctorId,
  initialName = "",
  initialSpecialty = "",
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 2 — perfil (pre-filled from Auth)
  const [fullName, setFullName] = useState(initialName);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [phone, setPhone] = useState("");

  // Step 3 — clínica
  const [clinicName, setClinicName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [consultationFee, setConsultationFee] = useState("60000");

  // Step 4 — servicio
  const [selectedSugeridoKey, setSelectedSugeridoKey] = useState<string | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceCups, setServiceCups] = useState("");
  const [tipoServicio, setTipoServicio] = useState("CONSULTA");
  const [modalidadPago, setModalidadPago] = useState<"particular" | "eps_aseguradora">("particular");

  const selectedSpecialtyLabel = SPECIALTIES.find(s => s.value === specialty)?.label || "";
  const sugeridos: ServicioSugerido[] = SERVICIOS_SUGERIDOS[specialty] ?? [];

  const applySugerido = (s: ServicioSugerido, key: string) => {
    setSelectedSugeridoKey(key);
    setServiceName(s.nombre);
    setServicePrice(s.modalidad === "eps_aseguradora" ? "" : String(s.precio));
    setServiceCups(s.cups);
    setTipoServicio(s.tipo_servicio);
    setModalidadPago(s.modalidad);
    setShowServiceForm(true);
  };

  const resetServiceForm = () => {
    setSelectedSugeridoKey(null);
    setShowServiceForm(true);
    setServiceName("");
    setServicePrice("");
    setServiceCups("");
    setTipoServicio("CONSULTA");
    setModalidadPago("particular");
  };

  const clearSpecialty = (newSpecialty: string) => {
    setSpecialty(newSpecialty);
    setSelectedSugeridoKey(null);
    setShowServiceForm(false);
    setServiceName("");
    setServicePrice("");
    setServiceCups("");
    setTipoServicio("CONSULTA");
    setModalidadPago("particular");
  };

  const handleStep2 = async () => {
    if (!fullName.trim() || !specialty) {
      toast({ title: "Completa tu nombre y especialidad", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), specialty, phone: phone.trim() || null })
      .eq("id", doctorId);
    setLoading(false);
    if (error) {
      toast({ title: "Error guardando perfil", description: error.message, variant: "destructive" });
      return;
    }
    setStep(3);
  };

  const handleStep3 = async () => {
    if (!clinicName.trim()) {
      toast({ title: "Ingresa el nombre de tu clínica o consultorio", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        clinic_name: clinicName.trim(),
        license_number: licenseNumber.trim() || null,
        consultation_fee: parseFloat(consultationFee) || 60000,
      })
      .eq("id", doctorId);
    setLoading(false);
    if (error) {
      toast({ title: "Error guardando clínica", description: error.message, variant: "destructive" });
      return;
    }
    setStep(4);
  };

  const handleStep4 = async () => {
    if (!serviceName.trim()) {
      toast({ title: "Ingresa el nombre del servicio", variant: "destructive" });
      return;
    }
    if (modalidadPago === "particular" && !servicePrice) {
      toast({ title: "Ingresa el precio del servicio", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("services").insert({
      doctor_id: doctorId,
      nombre_servicio: serviceName.trim(),
      precio_unitario: parseFloat(servicePrice) || 0,
      codigo_cups: serviceCups.trim() || null,
      tipo_servicio: tipoServicio,
      modalidad: modalidadPago,
      impuestos_aplican: false,
      porcentaje_impuesto: 0,
      activo: true,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error guardando servicio", description: error.message, variant: "destructive" });
      return;
    }
    setStep(5);
  };

  const handleFinish = async () => {
    setLoading(true);
    localStorage.setItem(`onboarding_done_${doctorId}`, "true");
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", doctorId);
    setLoading(false);
    onComplete();
  };

  const firstName = fullName.replace(/^Dr\.\s*/i, "").split(" ")[0] || "doctor";

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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
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

      <div className="w-full max-w-lg mt-16 max-h-[calc(100vh-120px)] overflow-y-auto">

        {/* ── STEP 1: Bienvenida ── */}
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
                  <div className="text-muted-foreground text-xs">{item.label}</div>
                </div>
              ))}
            </div>
            <Button size="lg" className="w-full" onClick={() => setStep(2)}>
              Empezar configuración <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── STEP 2: Perfil médico ── */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Tu perfil médico</h2>
              <p className="text-muted-foreground text-sm">Esta información aparece en historias clínicas, facturas y documentos.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Nombre completo *</Label>
                <Input
                  id="fullName"
                  placeholder="Dr. Juan Pérez"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Especialidad *</Label>
                <Select value={specialty} onValueChange={clearSpecialty}>
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
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono de contacto</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 000 0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button className="flex-1" onClick={handleStep2} disabled={loading}>
                {loading ? "Guardando..." : <>Continuar <ChevronRight className="ml-1 w-4 h-4" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Clínica ── */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Tu clínica o consultorio</h2>
              <p className="text-muted-foreground text-sm">Necesario para la facturación electrónica DIAN.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="clinicName">Nombre de clínica / consultorio *</Label>
                <Input
                  id="clinicName"
                  placeholder="Consultorio Médico Dr. Pérez"
                  value={clinicName}
                  onChange={e => setClinicName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="licenseNumber">Número de registro médico (RETHUS)</Label>
                <Input
                  id="licenseNumber"
                  placeholder="ej: 123456789"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Aparece en tu tarjeta profesional del Tribunal Ético Médico.</p>
              </div>
              <div className="space-y-1.5">
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
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
              <Button className="flex-1" onClick={handleStep3} disabled={loading}>
                {loading ? "Guardando..." : <>Continuar <ChevronRight className="ml-1 w-4 h-4" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Primer servicio ── */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Crea tu primer servicio</h2>
              <p className="text-muted-foreground text-sm">
                Los servicios vinculan la historia clínica con la factura. Si es EPS, MEDMIND genera los RIPS automáticamente.
              </p>
            </div>

            {/* Sugeridos */}
            {sugeridos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Sugeridos para <span className="text-foreground font-semibold">{selectedSpecialtyLabel}</span>:
                </p>
                <div className="grid gap-2">
                  {sugeridos.map((s, i) => {
                    const key = `${s.cups}-${i}`;
                    const isSelected = selectedSugeridoKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applySugerido(s, key)}
                        className={`text-left px-4 py-3 rounded-lg border text-sm transition-all w-full
                          ${isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border hover:border-primary/50 hover:bg-muted/40"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{s.nombre}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant={s.modalidad === "eps_aseguradora" ? "default" : "secondary"} className="text-xs">
                              {s.modalidad === "eps_aseguradora" ? "EPS" : "Particular"}
                            </Badge>
                            {s.modalidad === "particular" && (
                              <span className="text-muted-foreground text-xs">${s.precio.toLocaleString("es-CO")}</span>
                            )}
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">CUPS: {s.cups} · {TIPO_SERVICIO_OPTIONS.find(t => t.value === s.tipo_servicio)?.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={resetServiceForm}
                  className="text-xs text-primary underline underline-offset-2"
                >
                  + Crear servicio personalizado
                </button>
              </div>
            )}

            {/* Formulario completo (igual que ServiceDialog) */}
            {(showServiceForm || sugeridos.length === 0) && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {selectedSugeridoKey ? "Editar servicio seleccionado" : "Nuevo servicio"}
                  </p>
                  {selectedSugeridoKey && (
                    <button type="button" className="text-xs text-muted-foreground flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> Editando
                    </button>
                  )}
                </div>

                {/* Nombre */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre del servicio *</Label>
                  <Input
                    placeholder="ej: Consulta médica general"
                    value={serviceName}
                    onChange={e => setServiceName(e.target.value)}
                  />
                </div>

                {/* Tipo + Modalidad */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de servicio *</Label>
                    <Select value={tipoServicio} onValueChange={setTipoServicio}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPO_SERVICIO_OPTIONS.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Modalidad de pago *</Label>
                    <Select value={modalidadPago} onValueChange={v => setModalidadPago(v as "particular" | "eps_aseguradora")}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="particular">Particular (pago directo)</SelectItem>
                        <SelectItem value="eps_aseguradora">EPS / Aseguradora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Aviso EPS */}
                {modalidadPago === "eps_aseguradora" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-3 py-2">
                    ⚠️ Servicio EPS: MEDMIND generará los RIPS automáticamente al crear historias clínicas con este servicio. Requiere código CUPS.
                  </p>
                )}
                {modalidadPago === "particular" && (
                  <p className="text-xs text-muted-foreground">
                    ℹ️ Servicio particular: no genera RIPS. El pago lo gestiona directamente el paciente.
                  </p>
                )}

                {/* Precio + CUPS */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Precio (COP) {modalidadPago === "particular" ? "*" : "(opcional)"}
                    </Label>
                    <Input
                      type="number"
                      placeholder={modalidadPago === "eps_aseguradora" ? "Tarifa UVR/EPS" : "60000"}
                      value={servicePrice}
                      onChange={e => setServicePrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Código CUPS {modalidadPago === "eps_aseguradora" ? "*" : "(opcional)"}
                    </Label>
                    <Input
                      placeholder="890201"
                      value={serviceCups}
                      onChange={e => setServiceCups(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setStep(3)}>Atrás</Button>
              <Button
                variant="ghost"
                className="text-muted-foreground text-sm"
                onClick={() => setStep(5)}
              >
                Omitir
              </Button>
              <Button
                className="flex-1"
                onClick={handleStep4}
                disabled={loading || !showServiceForm && sugeridos.length > 0}
              >
                {loading ? "Guardando..." : <>Guardar servicio <ChevronRight className="ml-1 w-4 h-4" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Listo ── */}
        {step === 5 && (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">¡Todo listo, {firstName}!</h2>
              <p className="text-muted-foreground text-lg">Tu cuenta está configurada. Ya puedes crear tu primera consulta.</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p className="font-medium text-sm">¿Qué sigue?</p>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> Registra tu primer paciente en "Pacientes"</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> Crea tu primera historia clínica con IA</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> Genera la factura DIAN automáticamente al finalizar</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => { handleFinish(); navigate("/patients"); }}>
                Registrar paciente
              </Button>
              <Button onClick={() => { handleFinish(); navigate("/voicenotes"); }} disabled={loading}>
                Iniciar consulta <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
