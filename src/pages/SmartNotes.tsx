import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles,
  CheckCircle2,
  Lightbulb,
  Bell,
  Loader2,
  BrainCircuit,
  Mic,
  Square,
  X,
  Upload,
  FileText,
  LogOut,
  User as UserIcon
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioFileUpload } from "@/components/AudioFileUpload";
import AudioWaveform from "@/components/AudioWaveform";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { HeartbeatLine } from "@/components/HeartbeatLine";

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
  const [interimTranscript, setInterimTranscript] = useState("");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
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
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interim += transcriptPiece;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
        setInterimTranscript(interim);
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      setIsRecording(true);
      setTranscript("");
      setInterimTranscript("");
      setAnalysis(null);
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      toast({
        title: "🎤 Grabación iniciada",
        description: "Habla ahora, transcribiendo en tiempo real...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la grabación. Verifica los permisos del micrófono.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsRecording(false);
    
    toast({
      title: "Grabación finalizada",
      description: "Tu transcripción está lista. Presiona 'Analizar' para continuar.",
    });
  };

  const deleteTask = async (indexToDelete: number) => {
    if (!analysis) return;
    
    const updatedTasks = analysis.tasks.filter((_, index) => index !== indexToDelete);
    setAnalysis({ ...analysis, tasks: updatedTasks });
    
    // Actualizar en la base de datos
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notes_analysis')
        .update({ tasks: updatedTasks })
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      toast({
        title: "Tarea eliminada",
        description: "La tarea se eliminó correctamente",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const deleteIdea = async (indexToDelete: number) => {
    if (!analysis) return;
    
    const updatedIdeas = analysis.mainIdeas.filter((_, index) => index !== indexToDelete);
    setAnalysis({ ...analysis, mainIdeas: updatedIdeas });
    
    // Actualizar en la base de datos
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notes_analysis')
        .update({ main_ideas: updatedIdeas })
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      toast({
        title: "Idea eliminada",
        description: "La idea se eliminó correctamente",
      });
    } catch (error) {
      console.error('Error deleting idea:', error);
    }
  };

  const deleteReminder = async (indexToDelete: number) => {
    if (!analysis || !analysis.reminders) return;
    
    const updatedReminders = analysis.reminders.filter((_, index) => index !== indexToDelete);
    setAnalysis({ ...analysis, reminders: updatedReminders });
    
    // Actualizar en la base de datos
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notes_analysis')
        .update({ reminders: updatedReminders })
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      toast({
        title: "Recordatorio eliminado",
        description: "El recordatorio se eliminó correctamente",
      });
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-6">
              <SidebarTrigger className="-ml-1 sm:-ml-2" />
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-feature rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                  <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold truncate">
                    <span className="bg-gradient-feature-soft bg-clip-text text-transparent">Notas Inteligentes</span>
                  </h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">Análisis con IA</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <NotificationBell />
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => navigate("/profile")} title="Mi Perfil">
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
              {/* Hero Banner */}
              <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-secondary rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white mb-4 sm:mb-8">
                <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full -mr-16 sm:-mr-24 -mt-16 sm:-mt-24" />
                <HeartbeatLine color="muted" variant="card" intensity="low" speed="slow" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                    <h2 className="text-base sm:text-xl font-bold">Análisis Inteligente de Notas</h2>
                  </div>
                  <p className="text-white/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    Utiliza IA para extraer tareas, ideas principales y recordatorios de tus notas clínicas
                  </p>
                </div>
              </div>

              {/* Main Content */}
              <Card className="mb-4 sm:mb-8 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-secondary/5 rounded-full blur-3xl" />
                <CardHeader className="relative p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-feature shadow-lg shadow-primary/20 flex-shrink-0">
                      <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-2xl mb-1 sm:mb-2">
                        <span className="bg-gradient-feature-soft bg-clip-text text-transparent">Ingresa tu Nota</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-base">
                        Graba por voz o escribe directamente para analizar con IA
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-8 h-12 sm:h-14 p-1 sm:p-1.5 bg-muted/50 rounded-xl sm:rounded-2xl">
            <TabsTrigger 
              value="voice" 
              className="text-xs sm:text-base rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-300"
            >
              <Mic className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Grabar por </span>Voz
            </TabsTrigger>
            <TabsTrigger 
              value="text" 
              className="text-xs sm:text-base rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-300"
            >
              <BrainCircuit className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Notas </span>Escritas
            </TabsTrigger>
          </TabsList>

          {/* Voice Tab */}
          <TabsContent value="voice" className="space-y-4 sm:space-y-6">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Voice Recording Section */}
              <div>
                <Card className="border-border/50 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      Graba tus Notas
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Graba en tiempo real o sube un archivo de audio para transcripción con IA.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
                    {/* Real-time recording */}
                    <div className="space-y-3">
                      <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                        <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        Grabación en tiempo real
                      </Label>
                      <div className={`relative flex flex-col items-center justify-center p-4 sm:p-8 border-2 border-dashed rounded-xl sm:rounded-2xl transition-all duration-500 ${
                        isRecording 
                          ? "border-destructive bg-destructive/5" 
                          : "border-border/50 bg-muted/20 hover:border-primary/50 hover:bg-primary/5"
                      }`}>
                        {isRecording ? (
                          <div className="text-center space-y-4 sm:space-y-5 w-full">
                            <div className="relative inline-block">
                              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-destructive to-destructive/80 rounded-full flex items-center justify-center shadow-2xl shadow-destructive/40">
                                <Mic className="h-8 w-8 sm:h-12 sm:w-12 text-white animate-pulse" />
                              </div>
                              <div className="absolute inset-0 rounded-full border-4 border-destructive/50 animate-ping" />
                              <div className="absolute inset-[-6px] sm:inset-[-8px] rounded-full border-2 border-destructive/30 animate-pulse" />
                            </div>
                            
                            {/* Audio Waveform Visualization */}
                            <div className="w-full px-2 sm:px-4">
                              <AudioWaveform isRecording={isRecording} mediaStream={mediaStream} barCount={32} className="h-14 sm:h-20" />
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-base sm:text-lg font-semibold text-destructive">Grabando...</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">Habla claramente cerca del micrófono</p>
                            </div>
                            <Button
                              onClick={stopRecording}
                              variant="destructive"
                              size="default"
                              className="shadow-lg shadow-destructive/25 text-sm sm:text-base"
                            >
                              <Square className="mr-2 h-4 w-4" />
                              Detener Grabación
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center space-y-3 sm:space-y-5">
                            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto shadow-lg">
                              <Mic className="h-7 w-7 sm:h-10 sm:w-10 text-primary" />
                            </div>
                            <Button
                              onClick={startRecording}
                              size="default"
                              className="bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 shadow-lg shadow-destructive/25 text-sm sm:text-base"
                            >
                              <Mic className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                              Iniciar Grabación
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-card px-4 text-sm text-muted-foreground font-medium">o</span>
                      </div>
                    </div>

                    {/* Audio file upload */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4 text-primary" />
                        Subir archivo de audio
                      </Label>
                      <AudioFileUpload 
                        onTranscriptionComplete={(text) => setTranscript(text)}
                      />
                    </div>

                    {(transcript || interimTranscript) && (
                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <div>
                          <Label className="mb-2 block font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Transcripción:
                          </Label>
                          <div className="relative">
                            <Textarea
                              value={transcript}
                              onChange={(e) => setTranscript(e.target.value)}
                              className="min-h-[150px] text-base bg-muted/30 border-border/50 focus:border-primary/50"
                              placeholder="La transcripción aparecerá aquí..."
                            />
                            {interimTranscript && (
                              <p className="mt-2 text-sm text-muted-foreground italic animate-pulse">
                                ...{interimTranscript}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-primary" />
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
                          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                          size="lg"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Analizando con IA...
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
                  <Card className="border-dashed border-2 border-border/50 h-full bg-gradient-to-br from-muted/10 to-muted/5">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="p-5 rounded-2xl bg-muted/30 mb-6">
                        <BrainCircuit className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                      <p className="text-lg font-medium text-muted-foreground mb-2">
                        Los resultados aparecerán aquí
                      </p>
                      <p className="text-sm text-muted-foreground/70 max-w-xs">
                        Graba tu voz o sube un archivo de audio y presiona "Analizar" para comenzar
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
            <Card className="border-green-500/30 bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <CardTitle className="text-foreground">Tareas Pendientes</CardTitle>
                </div>
                <CardDescription>
                  Acciones que debes realizar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.tasks.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.tasks.map((task, index) => (
                      <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 group">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground flex-1">{task}</span>
                        <button
                          onClick={() => deleteTask(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                          aria-label="Eliminar tarea"
                        >
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No se encontraron tareas pendientes</p>
                )}
              </CardContent>
            </Card>

            {/* Main Ideas */}
            <Card className="border-purple/30 bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple" />
                  <CardTitle className="text-foreground">Ideas Principales</CardTitle>
                </div>
                <CardDescription>
                  Puntos clave de la consulta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.mainIdeas.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.mainIdeas.map((idea, index) => (
                      <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-purple/10 border border-purple/30 group">
                        <Lightbulb className="h-4 w-4 text-purple mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground flex-1">{idea}</span>
                        <button
                          onClick={() => deleteIdea(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                          aria-label="Eliminar idea"
                        >
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
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
              <Card className="border-orange-500/30 bg-card">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <CardTitle className="text-foreground">Recordatorios</CardTitle>
                  </div>
                  <CardDescription>
                    Alertas importantes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.reminders.length > 0 ? (
                    <ul className="space-y-3">
                      {analysis.reminders.map((reminder, index) => (
                        <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 group">
                          <Bell className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground flex-1">{reminder}</span>
                          <button
                            onClick={() => deleteReminder(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                            aria-label="Eliminar recordatorio"
                          >
                            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </button>
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SmartNotes;
