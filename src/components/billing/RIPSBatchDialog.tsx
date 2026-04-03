import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, CheckCircle, Edit2, ChevronRight, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TIPOS_RIPS, type TipoRIPS } from "./RIPSRecordEditor";

const step1Schema = z.object({
  fecha_inicio: z.date({ required_error: "Fecha de inicio requerida" }),
  fecha_fin: z.date({ required_error: "Fecha de fin requerida" }),
  pagador: z.string().min(1, "Nombre del pagador requerido"),
  nit_pagador: z.string().optional(),
}).refine((d) => d.fecha_fin >= d.fecha_inicio, {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["fecha_fin"],
});

type Step1Data = z.infer<typeof step1Schema>;

type DetectedRecord = {
  invoice_id: string;
  patient_id: string;
  patient_name: string;
  tipo_archivo: TipoRIPS;
  codigo_servicio: string;
  descripcion_servicio: string;
  fecha_inicio_atencion: string;
  valor_total: number;
  copago: number;
  valor_neto: number;
  codigo_diagnostico_principal: string;
  numero_autorizacion: string;
  datos_json: Record<string, unknown>;
};

type RIPSBatchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DatePickerField({ field, label }: { field: any; label: string }) {
  return (
    <FormItem className="flex flex-col">
      <FormLabel>{label}</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
              {field.value ? format(field.value, "dd/MM/yyyy") : <span>Seleccionar</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={field.value} onSelect={field.onChange}
            disabled={(d) => d > new Date() || d < new Date("2020-01-01")} initialFocus />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
}

export function RIPSBatchDialog({ open, onOpenChange }: RIPSBatchDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [detectedRecords, setDetectedRecords] = useState<DetectedRecord[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { pagador: "", nit_pagador: "" },
  });

  // Step 1 → Step 2: buscar facturas y auto-clasificar
  const handleStep1 = async (data: Step1Data) => {
    setStep1Data(data);
    setLoadingInvoices(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*, patients(*), invoice_items(*, services(*))")
        .eq("doctor_id", user!.id)
        .in("estado", ["EMITIDA", "VALIDADA", "PAGADA"])
        .gte("fecha_emision", format(data.fecha_inicio, "yyyy-MM-dd"))
        .lte("fecha_emision", format(data.fecha_fin, "yyyy-MM-dd"));

      if (error) throw error;

      // Auto-clasificar cada ítem de factura en tipo RIPS
      const records: DetectedRecord[] = (invoices ?? []).flatMap((inv: any) =>
        (inv.invoice_items ?? []).map((item: any) => {
          const tipoServicio = item.services?.tipo_servicio ?? "";
          let tipo: TipoRIPS = "AC";
          if (tipoServicio === "PROCEDIMIENTO" || tipoServicio === "PROCEDURE") tipo = "AP";
          else if (tipoServicio === "URGENCIA") tipo = "AU";
          else if (tipoServicio === "HOSPITALIZACION") tipo = "AH";
          else if (tipoServicio === "MEDICAMENTO") tipo = "AM";
          else if (tipoServicio === "OTRO") tipo = "AT";
          else if (tipoServicio === "CONSULTA" || !tipoServicio) tipo = "AC";

          return {
            invoice_id: inv.id,
            patient_id: inv.patient_id,
            patient_name: inv.patients?.full_name ?? "Paciente",
            tipo_archivo: tipo,
            codigo_servicio: item.codigo_cups || "890201",
            descripcion_servicio: item.descripcion || "Servicio médico",
            fecha_inicio_atencion: inv.fecha_emision,
            valor_total: parseFloat(item.total_linea) || 0,
            copago: 0,
            valor_neto: parseFloat(item.total_linea) || 0,
            codigo_diagnostico_principal: "",
            numero_autorizacion: "",
            datos_json: {
              finalidadConsulta: tipo === "AC" ? "01" : undefined,
              causaMotivoAtencion: "01",
              tipoDiagnosticoPrincipal: "2",
              ambitoRealizacion: tipo === "AP" ? "1" : undefined,
              finalidadProcedimiento: tipo === "AP" ? "1" : undefined,
              personalAtiende: tipo === "AP" ? "01" : undefined,
            },
          } as DetectedRecord;
        })
      );

      setDetectedRecords(records);
      setStep(2);
    } catch (e: any) {
      toast.error(`Error al buscar facturas: ${e.message}`);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const updateRecord = (index: number, field: keyof DetectedRecord, value: unknown) => {
    setDetectedRecords((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      // Recalcular valor neto
      if (field === "valor_total" || field === "copago") {
        const vt = field === "valor_total" ? (value as number) : next[index].valor_total;
        const co = field === "copago" ? (value as number) : next[index].copago;
        next[index].valor_neto = Math.max(0, vt - co);
      }
      return next;
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!step1Data) throw new Error("Datos incompletos");
      const { data: { user } } = await supabase.auth.getUser();

      const { data: batch, error: batchError } = await supabase
        .from("rips_batches")
        .insert([{
          doctor_id: user!.id,
          fecha_inicio: format(step1Data.fecha_inicio, "yyyy-MM-dd"),
          fecha_fin: format(step1Data.fecha_fin, "yyyy-MM-dd"),
          pagador: step1Data.pagador,
          nit_pagador: step1Data.nit_pagador || null,
          estado: "DRAFT",
          total_registros: detectedRecords.length,
          total_valor: detectedRecords.reduce((s, r) => s + r.valor_total, 0),
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      if (detectedRecords.length > 0) {
        const ripsRecords = detectedRecords.map((r) => ({
          rips_batch_id: batch.id,
          invoice_id: r.invoice_id,
          patient_id: r.patient_id,
          tipo_archivo: r.tipo_archivo,
          numero_autorizacion: r.numero_autorizacion || null,
          codigo_servicio: r.codigo_servicio,
          descripcion_servicio: r.descripcion_servicio,
          fecha_inicio_atencion: r.fecha_inicio_atencion,
          codigo_diagnostico_principal: r.codigo_diagnostico_principal || null,
          valor_total: r.valor_total,
          copago: r.copago,
          valor_neto: r.valor_neto,
          datos_json: r.datos_json,
        }));
        const { error: recError } = await supabase.from("rips_records").insert(ripsRecords);
        if (recError) throw recError;
      }
      return batch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rips-batches"] });
      toast.success(`Lote RIPS creado con ${detectedRecords.length} registros`);
      handleClose();
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  const handleClose = () => {
    setStep(1);
    setStep1Data(null);
    setDetectedRecords([]);
    setEditingIndex(null);
    form.reset();
    onOpenChange(false);
  };

  const countByType = detectedRecords.reduce((acc, r) => {
    acc[r.tipo_archivo] = (acc[r.tipo_archivo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Lote RIPS — Resolución 2275/2023</DialogTitle>
          <DialogDescription>
            {step === 1 && "Paso 1/3 — Define el período y el pagador"}
            {step === 2 && `Paso 2/3 — Revisa y edita los ${detectedRecords.length} registros detectados`}
            {step === 3 && "Paso 3/3 — Confirma y crea el lote"}
          </DialogDescription>
        </DialogHeader>

        {/* ── PASO 1: Datos del lote ── */}
        {step === 1 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleStep1)} className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Se buscarán automáticamente todas las facturas <strong>emitidas o validadas</strong> del período. Podrás revisar y corregir la clasificación antes de crear el lote.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="fecha_inicio" render={({ field }) => <DatePickerField field={field} label="Fecha inicio *" />} />
                <FormField control={form.control} name="fecha_fin" render={({ field }) => <DatePickerField field={field} label="Fecha fin *" />} />
              </div>

              <FormField control={form.control} name="pagador" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del pagador / EPS *</FormLabel>
                  <FormControl><Input placeholder="Ej: EPS Sura, Nueva EPS, Compensar..." {...field} /></FormControl>
                  <FormDescription>Entidad responsable del pago de estos servicios</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nit_pagador" render={({ field }) => (
                <FormItem>
                  <FormLabel>NIT del pagador</FormLabel>
                  <FormControl><Input placeholder="Ej: 800251440-6" {...field} /></FormControl>
                  <FormDescription>Requerido para EPS. Deja vacío para particulares.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button type="submit" disabled={loadingInvoices}>
                  {loadingInvoices ? "Buscando facturas..." : <><span>Siguiente</span> <ChevronRight className="h-4 w-4 ml-1" /></>}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* ── PASO 2: Revisar registros ── */}
        {step === 2 && (
          <div className="space-y-4">
            {detectedRecords.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No se encontraron facturas emitidas en este período para este pagador. Puedes crear el lote vacío y agregar registros manualmente después.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {TIPOS_RIPS.map((t) => {
                    const c = countByType[t.value] || 0;
                    if (!c) return null;
                    return <Badge key={t.value} variant="outline" className={`${t.color} text-xs`}>{t.value}: {c} registro{c > 1 ? "s" : ""}</Badge>;
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  Revisa la clasificación de cada registro. Los tipos se detectaron automáticamente. Corrige el tipo y agrega los códigos CIE-10 si es necesario.
                </p>
              </>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {detectedRecords.map((r, i) => {
                const tipoInfo = TIPOS_RIPS.find((t) => t.value === r.tipo_archivo);
                const isEditing = editingIndex === i;
                return (
                  <Card key={i} className={cn("border transition-all", isEditing && "border-primary/50 bg-primary/5")}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <Badge variant="outline" className={`${tipoInfo?.color} text-xs shrink-0`}>{r.tipo_archivo}</Badge>
                          <span className="text-sm font-medium truncate">{r.patient_name}</span>
                          <span className="text-xs text-muted-foreground">{r.descripcion_servicio}</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setEditingIndex(isEditing ? null : i)}>
                          <Edit2 className="h-3 w-3 mr-1" />
                          {isEditing ? "Cerrar" : "Editar"}
                        </Button>
                      </div>

                      {isEditing && (
                        <div className="border-t pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            {/* Tipo */}
                            <div>
                              <label className="text-xs font-medium">Tipo RIPS *</label>
                              <select
                                className="w-full mt-1 border rounded p-1.5 text-sm bg-background"
                                value={r.tipo_archivo}
                                onChange={(e) => updateRecord(i, "tipo_archivo", e.target.value as TipoRIPS)}
                              >
                                {TIPOS_RIPS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            </div>
                            {/* CIE-10 */}
                            <div>
                              <label className="text-xs font-medium">CIE-10 diagnóstico principal</label>
                              <Input
                                className="mt-1 h-8 text-sm"
                                placeholder="Ej: J00, Z000"
                                value={r.codigo_diagnostico_principal}
                                onChange={(e) => updateRecord(i, "codigo_diagnostico_principal", e.target.value.toUpperCase())}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {/* CUPS */}
                            <div>
                              <label className="text-xs font-medium">Código CUPS</label>
                              <Input
                                className="mt-1 h-8 text-sm"
                                value={r.codigo_servicio}
                                onChange={(e) => updateRecord(i, "codigo_servicio", e.target.value)}
                              />
                            </div>
                            {/* Autorización */}
                            <div>
                              <label className="text-xs font-medium">N° Autorización EPS</label>
                              <Input
                                className="mt-1 h-8 text-sm"
                                placeholder="Si aplica"
                                value={r.numero_autorizacion}
                                onChange={(e) => updateRecord(i, "numero_autorizacion", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs font-medium">Valor servicio</label>
                              <Input
                                type="number"
                                className="mt-1 h-8 text-sm"
                                value={r.valor_total}
                                onChange={(e) => updateRecord(i, "valor_total", parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Copago</label>
                              <Input
                                type="number"
                                className="mt-1 h-8 text-sm"
                                value={r.copago}
                                onChange={(e) => updateRecord(i, "copago", parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Valor neto</label>
                              <Input type="number" className="mt-1 h-8 text-sm bg-muted" value={r.valor_neto} readOnly />
                            </div>
                          </div>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>CUPS: {r.codigo_servicio}</span>
                          <span>{r.fecha_inicio_atencion}</span>
                          <span>${r.valor_total.toLocaleString("es-CO")}</span>
                          {r.codigo_diagnostico_principal ? (
                            <span className="text-green-600">CIE-10: {r.codigo_diagnostico_principal}</span>
                          ) : (
                            <span className="text-amber-600">Sin CIE-10</span>
                          )}
                          {r.numero_autorizacion && <span>Auth: {r.numero_autorizacion}</span>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Atrás
              </Button>
              <Button onClick={() => setStep(3)}>
                Revisar y confirmar <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Confirmación ── */}
        {step === 3 && step1Data && (
          <div className="space-y-4">
            <Alert className="border-green-500/30 bg-green-500/5">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Todo listo. Revisa el resumen y confirma la creación del lote.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Pagador</p><p className="font-semibold">{step1Data.pagador}</p></div>
              <div><p className="text-muted-foreground">NIT Pagador</p><p className="font-semibold">{step1Data.nit_pagador || "—"}</p></div>
              <div><p className="text-muted-foreground">Período</p><p className="font-semibold">{format(step1Data.fecha_inicio, "dd/MM/yyyy")} → {format(step1Data.fecha_fin, "dd/MM/yyyy")}</p></div>
              <div><p className="text-muted-foreground">Total registros</p><p className="font-semibold">{detectedRecords.length}</p></div>
              <div><p className="text-muted-foreground">Valor total</p><p className="font-semibold">${detectedRecords.reduce((s, r) => s + r.valor_total, 0).toLocaleString("es-CO")} COP</p></div>
              <div>
                <p className="text-muted-foreground">Tipos incluidos</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {TIPOS_RIPS.map((t) => {
                    const c = countByType[t.value] || 0;
                    if (!c) return null;
                    return <Badge key={t.value} variant="outline" className={`${t.color} text-xs`}>{t.value}:{c}</Badge>;
                  })}
                </div>
              </div>
            </div>

            {detectedRecords.some((r) => !r.codigo_diagnostico_principal) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {detectedRecords.filter((r) => !r.codigo_diagnostico_principal).length} registro(s) sin código CIE-10. Puedes agregarlos ahora o después de crear el lote.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Atrás
              </Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando lote..." : "Crear lote RIPS"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
