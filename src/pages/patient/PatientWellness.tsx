import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Check, AlertCircle, Info, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WellnessTip {
  id: string;
  tip_type: string;
  title: string;
  content: string;
  priority: string;
  is_read: boolean;
  created_at: string;
}

const PatientWellness = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tips, setTips] = useState<WellnessTip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTips();
  }, []);

  const loadTips = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("ai_wellness_tips")
        .select("*")
        .eq("patient_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTips(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (tipId: string) => {
    try {
      const { error } = await supabase
        .from("ai_wellness_tips")
        .update({ is_read: true })
        .eq("id", tipId);

      if (error) throw error;

      setTips(tips.map((tip) => (tip.id === tipId ? { ...tip, is_read: true } : tip)));

      toast({
        title: "Marcado como leído",
        description: "El consejo ha sido marcado como leído",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "medium":
        return <Info className="h-5 w-5 text-yellow-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-500 bg-red-500/10";
      case "medium":
        return "border-yellow-500 bg-yellow-500/10";
      default:
        return "border-blue-500 bg-blue-500/10";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patient/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Bienestar IA
            </h1>
            <p className="text-muted-foreground">Recomendaciones personalizadas para tu salud</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando recomendaciones...</div>
        ) : tips.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay recomendaciones aún</h3>
              <p className="text-muted-foreground">
                A medida que uses la plataforma, recibirás consejos personalizados basados en tu historial.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-500">
                    {tips.filter((t) => t.priority === "high" && !t.is_read).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Prioridad Alta</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-500">
                    {tips.filter((t) => t.priority === "medium" && !t.is_read).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Prioridad Media</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">
                    {tips.filter((t) => t.is_read).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Leídos</div>
                </CardContent>
              </Card>
            </div>

            {tips.map((tip) => (
              <Card
                key={tip.id}
                className={`border-l-4 transition-all ${getPriorityColor(tip.priority)} ${
                  tip.is_read ? "opacity-60" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getPriorityIcon(tip.priority)}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {tip.title}
                          {tip.is_read && (
                            <Badge variant="secondary" className="ml-2">
                              Leído
                            </Badge>
                          )}
                        </CardTitle>
                        <Badge variant="outline" className="mt-2">
                          {tip.tip_type}
                        </Badge>
                      </div>
                    </div>
                    {!tip.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(tip.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Marcar como leído
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{tip.content}</p>
                  <div className="text-xs text-muted-foreground mt-4">
                    {new Date(tip.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientWellness;
