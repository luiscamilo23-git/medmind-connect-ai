import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { NitInput } from "./NitInput";
import {
  CheckCircle,
  Upload,
  Building2,
  Hash,
  Shield,
  TestTube,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface FormData {
  nombre_empresa: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  email_facturacion: string;
  telefono: string;
  prefijo: string;
  rango_desde: number;
  rango_hasta: number;
  resolucion_dian: string;
  fecha_resolucion: string;
  technical_key: string;
  environment: "habilitacion" | "produccion";
}

const PASOS = [
  { titulo: "Datos de empresa", icono: Building2, desc: "NIT, nombre y contacto" },
  { titulo: "Resolución DIAN", icono: Hash, desc: "Rango de numeración autorizado" },
  { titulo: "Certificado digital", icono: Shield, desc: "Archivo .p12 de firma electrónica" },
  { titulo: "Prueba y activar", icono: TestTube, desc: "Verificar conexión con DIAN" },
];

interface Props {
  existingConfig?: Record<string, unknown> | null;
  onSaved: () => void;
}

export function DIANSoftwarePropioSetup({ existingConfig, onSaved }: Props) {
  const [paso, setPaso] = useState(0);
  const [nit, setNit] = useState((existingConfig?.nit as string) ?? "");
  const [dv, setDv] = useState((existingConfig?.dv as number) ?? -1);
  const [nitValido, setNitValido] = useState(!!existingConfig?.nit);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState("");
  const [certExpiry, setCertExpiry] = useState("");
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<"ok" | "error" | null>(null);
  const [guardando, setGuardando] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      nombre_empresa: (existingConfig?.nombre_empresa as string) ?? "",
      direccion: (existingConfig?.direccion as string) ?? "",
      ciudad: (existingConfig?.ciudad as string) ?? "",
      departamento: (existingConfig?.departamento as string) ?? "",
      email_facturacion: (existingConfig?.email_facturacion as string) ?? "",
      telefono: (existingConfig?.telefono as string) ?? "",
      prefijo: (existingConfig?.prefijo as string) ?? "",
      rango_desde: (existingConfig?.rango_desde as number) ?? 1,
      rango_hasta: (existingConfig?.rango_hasta as number) ?? 1000,
      resolucion_dian: (existingConfig?.resolucion_dian as string) ?? "",
      fecha_resolucion: (existingConfig?.fecha_resolucion as string) ?? "",
      technical_key: (existingConfig?.technical_key as string) ?? "",
      environment: (existingConfig?.environment as "habilitacion" | "produccion") ?? "habilitacion",
    },
  });

  const formValues = watch();

  const guardarPaso1Y2 = async (data: FormData) => {
    if (!nitValido) {
      toast({ title: "NIT inválido", description: "Verifica el NIT antes de continuar", variant: "destructive" });
      return;
    }
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const payload = {
        doctor_id: user.id,
        nit,
        dv,
        nombre_empresa: data.nombre_empresa,
        direccion: data.direccion,
        ciudad: data.ciudad,
        departamento: data.departamento,
        email_facturacion: data.email_facturacion,
        telefono: data.telefono,
        prefijo: data.prefijo,
        rango_desde: Number(data.rango_desde),
        rango_hasta: Number(data.rango_hasta),
        resolucion_dian: data.resolucion_dian,
        fecha_resolucion: data.fecha_resolucion,
        technical_key: data.technical_key,
        environment: data.environment,
      };

      const { error } = await supabase
        .from("dian_software_config")
        .upsert(payload, { onConflict: "doctor_id" });

      if (error) throw error;

      toast({ title: "✅ Configuración guardada" });
      setPaso(2);
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setGuardando(false);
    }
  };

  const subirCertificado = async () => {
    if (!certFile || !certPassword) {
      toast({ title: "Falta info", description: "Selecciona el archivo .p12 y escribe la contraseña", variant: "destructive" });
      return;
    }
    setGuardando(true);
    try {
      const arrayBuffer = await certFile.arrayBuffer();
      const certBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const { error } = await supabase.functions.invoke("store-certificate", {
        body: { certBase64, certPassword, certExpiry: certExpiry || null },
      });

      if (error) throw error;

      toast({ title: "🔐 Certificado guardado de forma segura" });
      setPaso(3);
    } catch (err) {
      toast({ title: "Error al guardar certificado", description: (err as Error).message, variant: "destructive" });
    } finally {
      setGuardando(false);
    }
  };

  const probarConexion = async () => {
    setProbando(true);
    setResultadoPrueba(null);
    try {
      const { data, error } = await supabase.functions.invoke("dian-soap-client", {
        body: {
          method: "get_numbering_range",
          payload: { softwareCode: "MEDMIND-001" },
        },
      });

      if (error || !data?.success) {
        setResultadoPrueba("error");
        toast({ title: "❌ Error de conexión con DIAN", description: data?.errorMessage ?? error?.message, variant: "destructive" });
      } else {
        setResultadoPrueba("ok");
        toast({ title: "✅ Conexión DIAN exitosa", description: `TechnicalKey obtenida: ${data.technicalKey?.slice(0, 20)}...` });
      }
    } catch (err) {
      setResultadoPrueba("error");
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setProbando(false);
    }
  };

  const activar = async () => {
    onSaved();
    toast({ title: "🎉 MEDMIND DIAN activo", description: "Ya puedes emitir facturas directamente sin terceros" });
  };

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <div className="flex items-center gap-2">
        {PASOS.map((p, i) => {
          const Icono = p.icono;
          const activo = i === paso;
          const completado = i < paso;
          return (
            <div key={i} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activo ? "bg-primary text-primary-foreground" :
                completado ? "bg-green-100 text-green-700" :
                "bg-muted text-muted-foreground"
              }`}>
                {completado ? <CheckCircle className="w-3 h-3" /> : <Icono className="w-3 h-3" />}
                <span className="hidden sm:inline">{p.titulo}</span>
              </div>
              {i < PASOS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {/* PASO 0 — Datos de empresa */}
      {paso === 0 && (
        <form onSubmit={handleSubmit((d) => { setPaso(1); })} className="space-y-4">
          <NitInput
            value={nit}
            onChange={(n, d, v) => { setNit(n); setDv(d); setNitValido(v); }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nombre de la empresa / clínica</Label>
              <Input {...register("nombre_empresa", { required: true })} placeholder="Clínica MedCare SAS" />
            </div>
            <div>
              <Label>Email de facturación</Label>
              <Input {...register("email_facturacion")} type="email" placeholder="facturacion@clinica.com" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input {...register("telefono")} placeholder="+57 300 000 0000" />
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input {...register("ciudad")} placeholder="Bogotá" />
            </div>
            <div>
              <Label>Departamento</Label>
              <Input {...register("departamento")} placeholder="Cundinamarca" />
            </div>
            <div className="col-span-2">
              <Label>Dirección</Label>
              <Input {...register("direccion")} placeholder="Calle 123 # 45-67, Oficina 201" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={!nitValido}>
            Continuar <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </form>
      )}

      {/* PASO 1 — Resolución DIAN */}
      {paso === 1 && (
        <form onSubmit={handleSubmit(guardarPaso1Y2)} className="space-y-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-800 font-medium mb-2">¿Dónde obtengo estos datos?</p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Ingresa a <a href="https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/" target="_blank" className="underline inline-flex items-center gap-1">portal DIAN <ExternalLink className="w-3 h-3" /></a></li>
                <li>Ve a "Rangos de numeración" → solicita una resolución</li>
                <li>DIAN te asigna un rango y una TechnicalKey (ClaveAcceso)</li>
              </ol>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prefijo (opcional)</Label>
              <Input {...register("prefijo")} placeholder="SEMD" maxLength={4} />
              <p className="text-xs text-muted-foreground mt-1">Ej: "SEMD", "FAC" o vacío</p>
            </div>
            <div>
              <Label>Número de resolución DIAN</Label>
              <Input {...register("resolucion_dian", { required: true })} placeholder="18764000001" />
            </div>
            <div>
              <Label>Rango desde</Label>
              <Input {...register("rango_desde", { required: true, min: 1 })} type="number" placeholder="1" />
            </div>
            <div>
              <Label>Rango hasta</Label>
              <Input {...register("rango_hasta", { required: true, min: 1 })} type="number" placeholder="1000" />
            </div>
            <div className="col-span-2">
              <Label>Fecha de la resolución</Label>
              <Input {...register("fecha_resolucion", { required: true })} type="date" />
            </div>
            <div className="col-span-2">
              <Label>TechnicalKey (ClaveAcceso DIAN)</Label>
              <Textarea
                {...register("technical_key", { required: true })}
                placeholder="Clave técnica proporcionada por DIAN para esta resolución"
                rows={2}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Entorno</p>
              <p className="text-xs text-muted-foreground">
                {formValues.environment === "habilitacion"
                  ? "🧪 Habilitación — pruebas, no genera facturas reales"
                  : "🏭 Producción — facturas reales ante la DIAN"}
              </p>
            </div>
            <Switch
              checked={formValues.environment === "produccion"}
              onCheckedChange={(v) => {}}
              {...register("environment")}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setPaso(0)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Atrás
            </Button>
            <Button type="submit" className="flex-1" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar y continuar"}
            </Button>
          </div>
        </form>
      )}

      {/* PASO 2 — Certificado digital */}
      {paso === 2 && (
        <div className="space-y-4">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4">
              <p className="text-sm text-amber-800 font-medium mb-1">¿No tienes certificado?</p>
              <p className="text-xs text-amber-700">
                Obtén uno de <strong>Certicámara</strong> o <strong>GSE</strong> (~$200-400 USD/año). Debes ser persona jurídica o natural con NIT activo.
              </p>
              <div className="flex gap-2 mt-2">
                <a href="https://www.certicamara.com" target="_blank">
                  <Button variant="outline" size="sm" className="text-xs h-7">Certicámara <ExternalLink className="w-3 h-3 ml-1" /></Button>
                </a>
                <a href="https://www.gse.com.co" target="_blank">
                  <Button variant="outline" size="sm" className="text-xs h-7">GSE <ExternalLink className="w-3 h-3 ml-1" /></Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div>
              <Label>Archivo de certificado (.p12 o .pfx)</Label>
              <div
                className="mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById("cert-upload")?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {certFile ? <span className="text-green-600 font-medium">✓ {certFile.name}</span> : "Haz clic o arrastra tu archivo .p12"}
                </p>
              </div>
              <input
                id="cert-upload"
                type="file"
                accept=".p12,.pfx"
                className="hidden"
                onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <Label>Contraseña del certificado</Label>
              <Input
                type="password"
                value={certPassword}
                onChange={(e) => setCertPassword(e.target.value)}
                placeholder="Contraseña del archivo .p12"
              />
            </div>
            <div>
              <Label>Fecha de vencimiento del certificado</Label>
              <Input
                type="date"
                value={certExpiry}
                onChange={(e) => setCertExpiry(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPaso(1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Atrás
            </Button>
            <Button className="flex-1" onClick={subirCertificado} disabled={guardando || !certFile}>
              {guardando ? "Guardando de forma segura..." : "🔐 Guardar certificado"}
            </Button>
          </div>

          <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={() => setPaso(3)}>
            Saltar por ahora (configurar después)
          </Button>
        </div>
      )}

      {/* PASO 3 — Probar y activar */}
      {paso === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Probar conexión con DIAN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Verificaremos que MEDMIND puede comunicarse con el servicio SOAP de la DIAN usando tu configuración.
              </p>
              <Button onClick={probarConexion} disabled={probando} className="w-full" variant="outline">
                {probando ? "Probando..." : "🧪 Probar conexión DIAN"}
              </Button>
              {resultadoPrueba === "ok" && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Conexión exitosa</p>
                    <p className="text-xs text-green-600">MEDMIND puede emitir facturas directamente a DIAN</p>
                  </div>
                </div>
              )}
              {resultadoPrueba === "error" && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error de conexión</p>
                    <p className="text-xs text-red-600">Verifica la TechnicalKey y el rango de numeración</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={activar} className="w-full" size="lg">
            ✅ Activar MEDMIND DIAN Directo
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Puedes cambiar la configuración en cualquier momento desde esta pantalla.
          </p>
        </div>
      )}
    </div>
  );
}
