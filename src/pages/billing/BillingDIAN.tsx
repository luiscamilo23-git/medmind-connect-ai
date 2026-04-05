import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LogOut, Bell, User, Settings, Send, Star, Zap, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DIANProviderConfigDialog } from "@/components/billing/DIANProviderConfigDialog";
import { DIANSoftwarePropioSetup } from "@/components/billing/DIANSoftwarePropioSetup";
import { supabase } from "@/integrations/supabase/client";

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
  const [showSoftwarePropio, setShowSoftwarePropio] = useState(false);
  const [softwarePropioConfig, setSoftwarePropioConfig] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("dian_software_config").select("*").eq("doctor_id", user.id).maybeSingle()
        .then(({ data }) => { if (data) setSoftwarePropioConfig(data); });
    });
  }, []);

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
            <h1 className="text-2xl font-bold bg-gradient-feature-soft bg-clip-text text-transparent">Configuración DIAN</h1>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/billing/monitoring")}>
                <Send className="h-4 w-4 mr-2" />
                Ver Monitoreo
              </Button>
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

              {/* MEDMIND DIAN Directo — opción principal */}
              <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-background shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          MEDMIND DIAN Directo
                          <Badge variant="default" className="ml-2 text-xs">Recomendado</Badge>
                          {softwarePropioConfig && (
                            <Badge variant="outline" className="ml-1 text-xs text-green-600 border-green-500">
                              ✓ Configurado
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          MEDMIND actúa como tu motor de facturación — sin terceros, sin costos adicionales
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">CUFE SHA-384</p>
                        <p className="text-xs text-muted-foreground">Calculado localmente, verificado por DIAN</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Firma Digital X.509</p>
                        <p className="text-xs text-muted-foreground">Con tu certificado de Certicámara/GSE</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">SOAP Directo a DIAN</p>
                        <p className="text-xs text-muted-foreground">SendBillSync sin intermediarios</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full md:w-auto"
                    onClick={() => setShowSoftwarePropio(true)}
                  >
                    {softwarePropioConfig ? "Editar configuración" : "Configurar Software Propio"}
                  </Button>
                </CardContent>
              </Card>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertTitle>Alternativas de terceros</AlertTitle>
                <AlertDescription>
                  Si aún no tienes tu NIT habilitado ante la DIAN o tu certificado X.509, puedes usar uno
                  de los proveedores tecnológicos autorizados mientras completas el proceso.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DIAN_PROVIDERS.map((provider) => (
                  <Card key={provider.id} className="hover:shadow-lg transition-shadow opacity-90">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <img
                          src={provider.logo}
                          alt={provider.name}
                          className="h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const span = document.createElement("span");
                            span.className = "text-base font-bold text-primary";
                            span.textContent = provider.name;
                            e.currentTarget.parentNode?.appendChild(span);
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

      <Dialog open={showSoftwarePropio} onOpenChange={setShowSoftwarePropio}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar MEDMIND DIAN Directo</DialogTitle>
          </DialogHeader>
          <DIANSoftwarePropioSetup
            existingConfig={softwarePropioConfig}
            onSaved={() => {
              setShowSoftwarePropio(false);
              supabase.auth.getUser().then(({ data: { user } }) => {
                if (!user) return;
                supabase.from("dian_software_config").select("*").eq("doctor_id", user.id).maybeSingle()
                  .then(({ data }) => { if (data) setSoftwarePropioConfig(data); });
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
