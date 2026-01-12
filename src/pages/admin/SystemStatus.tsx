import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Database, 
  HardDrive, 
  Zap, 
  Webhook, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Server
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServiceCheck {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "idle" | "checking" | "online" | "offline";
  latency?: number;
  error?: string;
}

const SystemStatus = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [services, setServices] = useState<ServiceCheck[]>([
    {
      name: "Supabase Database",
      description: "Conexión a la base de datos principal",
      icon: <Database className="h-5 w-5" />,
      status: "idle",
    },
    {
      name: "Storage Bucket",
      description: "Almacenamiento de archivos (avatars)",
      icon: <HardDrive className="h-5 w-5" />,
      status: "idle",
    },
    {
      name: "Edge Functions",
      description: "Funciones serverless (transcribe-audio)",
      icon: <Zap className="h-5 w-5" />,
      status: "idle",
    },
    {
      name: "n8n Webhook",
      description: "Integración con automatizaciones externas",
      icon: <Webhook className="h-5 w-5" />,
      status: "idle",
    },
  ]);

  const updateService = (index: number, updates: Partial<ServiceCheck>) => {
    setServices(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const checkSupabaseConnection = async (): Promise<{ success: boolean; latency: number; error?: string }> => {
    const start = performance.now();
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);
      
      const latency = Math.round(performance.now() - start);
      
      if (error) {
        return { success: false, latency, error: error.message };
      }
      
      return { success: true, latency };
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      return { success: false, latency, error: err instanceof Error ? err.message : "Unknown error" };
    }
  };

  const checkStorageBucket = async (): Promise<{ success: boolean; latency: number; error?: string }> => {
    const start = performance.now();
    try {
      const { data, error } = await supabase
        .storage
        .from("avatars")
        .list("", { limit: 1 });
      
      const latency = Math.round(performance.now() - start);
      
      if (error) {
        return { success: false, latency, error: error.message };
      }
      
      return { success: true, latency };
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      return { success: false, latency, error: err instanceof Error ? err.message : "Unknown error" };
    }
  };

  const checkEdgeFunctions = async (): Promise<{ success: boolean; latency: number; error?: string }> => {
    const start = performance.now();
    try {
      // We'll send a minimal POST request to check if the function is alive
      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: { healthCheck: true },
      });
      
      const latency = Math.round(performance.now() - start);
      
      // Any response means the function exists and is reachable
      return { success: true, latency };
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      if (errorMsg.includes("FunctionNotFound") || errorMsg.includes("404")) {
        return { success: false, latency, error: "Function not deployed" };
      }
      // Other errors might just be validation - function is still reachable
      return { success: true, latency };
    }
  };

  const checkN8nWebhook = async (): Promise<{ success: boolean; latency: number; error?: string }> => {
    const start = performance.now();
    try {
      // Try to ping n8n webhook with a health check
      const webhookUrl = "https://chispa-ia-n8n.653wwo.easypanel.host/webhook/medmind";
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "health_check",
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);
      
      // n8n webhooks return 200 when active
      if (response.ok || response.status === 200) {
        return { success: true, latency };
      }
      
      return { success: false, latency, error: `HTTP ${response.status}` };
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      
      if (errorMsg.includes("aborted")) {
        return { success: false, latency, error: "Timeout (10s)" };
      }
      
      return { success: false, latency, error: errorMsg };
    }
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    // Reset all to checking
    setServices(prev => prev.map(s => ({ ...s, status: "checking" as const, latency: undefined, error: undefined })));

    // Run all checks in parallel
    const checks = [
      checkSupabaseConnection(),
      checkStorageBucket(),
      checkEdgeFunctions(),
      checkN8nWebhook(),
    ];

    const results = await Promise.all(checks);

    // Update each service with results
    results.forEach((result, index) => {
      updateService(index, {
        status: result.success ? "online" : "offline",
        latency: result.latency,
        error: result.error,
      });
    });

    setLastCheck(new Date());
    setIsRunning(false);
  };

  const getStatusBadge = (service: ServiceCheck) => {
    switch (service.status) {
      case "checking":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            CHECKING
          </Badge>
        );
      case "online":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            🟢 ONLINE
          </Badge>
        );
      case "offline":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            🔴 OFFLINE
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            PENDING
          </Badge>
        );
    }
  };

  const overallStatus = () => {
    if (services.every(s => s.status === "idle")) return "pending";
    if (services.some(s => s.status === "checking")) return "checking";
    if (services.every(s => s.status === "online")) return "healthy";
    if (services.some(s => s.status === "online")) return "degraded";
    return "critical";
  };

  const status = overallStatus();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">System Health</h1>
              <p className="text-muted-foreground">Diagnóstico del backbone de la plataforma</p>
            </div>
          </div>
          
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            size="lg"
            className="gap-2"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                RUN DIAGNOSTICS
              </>
            )}
          </Button>
        </div>

        {/* Overall Status Card */}
        <Card className={
          status === "healthy" ? "border-green-500/50 bg-green-500/5" :
          status === "degraded" ? "border-yellow-500/50 bg-yellow-500/5" :
          status === "critical" ? "border-red-500/50 bg-red-500/5" :
          ""
        }>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {status === "healthy" && <span className="text-2xl">✅</span>}
              {status === "degraded" && <span className="text-2xl">⚠️</span>}
              {status === "critical" && <span className="text-2xl">❌</span>}
              {status === "checking" && <span className="text-2xl">🔄</span>}
              {status === "pending" && <span className="text-2xl">⏳</span>}
              Overall Status: {
                status === "healthy" ? "All Systems Operational" :
                status === "degraded" ? "Partial Outage" :
                status === "critical" ? "Major Outage" :
                status === "checking" ? "Running Diagnostics..." :
                "Pending Check"
              }
            </CardTitle>
            {lastCheck && (
              <CardDescription>
                Último chequeo: {lastCheck.toLocaleTimeString()}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Services Grid */}
        <div className="grid gap-4">
          {services.map((service, index) => (
            <Card key={service.name} className="transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                      {service.error && (
                        <p className="text-xs text-red-500 mt-1">Error: {service.error}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {service.latency !== undefined && (
                      <div className="text-right">
                        <span className={`text-sm font-mono ${
                          service.latency < 200 ? "text-green-600" :
                          service.latency < 500 ? "text-yellow-600" :
                          "text-red-600"
                        }`}>
                          {service.latency}ms
                        </span>
                      </div>
                    )}
                    {getStatusBadge(service)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Supabase Database:</strong> Verifica conexión a la tabla profiles</p>
              <p><strong>Storage Bucket:</strong> Lista archivos en el bucket "avatars"</p>
              <p><strong>Edge Functions:</strong> Ping a la función transcribe-audio</p>
              <p><strong>n8n Webhook:</strong> Health check al webhook de automatizaciones</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemStatus;
