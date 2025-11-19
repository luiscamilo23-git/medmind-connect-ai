import { useState, useRef, useEffect } from "react";
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
  BrainCircuit,
  Mic,
  Square
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SmartNotes = () => {
  const [notes, setNotes] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [includeReminders, setIncludeReminders] = useState(true);
  const [analysis, setAnalysis] = useState<{
    tasks: string[];
    mainIdeas: string[];
    reminders?: string[];
  } | null>(null);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast({
            title: "Permiso denegado",
            description: "Por favor, permite el acceso al micrófono para usar esta función",
            variant: "destructive",
          });
        }
      };
    }
  }, [toast]);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setTranscript("");
      setAnalysis(null);
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      toast({
        title: "Grabación iniciada",
        description: "Habla ahora, estoy transcribiendo...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la grabación",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    
    toast({
      title: "Grabación finalizada",
      description: "Tu transcripción está lista. Presiona 'Analizar' para continuar.",
    });
  };

  const analyzeNotes = async () => {
    const textToAnalyze = notes || transcript;
    
    if (!textToAnalyze.trim()) {
      toast({
        title: "Error",
        description: "Por favor escribe algunas notas o graba tu voz antes de analizar",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase.functions.invoke('analyze-notes', {
        body: { 
          text: textToAnalyze,
          includeReminders 
        }
      });

      if (error) throw error;

      setAnalysis(data);

      // Guardar el análisis en la base de datos
      const { error: saveError } = await supabase
        .from('notes_analysis')
        .insert({
          doctor_id: user.id,
          original_text: textToAnalyze,
          tasks: data.tasks || [],
          main_ideas: data.mainIdeas || [],
          reminders: includeReminders ? (data.reminders || []) : [],
          is_voice_recording: !!transcript
        });

      if (saveError) {
        console.error('Error saving analysis:', saveError);
      }

      toast({
        title: "Análisis completado",
        description: "Se han extraído y guardado las tareas, ideas y recordatorios de tus notas",
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

      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
                  y recordatorios de tus notas clínicas. Escríbelas o grábalas por voz.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
            <TabsTrigger value="voice" className="text-base">
              <Mic className="mr-2 h-5 w-5" />
              Grabar por Voz
            </TabsTrigger>
            <TabsTrigger value="text" className="text-base">
              <BrainCircuit className="mr-2 h-5 w-5" />
              Notas Escritas
            </TabsTrigger>
          </TabsList>

          {/* Voice Tab */}
          <TabsContent value="voice" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Voice Recording Section */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Graba tus Notas</CardTitle>
                    <CardDescription>
                      Presiona el botón y habla. La IA transcribirá automáticamente lo que digas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/30">
                      {isRecording ? (
                        <div className="text-center space-y-6">
                          <div className="relative inline-block">
                            <div className="w-28 h-28 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                              <Mic className="h-14 w-14 text-white" />
                            </div>
                            <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping"></div>
                          </div>
                          <p className="text-base font-medium">🎙️ Grabando... Habla ahora</p>
                          <Button
                            onClick={stopRecording}
                            variant="destructive"
                            size="lg"
                          >
                            <Square className="mr-2 h-5 w-5" />
                            Detener Grabación
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center space-y-6">
                          <div className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center">
                            <Mic className="h-14 w-14 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground">Presiona para comenzar a grabar</p>
                          <Button
                            onClick={startRecording}
                            size="lg"
                            className="bg-red-500 hover:bg-red-600"
                          >
                            <Mic className="mr-2 h-5 w-5" />
                            Iniciar Grabación
                          </Button>
                        </div>
                      )}
                    </div>

                    {transcript && (
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label className="mb-2 block font-semibold">Transcripción:</Label>
                          <Textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            className="min-h-[200px] text-base"
                            placeholder="La transcripción aparecerá aquí..."
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="reminders-voice" className="cursor-pointer">
                              Incluir recordatorios
                            </Label>
                          </div>
                          <Switch
                            id="reminders-voice"
                            checked={includeReminders}
                            onCheckedChange={setIncludeReminders}
                          />
                        </div>

                        <Button
                          onClick={analyzeNotes}
                          disabled={isAnalyzing || !transcript.trim()}
                          className="w-full"
                          size="lg"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Analizando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-5 w-5" />
                              Analizar Transcripción
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Results placeholder for voice tab */}
              <div>
                {!analysis ? (
                  <Card className="border-dashed h-full">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <BrainCircuit className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">
                        Los resultados aparecerán aquí
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Graba tu voz y presiona "Analizar" para comenzar
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          </TabsContent>

          {/* Text Tab */}
          <TabsContent value="text" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Escribe tus Notas</CardTitle>
                    <CardDescription>
                      Escribe o pega las notas de tu consulta médica.
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
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Analizar Notas
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Results placeholder for text tab */}
              <div>
                {!analysis ? (
                  <Card className="border-dashed h-full">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <BrainCircuit className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">
                        Los resultados aparecerán aquí
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Escribe tus notas y presiona "Analizar" para comenzar
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Results Section - Shared between tabs */}
        {analysis && (
          <div className="grid md:grid-cols-3 gap-6 mt-8">
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
                      <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">{task}</span>
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
                      <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-blue-100 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                        <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">{idea}</span>
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
              <Card className="border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/10">
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
                        <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-orange-100 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50">
                          <Bell className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground">{reminder}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No se encontraron recordatorios</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

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
                  <h3 className="font-semibold">Graba o Escribe</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Usa tu voz para dictar notas o escríbelas manualmente
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">2</Badge>
                  <h3 className="font-semibold">Análisis IA</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  La IA procesa tus notas e identifica tareas, ideas clave y recordatorios
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">3</Badge>
                  <h3 className="font-semibold">Organiza y Actúa</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recibe resultados organizados listos para usar
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
