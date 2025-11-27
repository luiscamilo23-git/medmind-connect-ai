import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, Bell, User, Settings } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DIANProviderConfigDialog } from "@/components/billing/DIANProviderConfigDialog";

const DIAN_PROVIDERS = [
  {
    id: "ALEGRA",
    name: "Alegra",
    description: "Plataforma completa de facturación y contabilidad",
    logo: "https://www.alegra.com/assets/img/alegra-logo.svg",
    features: ["Facturación Electrónica", "Contabilidad", "Inventarios", "Nómina"],
    website: "https://www.alegra.com",
  },
  {
    id: "SIIGO",
    name: "Siigo",
    description: "Software empresarial líder en Colombia",
    logo: "https://www.siigo.com/wp-content/uploads/2021/03/logo-siigo.svg",
    features: ["Facturación DIAN", "Contabilidad", "POS", "Nómina"],
    website: "https://www.siigo.com",
  },
  {
    id: "ALANUBE",
    name: "Alanube",
    description: "Solución en la nube para facturación electrónica",
    logo: "https://alanube.co/wp-content/uploads/2020/01/logo-alanube.png",
    features: ["Factura Electrónica", "Nómina Electrónica", "Documento Soporte", "API REST"],
    website: "https://alanube.co",
  },
];

export default function BillingDIAN() {
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState<{ id: string; name: string } | null>(null);

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
            <h1 className="text-2xl font-bold">Configuración DIAN</h1>
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
                <Settings className="h-4 w-4" />
                <AlertTitle>Proveedor Tecnológico DIAN</AlertTitle>
                <AlertDescription>
                  Para emitir facturas electrónicas válidas ante la DIAN, debes configurar un proveedor
                  tecnológico autorizado. Elige el que mejor se adapte a tus necesidades.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DIAN_PROVIDERS.map((provider) => (
                  <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <img 
                          src={provider.logo} 
                          alt={provider.name}
                          className="h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/150x50?text=" + provider.name;
                          }}
                        />
                      </div>
                      <CardTitle>{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Características:</p>
                          <ul className="text-sm space-y-1">
                            {provider.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-primary">✓</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => setSelectedProvider(provider)}
                        >
                          Configurar {provider.name}
                        </Button>
                        <Button 
                          className="w-full" 
                          variant="ghost"
                          onClick={() => window.open(provider.website, "_blank")}
                        >
                          Visitar sitio web
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>¿Cómo funciona?</CardTitle>
                  <CardDescription>
                    Pasos para habilitar la facturación electrónica
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Crea una cuenta</p>
                      <p className="text-sm text-muted-foreground">
                        Regístrate en el proveedor de tu elección y obtén tus credenciales de API
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Configura en MEDMIND</p>
                      <p className="text-sm text-muted-foreground">
                        Ingresa tu API Key y configura los datos de tu empresa (NIT, nombre, etc.)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Prueba en Sandbox</p>
                      <p className="text-sm text-muted-foreground">
                        Usa el modo de pruebas para verificar que todo funcione correctamente
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Emite facturas reales</p>
                      <p className="text-sm text-muted-foreground">
                        Activa el modo producción y comienza a emitir facturas electrónicas válidas ante la DIAN
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {selectedProvider && (
        <DIANProviderConfigDialog
          open={!!selectedProvider}
          onOpenChange={(open) => !open && setSelectedProvider(null)}
          provider={selectedProvider}
        />
      )}
    </SidebarProvider>
  );
}
