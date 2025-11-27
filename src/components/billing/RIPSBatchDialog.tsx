import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ripsBatchSchema = z.object({
  fecha_inicio: z.date({
    required_error: "Fecha de inicio requerida",
  }),
  fecha_fin: z.date({
    required_error: "Fecha de fin requerida",
  }),
  pagador: z.string().min(1, "Nombre del pagador requerido"),
  nit_pagador: z.string().optional(),
}).refine((data) => data.fecha_fin >= data.fecha_inicio, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["fecha_fin"],
});

type RIPSBatchFormData = z.infer<typeof ripsBatchSchema>;

type RIPSBatchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RIPSBatchDialog({ open, onOpenChange }: RIPSBatchDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<RIPSBatchFormData>({
    resolver: zodResolver(ripsBatchSchema),
    defaultValues: {
      pagador: "",
      nit_pagador: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RIPSBatchFormData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No user found");

      // Fetch invoices in the date range to populate RIPS
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select(`
          *,
          patients(*),
          invoice_items(*, services(*))
        `)
        .eq("doctor_id", userData.user.id)
        .eq("estado", "EMITIDA")
        .gte("fecha_emision", format(data.fecha_inicio, "yyyy-MM-dd"))
        .lte("fecha_emision", format(data.fecha_fin, "yyyy-MM-dd"));

      if (invoicesError) throw invoicesError;

      // Create the RIPS batch
      const { data: batch, error: batchError } = await supabase
        .from("rips_batches")
        .insert([{
          doctor_id: userData.user.id,
          fecha_inicio: format(data.fecha_inicio, "yyyy-MM-dd"),
          fecha_fin: format(data.fecha_fin, "yyyy-MM-dd"),
          pagador: data.pagador,
          nit_pagador: data.nit_pagador || null,
          estado: "DRAFT",
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      // Create RIPS records from invoices
      if (invoices && invoices.length > 0) {
        const ripsRecords = invoices.flatMap((invoice: any) => 
          invoice.invoice_items.map((item: any) => ({
            rips_batch_id: batch.id,
            invoice_id: invoice.id,
            patient_id: invoice.patient_id,
            tipo_archivo: item.services?.tipo_servicio === "CONSULTA" ? "AC" : "AP",
            codigo_servicio: item.codigo_cups || "890201",
            descripcion_servicio: item.descripcion,
            fecha_inicio_atencion: invoice.fecha_emision,
            fecha_fin_atencion: invoice.fecha_emision,
            valor_total: parseFloat(item.total_linea),
            copago: 0,
            valor_neto: parseFloat(item.total_linea),
            datos_json: {
              numeroDocumentoIdentificacion: invoice.patients.phone || "0",
              tipoDocumentoIdentificacion: "CC",
              codigoConsulta: item.codigo_cups || "890201",
              finalidadConsulta: "10",
              causaMotivoAtencion: "01",
              codDiagnosticoPrincipal: "Z000",
              codDiagnosticoRelacionado1: null,
              tipoDiagnosticoPrincipal: "1",
              valorConsulta: parseFloat(item.total_linea),
            },
          }))
        );

        const { error: recordsError } = await supabase
          .from("rips_records")
          .insert(ripsRecords);

        if (recordsError) throw recordsError;
      }

      return batch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rips-batches"] });
      toast.success("Lote RIPS creado correctamente");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(`Error al crear lote RIPS: ${error.message}`);
    },
  });

  const onSubmit = (data: RIPSBatchFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo Lote RIPS</DialogTitle>
          <DialogDescription>
            Genera un lote de RIPS en formato JSON para el período especificado.
            Se incluirán todas las facturas emitidas en este rango de fechas.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fecha_inicio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Inicio</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("2020-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_fin"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("2020-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pagador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Pagador</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: EPS Sura, Nueva EPS, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    Entidad responsable del pago (EPS, ARL, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nit_pagador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIT del Pagador (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 800123456-7" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creando..." : "Crear Lote"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
