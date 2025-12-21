import React from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, Bell, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaymentGatewayCard } from "@/components/billing/PaymentGatewayCard";

const GATEWAYS = [
  {
    id: "WOMPI",
    name: "Wompi",
    description: "Pasarela colombiana moderna y fácil de usar",
    logo: "https://wompi.com/assets/logo.svg",
    features: ["PSE", "Tarjetas", "Nequi", "Daviplata"],
  },
  {
    id: "PAYU",
    name: "PayU",
    description: "Líder en pagos en línea en Latinoamérica",
    logo: "https://www.payu.com/wp-content/uploads/2021/06/PayU-Logo.svg",
    features: ["PSE", "Tarjetas", "Efectivo", "Internacional"],
  },
  {
    id: "EPAYCO",
    name: "ePayco",
    description: "Solución completa de pagos para Colombia",
    logo: "https://multimedia.epayco.co/epayco-landing/logos/logo-epayco.svg",
    features: ["PSE", "Tarjetas", "Efectivo", "Corresponsales"],
  },
];

export default function BillingSettings() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
            <h1 className="text-2xl font-bold bg-gradient-feature-soft bg-clip-text text-transparent">Configuración de Pagos</h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto space-y-6">
              <Alert>
                <AlertTitle>Elige tu pasarela de pagos</AlertTitle>
                <AlertDescription>
                  Selecciona y configura la pasarela de pagos que prefieras usar.
                  Solo puedes tener una pasarela activa a la vez.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {GATEWAYS.map((gateway) => (
                  <PaymentGatewayCard key={gateway.id} gateway={gateway} />
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Información Importante</CardTitle>
                  <CardDescription>
                    Consideraciones sobre las pasarelas de pago
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">
                    <strong>🔒 Seguridad:</strong> Tus credenciales se almacenan de forma segura y encriptada.
                  </p>
                  <p className="text-sm">
                    <strong>🧪 Modo Sandbox:</strong> Activa el modo de pruebas para testear sin transacciones reales.
                  </p>
                  <p className="text-sm">
                    <strong>💳 Comisiones:</strong> Cada pasarela tiene su estructura de comisiones. Consúltalas en sus sitios oficiales.
                  </p>
                  <p className="text-sm">
                    <strong>🔗 Webhooks:</strong> Los webhooks se configuran automáticamente para recibir notificaciones de pago.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
