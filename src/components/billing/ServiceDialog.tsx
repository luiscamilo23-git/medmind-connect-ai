import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect } from "react";

const serviceSchema = z.object({
  nombre_servicio: z.string().min(1, "Nombre requerido"),
  codigo_cups: z.string().optional(),
  precio_unitario: z.coerce.number().min(0, "Precio debe ser positivo"),
  tipo_servicio: z.enum([
    "CONSULTA",
    "PROCEDIMIENTO",
    "CIRUGIA",
    "LABORATORIO",
    "IMAGENES",
    "TERAPIA",
    "MEDICAMENTO",
    "OTRO",
  ]),
  impuestos_aplican: z.boolean().default(false),
  porcentaje_impuesto: z.coerce.number().min(0).max(100).default(0),
  activo: z.boolean().default(true),
  descripcion: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

type ServiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: {
    id: string;
    nombre_servicio: string;
    codigo_cups: string | null;
    precio_unitario: number;
    tipo_servicio: string;
    impuestos_aplican: boolean;
    porcentaje_impuesto: number;
    activo: boolean;
    descripcion: string | null;
  } | null;
};

export function ServiceDialog({ open, onOpenChange, service }: ServiceDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      nombre_servicio: "",
      codigo_cups: "",
      precio_unitario: 0,
      tipo_servicio: "CONSULTA",
      impuestos_aplican: false,
      porcentaje_impuesto: 0,
      activo: true,
      descripcion: "",
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        nombre_servicio: service.nombre_servicio,
        codigo_cups: service.codigo_cups || "",
        precio_unitario: service.precio_unitario,
        tipo_servicio: service.tipo_servicio as any,
        impuestos_aplican: service.impuestos_aplican,
        porcentaje_impuesto: service.porcentaje_impuesto,
        activo: service.activo,
        descripcion: service.descripcion || "",
      });
    } else {
      form.reset({
        nombre_servicio: "",
        codigo_cups: "",
        precio_unitario: 0,
        tipo_servicio: "CONSULTA",
        impuestos_aplican: false,
        porcentaje_impuesto: 0,
        activo: true,
        descripcion: "",
      });
    }
  }, [service, form]);

  const mutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No user found");

      const payload: any = {
        nombre_servicio: data.nombre_servicio,
        codigo_cups: data.codigo_cups || null,
        precio_unitario: data.precio_unitario,
        tipo_servicio: data.tipo_servicio,
        impuestos_aplican: data.impuestos_aplican,
        porcentaje_impuesto: data.porcentaje_impuesto,
        activo: data.activo,
        descripcion: data.descripcion || null,
        doctor_id: userData.user.id,
      };

      if (service) {
        const { error } = await supabase
          .from("services")
          .update(payload)
          .eq("id", service.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(service ? "Servicio actualizado" : "Servicio creado");
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast.error("Error al guardar servicio");
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {service ? "Editar Servicio" : "Nuevo Servicio"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre_servicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Servicio</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Consulta General" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo_cups"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código CUPS (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="890201" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_servicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Servicio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CONSULTA">Consulta</SelectItem>
                        <SelectItem value="PROCEDIMIENTO">Procedimiento</SelectItem>
                        <SelectItem value="CIRUGIA">Cirugía</SelectItem>
                        <SelectItem value="LABORATORIO">Laboratorio</SelectItem>
                        <SelectItem value="IMAGENES">Imágenes</SelectItem>
                        <SelectItem value="TERAPIA">Terapia</SelectItem>
                        <SelectItem value="MEDICAMENTO">Medicamento</SelectItem>
                        <SelectItem value="OTRO">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="precio_unitario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio Unitario (COP)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between space-x-4">
              <FormField
                control={form.control}
                name="impuestos_aplican"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormLabel>Aplicar Impuestos</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("impuestos_aplican") && (
                <FormField
                  control={form.control}
                  name="porcentaje_impuesto"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>% IVA</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="19" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales del servicio..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormLabel>Servicio Activo</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {mutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
