import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

// ─── Catálogos DIAN/MinSalud ──────────────────────────────────────────────────

export const TIPOS_RIPS = [
  { value: "AC", label: "AC — Consultas médicas", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  { value: "AP", label: "AP — Procedimientos", color: "bg-purple-500/10 text-purple-700 border-purple-500/30" },
  { value: "AU", label: "AU — Urgencias", color: "bg-red-500/10 text-red-700 border-red-500/30" },
  { value: "AH", label: "AH — Hospitalización", color: "bg-orange-500/10 text-orange-700 border-orange-500/30" },
  { value: "AN", label: "AN — Recién nacidos", color: "bg-green-500/10 text-green-700 border-green-500/30" },
  { value: "AM", label: "AM — Medicamentos", color: "bg-teal-500/10 text-teal-700 border-teal-500/30" },
  { value: "AT", label: "AT — Otros servicios", color: "bg-gray-500/10 text-gray-700 border-gray-500/30" },
] as const;

export type TipoRIPS = "AC" | "AP" | "AU" | "AH" | "AN" | "AM" | "AT";

const FINALIDAD_CONSULTA = [
  { value: "01", label: "01 — Consulta de primera vez" },
  { value: "02", label: "02 — Control o seguimiento" },
  { value: "03", label: "03 — Detección temprana enfermedad general" },
  { value: "04", label: "04 — Detección temprana enfermedad laboral" },
  { value: "05", label: "05 — Protección específica" },
  { value: "06", label: "06 — Tratamiento quirúrgico" },
  { value: "07", label: "07 — Tratamiento médico" },
  { value: "08", label: "08 — Tratamiento farmacológico" },
  { value: "09", label: "09 — Rehabilitación y recuperación" },
  { value: "10", label: "10 — No aplica" },
];

const CAUSA_ATENCION = [
  { value: "01", label: "01 — Enfermedad general" },
  { value: "02", label: "02 — Enfermedad laboral" },
  { value: "03", label: "03 — Accidente de trabajo" },
  { value: "04", label: "04 — Accidente de tránsito" },
  { value: "05", label: "05 — Lesión por agresión" },
  { value: "06", label: "06 — Lesión autoinfligida" },
  { value: "07", label: "07 — Otra causa externa" },
  { value: "08", label: "08 — Violencia sexual" },
  { value: "09", label: "09 — Víctima de violencia armada" },
];

const TIPO_DIAGNOSTICO = [
  { value: "1", label: "1 — Impresión diagnóstica" },
  { value: "2", label: "2 — Confirmado nuevo" },
  { value: "3", label: "3 — Confirmado repetido" },
];

const AMBITO_REALIZACION = [
  { value: "1", label: "1 — Ambulatorio" },
  { value: "2", label: "2 — Hospitalario" },
  { value: "3", label: "3 — Urgencias" },
  { value: "4", label: "4 — Sala quirúrgica" },
];

const FINALIDAD_PROCEDIMIENTO = [
  { value: "1", label: "1 — Diagnóstico" },
  { value: "2", label: "2 — Terapéutico" },
  { value: "3", label: "3 — Protección específica" },
  { value: "4", label: "4 — Detección temprana enfermedad general" },
  { value: "5", label: "5 — Detección temprana enfermedad laboral" },
];

const PERSONAL_ATIENDE = [
  { value: "01", label: "01 — Médico especialista" },
  { value: "02", label: "02 — Médico general" },
  { value: "03", label: "03 — Enfermero(a)" },
  { value: "04", label: "04 — Auxiliar de enfermería" },
  { value: "05", label: "05 — Otro profesional de salud" },
  { value: "06", label: "06 — Tecnólogo" },
  { value: "07", label: "07 — Terapeuta" },
  { value: "08", label: "08 — Auxiliar técnico" },
];

const CONDICION_SALIDA = [
  { value: "1", label: "1 — Vivo" },
  { value: "2", label: "2 — Muerto" },
  { value: "3", label: "3 — Muerto en menos de 48 horas" },
];

const VIA_INGRESO = [
  { value: "1", label: "1 — Urgencias" },
  { value: "2", label: "2 — Consulta externa" },
  { value: "3", label: "3 — Remitido" },
];

const TIPO_MEDICAMENTO = [
  { value: "1", label: "1 — Medicamento PBS (Plan de Beneficios)" },
  { value: "2", label: "2 — Medicamento no PBS" },
  { value: "3", label: "3 — Insulina" },
];

const FORMA_PAGO_QUIRURGICO = [
  { value: "1", label: "1 — Contrato" },
  { value: "2", label: "2 — Pago por evento" },
  { value: "3", label: "3 — Capitación" },
];

// ─── Schema base ──────────────────────────────────────────────────────────────

const baseSchema = z.object({
  tipo_archivo: z.enum(["AC", "AP", "AU", "AH", "AN", "AM", "AT"]),
  codigo_servicio: z.string().min(1, "Código requerido"),
  descripcion_servicio: z.string().min(1, "Descripción requerida"),
  fecha_inicio_atencion: z.string().min(1, "Fecha requerida"),
  fecha_fin_atencion: z.string().optional(),
  numero_autorizacion: z.string().optional(),
  codigo_diagnostico_principal: z.string().optional(),
  codigo_diagnostico_relacionado: z.string().optional(),
  tipo_diagnostico_principal: z.string().optional(),
  valor_total: z.coerce.number().min(0),
  copago: z.coerce.number().min(0).default(0),
  valor_neto: z.coerce.number().min(0),
  // Campos adicionales por tipo (en datos_json)
  finalidad_consulta: z.string().optional(),
  causa_atencion: z.string().optional(),
  codigo_diagnostico_relacionado2: z.string().optional(),
  codigo_diagnostico_relacionado3: z.string().optional(),
  ambito_realizacion: z.string().optional(),
  finalidad_procedimiento: z.string().optional(),
  personal_atiende: z.string().optional(),
  complicacion: z.string().optional(),
  forma_pago_quirurgico: z.string().optional(),
  condicion_salida: z.string().optional(),
  via_ingreso: z.string().optional(),
  codigo_procedimiento_dx: z.string().optional(),
  codigo_procedimiento_quirurgico: z.string().optional(),
  // AN
  edad_gestacional: z.coerce.number().optional(),
  num_consultas_prenatal: z.coerce.number().optional(),
  sexo_biologico: z.string().optional(),
  peso: z.coerce.number().optional(),
  condicion_nacimiento: z.string().optional(),
  // AM
  tipo_medicamento: z.string().optional(),
  nombre_generico: z.string().optional(),
  concentracion: z.string().optional(),
  unidad_medida: z.string().optional(),
  forma_farmaceutica: z.string().optional(),
  unidades: z.coerce.number().optional(),
  valor_unitario: z.coerce.number().optional(),
  // AT
  cantidad_servicio: z.coerce.number().optional(),
});

type FormData = z.infer<typeof baseSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface RIPSRecordEditorProps {
  defaultValues?: Partial<FormData>;
  tipoForzado?: TipoRIPS;
  onSave: (data: FormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function SelectField({
  control, name, label, options, description,
}: {
  control: any; name: string; label: string;
  options: { value: string; label: string }[];
  description?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextField({
  control, name, label, placeholder, description, type = "text",
}: {
  control: any; name: string; label: string; placeholder?: string;
  description?: string; type?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ─── Secciones por tipo ───────────────────────────────────────────────────────

function CamposAC({ control }: { control: any }) {
  return (
    <>
      <Alert className="border-blue-500/30 bg-blue-500/5">
        <InfoIcon className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700 text-sm">
          <strong>AC — Consulta médica.</strong> Incluye consultas de medicina general, especialidades y odontología. Use código CUPS del servicio prestado.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-4">
        <SelectField control={control} name="finalidad_consulta" label="Finalidad de la consulta *" options={FINALIDAD_CONSULTA} description="Res. 2275/2023 campo obligatorio" />
        <SelectField control={control} name="causa_atencion" label="Causa / motivo de atención *" options={CAUSA_ATENCION} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField control={control} name="codigo_diagnostico_principal" label="CIE-10 diagnóstico principal *" placeholder="Ej: J00, Z000, K297" description="Código CIE-10 de la enfermedad principal" />
        <SelectField control={control} name="tipo_diagnostico_principal" label="Tipo diagnóstico principal *" options={TIPO_DIAGNOSTICO} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <TextField control={control} name="codigo_diagnostico_relacionado" label="CIE-10 relacionado 1" placeholder="Ej: I10" />
        <TextField control={control} name="codigo_diagnostico_relacionado2" label="CIE-10 relacionado 2" placeholder="Opcional" />
        <TextField control={control} name="codigo_diagnostico_relacionado3" label="CIE-10 relacionado 3" placeholder="Opcional" />
      </div>
    </>
  );
}

function CamposAP({ control }: { control: any }) {
  return (
    <>
      <Alert className="border-purple-500/30 bg-purple-500/5">
        <InfoIcon className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-700 text-sm">
          <strong>AP — Procedimiento.</strong> Incluye cirugías, terapias, laboratorios, imágenes diagnósticas. Use código CUPS del procedimiento realizado.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-4">
        <SelectField control={control} name="ambito_realizacion" label="Ámbito de realización *" options={AMBITO_REALIZACION} />
        <SelectField control={control} name="finalidad_procedimiento" label="Finalidad del procedimiento *" options={FINALIDAD_PROCEDIMIENTO} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField control={control} name="personal_atiende" label="Personal que atiende *" options={PERSONAL_ATIENDE} />
        <SelectField control={control} name="forma_pago_quirurgico" label="Forma de pago quirúrgico" options={FORMA_PAGO_QUIRURGICO} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField control={control} name="codigo_diagnostico_principal" label="CIE-10 diagnóstico principal *" placeholder="Ej: K409" />
        <TextField control={control} name="complicacion" label="CIE-10 complicación" placeholder="Si hubo complicación" />
      </div>
      <TextField control={control} name="codigo_diagnostico_relacionado" label="CIE-10 diagnóstico relacionado" placeholder="Opcional" />
    </>
  );
}

function CamposAU({ control }: { control: any }) {
  return (
    <>
      <Alert className="border-red-500/30 bg-red-500/5">
        <InfoIcon className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700 text-sm">
          <strong>AU — Urgencias.</strong> Atención de urgencias. Debe registrar fecha de inicio Y egreso.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-4">
        <SelectField control={control} name="causa_atencion" label="Causa / motivo de atención *" options={CAUSA_ATENCION} />
        <SelectField control={control} name="condicion_salida" label="Condición de salida del paciente *" options={CONDICION_SALIDA} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField control={control} name="codigo_diagnostico_principal" label="CIE-10 diagnóstico principal *" placeholder="Ej: S000" />
        <TextField control={control} name="codigo_procedimiento_dx" label="Código procedimiento Dx" placeholder="CUPS del procedimiento diagnóstico" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <TextField control={control} name="codigo_diagnostico_relacionado" label="CIE-10 relacionado 1" placeholder="Opcional" />
        <TextField control={control} name="codigo_diagnostico_relacionado2" label="CIE-10 relacionado 2" placeholder="Opcional" />
        <TextField control={control} name="complicacion" label="CIE-10 complicación" placeholder="Si hubo complicación" />
      </div>
    </>
  );
}

function CamposAH({ control }: { control: any }) {
  return (
    <>
      <Alert className="border-orange-500/30 bg-orange-500/5">
        <InfoIcon className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-700 text-sm">
          <strong>AH — Hospitalización.</strong> Registro de estancia hospitalaria. Fecha fin = fecha de egreso.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-4">
        <SelectField control={control} name="via_ingreso" label="Vía de ingreso *" options={VIA_INGRESO} />
        <SelectField control={control} name="causa_atencion" label="Causa / motivo de atención *" options={CAUSA_ATENCION} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField control={control} name="condicion_salida" label="Condición de salida *" options={CONDICION_SALIDA} />
        <TextField control={control} name="codigo_procedimiento_quirurgico" label="Código procedimiento quirúrgico" placeholder="CUPS si hubo cirugía" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField control={control} name="codigo_diagnostico_principal" label="CIE-10 diagnóstico principal *" placeholder="Ej: I219" />
        <TextField control={control} name="complicacion" label="CIE-10 complicación" placeholder="Si hubo complicación" />
      </div>
    </>
  );
}

function CamposAN({ control }: { control: any }) {
  return (
    <>
      <Alert className="border-green-500/30 bg-green-500/5">
        <InfoIcon className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 text-sm">
          <strong>AN — Recién nacidos.</strong> Atención neonatal. El diagnóstico principal normalmente es Z380 (recién nacido vivo).
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-3 gap-4">
        <TextField control={control} name="edad_gestacional" label="Edad gestacional (semanas) *" placeholder="Ej: 38" type="number" />
        <TextField control={control} name="num_consultas_prenatal" label="Consultas prenatales" placeholder="Ej: 8" type="number" />
        <TextField control={control} name="peso" label="Peso al nacer (gramos) *" placeholder="Ej: 3200" type="number" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField control={control} name="sexo_biologico" label="Sexo biológico *" options={[
          { value: "M", label: "M — Masculino" },
          { value: "F", label: "F — Femenino" },
          { value: "I", label: "I — Indeterminado" },
        ]} />
        <SelectField control={control} name="condicion_nacimiento" label="Condición al nacer *" options={[
          { value: "1", label: "1 — Vivo" },
          { value: "2", label: "2 — Muerto" },
        ]} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField control={control} name="codigo_diagnostico_principal" label="CIE-10 diagnóstico principal *" placeholder="Z380" description="Normalmente Z380 para RN vivo único" />
        <TextField control={control} name="complicacion" label="CIE-10 complicación neonatal" placeholder="Si hubo complicación" />
      </div>
    </>
  );
}

function CamposAM({ control }: { control: any }) {
  return (
    <>
      <Alert className="border-teal-500/30 bg-teal-500/5">
        <InfoIcon className="h-4 w-4 text-teal-600" />
        <AlertDescription className="text-teal-700 text-sm">
          <strong>AM — Medicamentos.</strong> Dispensación de medicamentos. Use código ATC o INVIMA. El código de servicio es el código del medicamento.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-4">
        <SelectField control={control} name="tipo_medicamento" label="Tipo de medicamento *" options={TIPO_MEDICAMENTO} />
        <TextField control={control} name="nombre_generico" label="Nombre genérico *" placeholder="Ej: Amoxicilina" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <TextField control={control} name="concentracion" label="Concentración" placeholder="Ej: 500mg" />
        <TextField control={control} name="forma_farmaceutica" label="Forma farmacéutica" placeholder="Ej: Cápsula, Tableta" />
        <TextField control={control} name="unidad_medida" label="Unidad de medida" placeholder="Ej: UN, ML" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField control={control} name="unidades" label="Unidades dispensadas *" placeholder="Ej: 20" type="number" />
        <TextField control={control} name="valor_unitario" label="Valor unitario (COP)" placeholder="Ej: 5000" type="number" />
      </div>
    </>
  );
}

function CamposAT({ control }: { control: any }) {
  return (
    <>
      <Alert className="border-gray-500/30 bg-gray-500/5">
        <InfoIcon className="h-4 w-4 text-gray-600" />
        <AlertDescription className="text-gray-700 text-sm">
          <strong>AT — Otros servicios.</strong> Servicios no clasificados en los tipos anteriores (óptica, apoyo terapéutico, etc.).
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-4">
        <TextField control={control} name="cantidad_servicio" label="Cantidad de servicios *" placeholder="Ej: 1" type="number" />
        <TextField control={control} name="codigo_diagnostico_principal" label="CIE-10 diagnóstico principal" placeholder="Ej: H524" />
      </div>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function RIPSRecordEditor({
  defaultValues,
  tipoForzado,
  onSave,
  onCancel,
  isLoading,
}: RIPSRecordEditorProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      tipo_archivo: tipoForzado ?? defaultValues?.tipo_archivo ?? "AC",
      codigo_servicio: "",
      descripcion_servicio: "",
      fecha_inicio_atencion: new Date().toISOString().split("T")[0],
      valor_total: 0,
      copago: 0,
      valor_neto: 0,
      finalidad_consulta: "01",
      causa_atencion: "01",
      tipo_diagnostico_principal: "2",
      ambito_realizacion: "1",
      finalidad_procedimiento: "1",
      personal_atiende: "01",
      forma_pago_quirurgico: "1",
      condicion_salida: "1",
      via_ingreso: "1",
      tipo_medicamento: "1",
      unidades: 1,
      cantidad_servicio: 1,
      ...defaultValues,
    },
  });

  const tipo = form.watch("tipo_archivo");
  const valorTotal = form.watch("valor_total");
  const copago = form.watch("copago");

  // Calcular valor neto automáticamente
  const calcularValorNeto = () => {
    const neto = (valorTotal || 0) - (copago || 0);
    form.setValue("valor_neto", Math.max(0, neto));
  };

  const tipoInfo = TIPOS_RIPS.find((t) => t.value === tipo);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">

        {/* Tipo de registro */}
        {!tipoForzado && (
          <FormField
            control={form.control}
            name="tipo_archivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de registro RIPS *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPOS_RIPS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {tipoForzado && tipoInfo && (
          <Badge variant="outline" className={`${tipoInfo.color} text-sm px-3 py-1`}>
            {tipoInfo.label}
          </Badge>
        )}

        {/* Campos comunes */}
        <div className="grid grid-cols-2 gap-4">
          <TextField
            control={form.control}
            name="codigo_servicio"
            label={tipo === "AM" ? "Código medicamento (ATC/INVIMA) *" : "Código CUPS del servicio *"}
            placeholder={tipo === "AM" ? "Ej: J01CA04" : "Ej: 890201"}
            description="Código del Catálogo Único de Procedimientos en Salud"
          />
          <TextField
            control={form.control}
            name="descripcion_servicio"
            label="Descripción del servicio *"
            placeholder="Ej: Consulta médica general"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            control={form.control}
            name="fecha_inicio_atencion"
            label={tipo === "AH" || tipo === "AU" ? "Fecha de ingreso *" : "Fecha de atención *"}
            type="date"
          />
          {(tipo === "AH" || tipo === "AU") && (
            <TextField
              control={form.control}
              name="fecha_fin_atencion"
              label="Fecha de egreso *"
              type="date"
            />
          )}
          {tipo === "AN" && (
            <TextField
              control={form.control}
              name="fecha_fin_atencion"
              label="Fecha de nacimiento *"
              type="date"
            />
          )}
        </div>

        <TextField
          control={form.control}
          name="numero_autorizacion"
          label="Número de autorización EPS"
          placeholder="Número de autorización (si aplica)"
          description="Requerido para servicios autorizados por EPS"
        />

        {/* Campos específicos por tipo */}
        {tipo === "AC" && <CamposAC control={form.control} />}
        {tipo === "AP" && <CamposAP control={form.control} />}
        {tipo === "AU" && <CamposAU control={form.control} />}
        {tipo === "AH" && <CamposAH control={form.control} />}
        {tipo === "AN" && <CamposAN control={form.control} />}
        {tipo === "AM" && <CamposAM control={form.control} />}
        {tipo === "AT" && <CamposAT control={form.control} />}

        {/* Valores económicos */}
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-semibold">Valores económicos (COP)</p>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="valor_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor del servicio *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => { field.onChange(e); setTimeout(calcularValorNeto, 0); }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="copago"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Copago / cuota moderadora</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => { field.onChange(e); setTimeout(calcularValorNeto, 0); }}
                    />
                  </FormControl>
                  <FormDescription>0 si no aplica</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valor_neto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor neto a pagar *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>Se calcula automáticamente</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar registro"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Helper para convertir FormData → datos_json por tipo
export function buildDatosJson(data: FormData): Record<string, unknown> {
  const base = {
    finalidadConsulta: data.finalidad_consulta,
    causaMotivoAtencion: data.causa_atencion,
    codDiagnosticoPrincipal: data.codigo_diagnostico_principal,
    codDiagnosticoRelacionado2: data.codigo_diagnostico_relacionado2,
    codDiagnosticoRelacionado3: data.codigo_diagnostico_relacionado3,
    condicionSalidaPaciente: data.condicion_salida,
    codDiagnosticoComplicacion: data.complicacion,
  };

  switch (data.tipo_archivo) {
    case "AP": return { ...base,
      ambitoRealizacion: data.ambito_realizacion,
      finalidadProcedimiento: data.finalidad_procedimiento,
      personalAtiende: data.personal_atiende,
      formaPagoQuirurgico: data.forma_pago_quirurgico,
    };
    case "AU": return { ...base, codProcedimientoDx: data.codigo_procedimiento_dx };
    case "AH": return { ...base,
      viaIngreso: data.via_ingreso,
      codProcedimientoQuirurgico1: data.codigo_procedimiento_quirurgico,
    };
    case "AN": return {
      edadGestacional: data.edad_gestacional,
      numConsultasPrenatal: data.num_consultas_prenatal,
      codSexoBiologico: data.sexo_biologico,
      peso: data.peso,
      condicionNacimiento: data.condicion_nacimiento,
      ...base,
    };
    case "AM": return {
      tipoMedicamento: data.tipo_medicamento,
      nombreGenerico: data.nombre_generico,
      concentracion: data.concentracion,
      formaFarmaceutica: data.forma_farmaceutica,
      unidadMedida: data.unidad_medida,
      unidades: data.unidades,
      valorUnitario: data.valor_unitario,
    };
    case "AT": return { cantidad: data.cantidad_servicio };
    default: return base;
  }
}
