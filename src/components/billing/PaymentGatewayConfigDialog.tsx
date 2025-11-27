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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const gatewayConfigSchema = z.object({
  public_key: z.string().min(1, "Llave pública requerida"),
  private_key: z.string().min(1, "Llave privada requerida"),
  merchant_id: z.string().optional(),
  is_active: z.boolean().default(false),
  is_sandbox: z.boolean().default(true),
});

type GatewayConfigFormData = z.infer<typeof gatewayConfigSchema>;

type PaymentGatewayConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gateway: {
    id: string;
    name: string;
  };
  existingConfig?: any;
};

export function PaymentGatewayConfigDialog({
  open,
  onOpenChange,
  gateway,
  existingConfig,
}: PaymentGatewayConfigDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<GatewayConfigFormData>({
    resolver: zodResolver(gatewayConfigSchema),
    defaultValues: {
      public_key: existingConfig?.public_key || "",
      private_key: existingConfig?.private_key || "",
      merchant_id: existingConfig?.merchant_id || "",
      is_active: existingConfig?.is_active || false,
      is_sandbox: existingConfig?.is_sandbox !== false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: GatewayConfigFormData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No user found");

      // Si se va a activar esta pasarela, desactivar las demás
      if (data.is_active) {
        await supabase
          .from("payment_gateway_configs")
          .update({ is_active: false })
          .eq("doctor_id", userData.user.id);
      }

      const payload: any = {
        doctor_id: userData.user.id,
        gateway_provider: gateway.id,
        ...data,
      };

      if (existingConfig) {
        const { error } = await supabase
          .from("payment_gateway_configs")
          .update(payload)
          .eq("id", existingConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payment_gateway_configs")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-config"] });
      queryClient.invalidateQueries({ queryKey: ["active-gateway"] });
      toast.success("Configuración guardada correctamente");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Error al guardar configuración: ${error.message}`);
    },
  });

  const onSubmit = (data: GatewayConfigFormData) => {
    mutation.mutate(data);
  };

  const getGatewayInstructions = () => {
    const instructions: Record<string, any> = {
      WOMPI: {
        publicLabel: "Public Key",
        privateLabel: "Private Key",
        docs: "https://docs.wompi.co/",
      },
      PAYU: {
        publicLabel: "API Key",
        privateLabel: "API Login",
        merchantLabel: "Merchant ID",
        docs: "https://developers.payulatam.com/",
      },
      EPAYCO: {
        publicLabel: "Public Key",
        privateLabel: "Private Key",
        docs: "https://docs.epayco.co/",
      },
    };
    return instructions[gateway.id] || instructions.WOMPI;
  };

  const instructions = getGatewayInstructions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar {gateway.name}</DialogTitle>
          <DialogDescription>
            Ingresa las credenciales de tu cuenta de {gateway.name}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Obtén tus credenciales en el panel de {gateway.name}.{" "}
            <a
              href={instructions.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Ver documentación
            </a>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="public_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{instructions.publicLabel}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder={`pub_test_...`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="private_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{instructions.privateLabel}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={`prv_test_...`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {instructions.merchantLabel && (
              <FormField
                control={form.control}
                name="merchant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{instructions.merchantLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="is_sandbox"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Modo Sandbox</FormLabel>
                      <FormDescription>
                        Activa para usar el entorno de pruebas (recomendado)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Activar esta pasarela
                      </FormLabel>
                      <FormDescription>
                        Solo una pasarela puede estar activa a la vez
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
