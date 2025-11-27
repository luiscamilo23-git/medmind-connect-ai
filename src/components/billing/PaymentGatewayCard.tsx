import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PaymentGatewayConfigDialog } from "./PaymentGatewayConfigDialog";

type Gateway = {
  id: string;
  name: string;
  description: string;
  logo: string;
  features: string[];
};

type PaymentGatewayCardProps = {
  gateway: Gateway;
};

export function PaymentGatewayCard({ gateway }: PaymentGatewayCardProps) {
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["gateway-config", gateway.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_gateway_configs")
        .select("*")
        .eq("gateway_provider", gateway.id as any)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <Card className={config?.is_active ? "border-primary" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {gateway.name}
              {config?.is_active && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Activa
                </Badge>
              )}
            </CardTitle>
          </div>
          <CardDescription>{gateway.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {gateway.features.map((feature) => (
              <Badge key={feature} variant="secondary">
                {feature}
              </Badge>
            ))}
          </div>

          {config && (
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">
                Estado: {config.is_sandbox ? "🧪 Sandbox" : "✅ Producción"}
              </p>
            </div>
          )}

          <Button
            className="w-full"
            variant={config?.is_active ? "default" : "outline"}
            onClick={() => setIsConfigDialogOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {config ? "Configurar" : "Activar"}
          </Button>
        </CardContent>
      </Card>

      <PaymentGatewayConfigDialog
        open={isConfigDialogOpen}
        onOpenChange={setIsConfigDialogOpen}
        gateway={gateway}
        existingConfig={config}
      />
    </>
  );
}
