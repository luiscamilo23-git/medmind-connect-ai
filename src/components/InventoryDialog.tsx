import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InventoryItem } from "@/pages/SupplyLens";

const inventorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(200),
  description: z.string().trim().max(500).optional(),
  category: z.enum(["medication", "equipment", "surgical", "diagnostic", "disposable", "other"]),
  current_stock: z.coerce.number().min(0, "El stock debe ser mayor o igual a 0"),
  minimum_stock: z.coerce.number().min(0, "El stock mínimo debe ser mayor o igual a 0"),
  unit_cost: z.coerce.number().min(0).optional(),
  unit_price: z.coerce.number().min(0).optional(),
  sku: z.string().trim().max(100).optional(),
  supplier: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).optional(),
  expiration_date: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

const InventoryDialog = ({ open, onOpenChange, item }: InventoryDialogProps) => {
  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: "",
      description: "",
      category: "other",
      current_stock: 0,
      minimum_stock: 0,
      unit_cost: 0,
      unit_price: 0,
      sku: "",
      supplier: "",
      location: "",
      expiration_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        description: item.description || "",
        category: item.category as any,
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock,
        unit_cost: item.unit_cost || 0,
        unit_price: item.unit_price || 0,
        sku: item.sku || "",
        supplier: item.supplier || "",
        location: item.location || "",
        expiration_date: item.expiration_date || "",
        notes: item.notes || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        category: "other",
        current_stock: 0,
        minimum_stock: 0,
        unit_cost: 0,
        unit_price: 0,
        sku: "",
        supplier: "",
        location: "",
        expiration_date: "",
        notes: "",
      });
    }
  }, [item, open, form]);

  const onSubmit = async (data: InventoryFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const inventoryData = {
        doctor_id: user.id,
        name: data.name,
        description: data.description || null,
        category: data.category,
        current_stock: data.current_stock,
        minimum_stock: data.minimum_stock,
        unit_cost: data.unit_cost || null,
        unit_price: data.unit_price || null,
        sku: data.sku || null,
        supplier: data.supplier || null,
        location: data.location || null,
        expiration_date: data.expiration_date || null,
        notes: data.notes || null,
        last_restock_date: new Date().toISOString(),
      };

      if (item) {
        const { error } = await supabase
          .from("inventory")
          .update(inventoryData)
          .eq("id", item.id);

        if (error) throw error;
        toast.success("Item actualizado correctamente");
      } else {
        const { error } = await supabase
          .from("inventory")
          .insert([inventoryData]);

        if (error) throw error;
        toast.success("Item agregado correctamente");
      }

      onOpenChange(true);
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Error al guardar el item");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar Item" : "Agregar Nuevo Item"}
          </DialogTitle>
          <DialogDescription>
            {item
              ? "Actualiza la información del item en el inventario"
              : "Completa los datos para agregar un nuevo item al inventario"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Guantes de látex" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="medication">Medicamento</SelectItem>
                        <SelectItem value="equipment">Equipo</SelectItem>
                        <SelectItem value="surgical">Quirúrgico</SelectItem>
                        <SelectItem value="diagnostic">Diagnóstico</SelectItem>
                        <SelectItem value="disposable">Desechable</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Código del producto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción del item"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Actual *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minimum_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Mínimo *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo Unitario</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Unitario</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del proveedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Estante A3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiration_date"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Fecha de Vencimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {item ? "Actualizar" : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryDialog;
