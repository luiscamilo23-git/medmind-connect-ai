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
  Building2,
  FileText,
  Zap,
  ArrowRight,
  Pencil,
  Stethoscope,
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

const STEPS = [
  { id: 1, label: "Bienvenida", icon: Zap },
  { id: 2, label: "Consultorio", icon: Building2 },
  { id: 3, label: "Servicio", icon: FileText },
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

  // Step 1 — editable confirmation
  const [fullName, setFullName] = useState(initialName);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [editingProfile, setEditingProfile] = useState(!initialName || !initialSpecialty);

  // Step 2 — consultorio
  const [clinicName, setClinicName] = useState("");
  const [nit, setNit] = useState("");
  const [ciudad, setCiudad] = useState("");

  // Step 3 — servicio
  const [selectedSugeridoKey, setSelectedSugeridoKey] = useState<string | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceCups, setServiceCups] = useState("");
  const [tipoServicio, setTipoServicio] = useState("CONSULTA");
  const [modalidadPago, setModalidadPago] = useState<"particular" | "eps_aseguradora">("particular");

  const selectedSpecialtyLabel = SPECIALTIES.find(s => s.value === specialty)?.label || specialty;
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

  const changeSpecialty = (v: string) => {
    setSpecialty(v);
    setSelectedSugeridoKey(null);
    setShowServiceForm(false);
    setServiceName(""); setServicePrice(""); setServiceCups("");
    setTipoServicio("CONSULTA"); setModalidadPago("particular");
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStep1 = async () => {
    if (!fullName.trim() || !specialty) {
      toast({ title: "Confirma tu nombre y especialidad", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), specialty })
      .eq("id", doctorId);
    setLoading(false);
    if (error) {
      toast({ title: "Error guardando perfil", description: error.message, variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleStep2 = async () => {
    if (!clinicName.trim()) {
      toast({ title: "Ingresa el nombre de tu clínica o consultorio", variant: "destructive" });
      return;
    }
    if (!nit.trim()) {
      toast({ title: "Ingresa tu NIT o cédula", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        clinic_name: clinicName.trim(),
        city: ciudad.trim() || null,
      })
      .eq("id", doctorId);
    setLoading(false);
    if (error) {
      toast({ title: "Error guardando consultorio", description: error.message, variant: "destructive" });
      return;
    }
    setStep(3);
  };

  const handleStep3 = async () => {
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
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    localStorage.setItem(`onboarding_done_${doctorId}`, "true");
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", doctorId);
    onComplete();
  };

  const firstName = fullName.replace(/^Dr\.\s*/i, "").split(" ")[0] || "doctor";

  // ── Progress bar ──────────────────────────────────────────────────────────
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      {/* Top progress */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Step dots */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                  ${done ? "bg-primary text-primary-foreground" : active ? "bg-primary/15 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs hidden sm:block ${active ? "text-primary font-medium" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 mb-4 transition-all ${done ? "bg-primary" : "bg-muted"}`} />}
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-lg mt-20 max-h-[calc(100vh-130px)] overflow-y-auto pb-4">

        {/* ── STEP 1: Bienvenida + confirmar perfil ── */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Bienvenido a MEDMIND</h1>
                <p className="text-muted-foreground text-sm mt-1">3 pasos rápidos y estarás listo para tu primera consulta.</p>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "🎙️", label: "Historia clínica por voz con IA" },
                { icon: "🧾", label: "Facturación DIAN electrónica" },
                { icon: "📋", label: "RIPS automáticos para EPS" },
              ].map(item => (
                <div key={item.label} className="bg-muted/50 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{item.icon}</div>
                  <div className="text-muted-foreground text-xs leading-tight">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Confirm / edit profile */}
            <div className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Tu información médica</span>
                </div>
                {!editingProfile && (
                  <button
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    className="text-xs text-primary flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                )}
              </div>

              {editingProfile ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nombre completo *</Label>
                    <Input
                      placeholder="Dr. Juan Pérez"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Especialidad *</Label>
                    <Select value={specialty} onValueChange={changeSpecialty}>
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
                  {fullName && specialty && (
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="text-xs text-primary underline underline-offset-2"
                    >
                      ✓ Confirmar
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium">{fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedSpecialtyLabel}</p>
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleStep1}
              disabled={loading || !fullName.trim() || !specialty}
            >
              {loading ? "Guardando..." : <>Comenzar configuración <ArrowRight className="ml-2 w-4 h-4" /></>}
            </Button>
          </div>
        )}

        {/* ── STEP 2: Consultorio ── */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Tu consultorio</h2>
              <p className="text-muted-foreground text-sm">
                Datos fiscales para la facturación electrónica DIAN. Los puedes editar después en <strong>Configuración → Facturación</strong>.
              </p>
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
                <Label htmlFor="nit">NIT o Cédula *</Label>
                <Input
                  id="nit"
                  placeholder="ej: 900123456 o 12345678"
                  value={nit}
                  onChange={e => setNit(e.target.value.replace(/\D/g, ""))}
                />
                <p className="text-xs text-muted-foreground">
                  Si eres persona natural usa tu cédula. Si tienes empresa usa el NIT sin dígito verificador.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  placeholder="ej: Bogotá, Medellín, Cali..."
                  value={ciudad}
                  onChange={e => setCiudad(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
              💡 Para activar la facturación electrónica DIAN necesitarás también la resolución de numeración y el certificado digital. Esto lo configuras en <strong>Facturación → DIAN</strong> cuando estés listo.
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button className="flex-1" onClick={handleStep2} disabled={loading}>
                {loading ? "Guardando..." : <>Continuar <ChevronRight className="ml-1 w-4 h-4" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Primer servicio ── */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Tu primer servicio</h2>
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
                        <span className="text-xs text-muted-foreground">
                          CUPS: {s.cups} · {TIPO_SERVICIO_OPTIONS.find(t => t.value === s.tipo_servicio)?.label}
                        </span>
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

            {/* Formulario editable */}
            {(showServiceForm || sugeridos.length === 0) && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                <p className="text-sm font-semibold">
                  {selectedSugeridoKey ? "Editar servicio seleccionado" : "Nuevo servicio"}
                </p>

                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre del servicio *</Label>
                  <Input
                    placeholder="ej: Consulta médica general"
                    value={serviceName}
                    onChange={e => setServiceName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de servicio *</Label>
                    <Select value={tipoServicio} onValueChange={setTipoServicio}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
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
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="particular">Particular (pago directo)</SelectItem>
                        <SelectItem value="eps_aseguradora">EPS / Aseguradora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {modalidadPago === "eps_aseguradora" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-3 py-2">
                    ⚠️ EPS: MEDMIND generará RIPS automáticamente al usar este servicio. Requiere código CUPS.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Precio COP {modalidadPago === "particular" ? "*" : "(opcional)"}
                    </Label>
                    <Input
                      type="number"
                      placeholder={modalidadPago === "eps_aseguradora" ? "Tarifa EPS" : "60000"}
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
              <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
              <Button
                variant="ghost"
                className="text-muted-foreground text-sm"
                onClick={() => finishOnboarding()}
              >
                Omitir
              </Button>
              <Button
                className="flex-1"
                onClick={handleStep3}
                disabled={loading || (!showServiceForm && sugeridos.length > 0)}
              >
                {loading ? "Guardando..." : <>Finalizar <CheckCircle2 className="ml-1 w-4 h-4" /></>}
              </Button>
            </div>

            {/* After finish — quick nav */}
            <p className="text-center text-xs text-muted-foreground">
              Puedes agregar más servicios en <strong>Facturación → Servicios</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
