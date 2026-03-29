import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Check, CreditCard, Calendar, AlertTriangle, Zap, Star, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionData {
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  plan: {
    name: string;
    display_name: string;
    price_cop: number;
  } | null;
}

const planIcons: Record<string, React.ElementType> = {
  starter: Zap,
  profesional: Star,
  clinica: Building2,
};

const planColors: Record<string, string> = {
  starter: "text-blue-500",
  profesional: "text-primary",
  clinica: "text-violet-500",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  trial: { label: "Período de prueba", color: "bg-amber-500/20 text-amber-600 border-amber-500/30" },
  active: { label: "Activo", color: "bg-primary/20 text-primary border-primary/30" },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-600 border-red-500/30" },
  past_due: { label: "Pago pendiente", color: "bg-red-500/20 text-red-600 border-red-500/30" },
  expired: { label: "Expirado", color: "bg-gray-500/20 text-gray-600 border-gray-500/30" },
};

export default function Subscription() {
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      toast({ title: "¡Pago exitoso!", description: "Tu suscripción ha sido activada." });
    } else if (status === "pending") {
      toast({ title: "Pago pendiente", description: "Recibirás confirmación por email cuando se procese." });
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data } = await supabase
        .from("subscriptions")
        .select("status, trial_ends_at, current_period_end, subscription_plans(name, display_name, price_cop)")
        .eq("doctor_id", session.user.id)
        .maybeSingle();

      if (data) {
        setSub({
          status: data.status,
          trial_ends_at: data.trial_ends_at,
          current_period_end: data.current_period_end,
          plan: (data.subscription_plans as any) ?? null,
        });
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleUpgrade = async () => {
    if (!sub?.plan) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("create-mercadopago-subscription", {
        body: { plan_id: sub.plan.name, plan_name: sub.plan.display_name },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || !data?.init_point) throw new Error(error?.message || "No se pudo iniciar el pago");

      window.location.href = data.sandbox_init_point || data.init_point;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : "—";

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(p);

  const daysLeft = (d: string | null) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>;

  const PlanIcon = sub?.plan ? (planIcons[sub.plan.name] ?? Star) : Star;
  const iconColor = sub?.plan ? (planColors[sub.plan.name] ?? "text-primary") : "text-primary";
  const statusInfo = sub ? (statusLabels[sub.status] ?? { label: sub.status, color: "" }) : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur px-6 h-16 flex items-center gap-4">
            <SidebarTrigger className="-ml-2" />
            <h1 className="font-bold text-lg">Mi Suscripción</h1>
          </header>

          <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
            {!sub ? (
              <Card>
                <CardContent className="pt-6 text-center space-y-4">
                  <p className="text-muted-foreground">No tienes una suscripción activa.</p>
                  <Button onClick={() => navigate("/pricing")}>Ver planes</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Current plan card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <PlanIcon className={`w-6 h-6 ${iconColor}`} />
                      <span>Plan {sub.plan?.display_name ?? "—"}</span>
                      {statusInfo && (
                        <Badge className={`ml-auto ${statusInfo.color}`}>{statusInfo.label}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground text-xs">Precio</p>
                          <p className="font-semibold">
                            {sub.plan ? formatPrice(sub.plan.price_cop) : "—"}/mes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground text-xs">
                            {sub.status === "trial" ? "Prueba vence" : "Próximo cobro"}
                          </p>
                          <p className="font-semibold">
                            {formatDate(sub.status === "trial" ? sub.trial_ends_at : sub.current_period_end)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {sub.status === "trial" && (() => {
                      const days = daysLeft(sub.trial_ends_at);
                      return days !== null && days <= 5 ? (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          {days === 0
                            ? "Tu prueba vence hoy."
                            : `Tu prueba vence en ${days} día${days === 1 ? "" : "s"}.`}
                        </div>
                      ) : null;
                    })()}

                    {(sub.status === "trial" || sub.status === "past_due") && (
                      <Button onClick={handleUpgrade} className="w-full bg-primary hover:bg-primary/90">
                        <Check className="w-4 h-4 mr-2" />
                        {sub.status === "trial" ? "Activar plan ahora" : "Regularizar pago"}
                      </Button>
                    )}

                    {sub.status === "active" && (
                      <p className="text-xs text-muted-foreground text-center">
                        Para cambiar o cancelar tu plan, contáctanos en soporte@medmindsystem.com
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Change plan */}
                {sub.status !== "active" && (
                  <div className="text-center">
                    <Button variant="outline" onClick={() => navigate("/pricing")}>
                      Ver todos los planes
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
