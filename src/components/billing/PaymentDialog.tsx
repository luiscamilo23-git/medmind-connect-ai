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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const paymentSchema = z.object({
  invoice_id: z.string().min(1, "Selecciona una factura"),
  monto: z.coerce.number().min(0, "Monto debe ser positivo"),
  metodo_pago: z.enum([
    "EFECTIVO",
    "TARJETA_CREDITO",
    "TARJETA_DEBITO",
    "TRANSFERENCIA",
    "PSE",
    "NEQUI",
    "DAVIPLATA",
    "OTRO",
  ]),
  transaction_ref: z.string().optional(),
  notas: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

type PaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gatewayConfig?: any;
};

export function PaymentDialog({ open, onOpenChange, gatewayConfig }: PaymentDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      metodo_pago: "EFECTIVO",
      transaction_ref: "",
      notas: "",
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ["unpaid-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, numero_factura_dian, total, patients(full_name)")
        .in("payment_status", ["PENDIENTE", "PARCIAL"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No user found");

      const payload: any = {
        invoice_id: data.invoice_id,
        doctor_id: userData.user.id,
        monto: data.monto,
        metodo_pago: data.metodo_pago,
        estado: "APROBADO",
        gateway_provider: gatewayConfig?.gateway_provider || "MANUAL",
        transaction_ref: data.transaction_ref || null,
        notas: data.notas || null,
        fecha_aprobacion: new Date().toISOString(),
      };

      const { error } = await supabase.from("payments").insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Pago registrado correctamente");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(`Error al registrar pago: ${error.message}`);
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Registra un pago recibido para una factura pendiente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="invoice_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Factura</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una factura" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {invoices?.map((invoice: any) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.numero_factura_dian || `Factura ${invoice.id.slice(0, 8)}`} - 
                          {invoice.patients.full_name} - 
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                          }).format(invoice.total)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto (COP)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metodo_pago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                        <SelectItem value="TARJETA_CREDITO">Tarjeta Crédito</SelectItem>
                        <SelectItem value="TARJETA_DEBITO">Tarjeta Débito</SelectItem>
                        <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                        <SelectItem value="PSE">PSE</SelectItem>
                        <SelectItem value="NEQUI">Nequi</SelectItem>
                        <SelectItem value="DAVIPLATA">Daviplata</SelectItem>
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
              name="transaction_ref"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia de Transacción (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Recibo #12345, Transf. 67890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Información adicional sobre el pago..."
                      {...field}
                    />
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
                {mutation.isPending ? "Registrando..." : "Registrar Pago"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
