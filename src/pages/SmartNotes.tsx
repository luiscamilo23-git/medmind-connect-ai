import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  Bell,
  Loader2,
  BrainCircuit
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const SmartNotes = () => {
  const [notes, setNotes] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [includeReminders, setIncludeReminders] = useState(true);
  const [analysis, setAnalysis] = useState<{
    tasks: string[];
    mainIdeas: string[];
    reminders?: string[];
  } | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const analyzeNotes = async () => {
    if (!notes.trim()) {
      toast({
        title: "Error",
        description: "Por favor escribe algunas notas antes de analizar",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-notes', {
        body: { 
          text: notes,
          includeReminders 
        }
      });

      if (error) throw error;

      setAnalysis(data);
      toast({
        title: "Análisis completado",
        description: "Se han extraído las tareas, ideas y recordatorios de tus notas",
      });
    } catch (error) {
      console.error('Error analyzing notes:', error);
      toast({
        title: "Error",
        description: "No se pudo analizar las notas. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Notas Inteligentes</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl mb-2">Análisis Inteligente de Notas</CardTitle>
                <CardDescription className="text-base">
                  Utiliza inteligencia artificial para extraer automáticamente tareas, ideas principales 
                  y recordatorios de tus notas clínicas. Optimiza tu flujo de trabajo y nunca olvides detalles importantes.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Escribe tus Notas</CardTitle>
                <CardDescription>
                  Escribe o pega las notas de tu consulta. Pueden ser notas de voz transcritas o escritas manualmente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paciente de 45 años con dolor torácico. Se recomienda ECG de urgencia y solicitar troponinas. Considerar isquemia. Pendiente valoración por cardiología..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[300px] text-base"
                />

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="reminders" className="cursor-pointer">
                      Incluir recordatorios
                    </Label>
                  </div>
                  <Switch
                    id="reminders"
                    checked={includeReminders}
                    onCheckedChange={setIncludeReminders}
                  />
                </div>

                <Button
                  onClick={analyzeNotes}
                  disabled={isAnalyzing || !notes.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analizar Notas
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {analysis ? (
              <>
                {/* Tasks */}
                <Card className="border-green-200 dark:border-green-900">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <CardTitle>Tareas Pendientes</CardTitle>
                    </div>
                    <CardDescription>
                      Acciones que debes realizar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.tasks.length > 0 ? (
                      <ul className="space-y-3">
                        {analysis.tasks.map((task, index) => (
                          <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{task}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No se encontraron tareas pendientes</p>
                    )}
                  </CardContent>
                </Card>

                {/* Main Ideas */}
                <Card className="border-blue-200 dark:border-blue-900">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <CardTitle>Ideas Principales</CardTitle>
                    </div>
                    <CardDescription>
                      Puntos clave de la consulta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.mainIdeas.length > 0 ? (
                      <ul className="space-y-3">
                        {analysis.mainIdeas.map((idea, index) => (
                          <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{idea}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No se encontraron ideas principales</p>
                    )}
                  </CardContent>
                </Card>

                {/* Reminders */}
                {includeReminders && analysis.reminders && (
                  <Card className="border-orange-200 dark:border-orange-900">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        <CardTitle>Recordatorios</CardTitle>
                      </div>
                      <CardDescription>
                        Alertas importantes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analysis.reminders.length > 0 ? (
                        <ul className="space-y-3">
                          {analysis.reminders.map((reminder, index) => (
                            <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                              <Bell className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{reminder}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No se encontraron recordatorios</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BrainCircuit className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">
                    Los resultados aparecerán aquí
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Escribe tus notas y presiona "Analizar Notas" para comenzar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* How it works */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>¿Cómo funciona?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">1</Badge>
                  <h3 className="font-semibold">Escribe o Transcribe</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ingresa las notas de tu consulta, ya sean escritas manualmente o transcritas de audio
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">2</Badge>
                  <h3 className="font-semibold">Análisis IA</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  La inteligencia artificial procesa tus notas e identifica tareas, ideas clave y recordatorios
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">3</Badge>
                  <h3 className="font-semibold">Organiza y Actúa</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recibe resultados organizados que puedes usar para gestionar mejor tu práctica médica
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SmartNotes;
