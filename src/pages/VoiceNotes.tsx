import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  Mic, 
  Square, 
  FileText, 
  Loader2,
  ArrowLeft,
  Save,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import QuickPatientForm from "@/components/QuickPatientForm";

interface Suggestion {
  question: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const VoiceNotes = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Speech Recognition
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const [interimTranscript, setInterimTranscript] = useState("");
  
  // Medical record fields
  const [patientName, setPatientName] = useState("");
  const [recordType, setRecordType] = useState("consultation");
  const [title, setTitle] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [medications, setMedications] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  // Analyze transcript in real-time for suggestions
  useEffect(() => {
    if (!isRecording || transcript.length < 100) {
      setSuggestions([]);
      return;
    }

    const analyzeTranscript = async () => {
      setIsAnalyzing(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const { data, error } = await supabase.functions.invoke('analyze-clinical-transcript', {
          body: { 
            transcript,
            specialty: null // Podrías obtener la especialidad del perfil del doctor
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });

        if (error) {
          console.error('Error analyzing transcript:', error);
          return;
        }
        
        if (data?.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error('Error analyzing transcript:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Analyze every 15 seconds while recording
    const interval = setInterval(analyzeTranscript, 15000);
    
    // Also analyze immediately if we have enough text
    if (transcript.length > 100) {
      analyzeTranscript();
    }

    return () => clearInterval(interval);
  }, [isRecording, transcript]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptPiece + ' ';
          } else {
            interim += transcriptPiece;
          }
        }

        // Update final transcript
        if (final) {
          setTranscript(prev => prev + final);
        }
        
        // Update interim transcript to show real-time words
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          toast({
            title: "No se detectó voz",
            description: "Por favor habla más cerca del micrófono",
            variant: "destructive",
          });
        }
      };
    } else {
      toast({
        title: "Navegador no compatible",
        description: "Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.",
        variant: "destructive",
      });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);


  const startRecording = async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Error",
        description: "Reconocimiento de voz no disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start();
      setTranscript(""); // Clear previous transcript
      setInterimTranscript(""); // Clear interim transcript
      recognitionRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "🎤 Grabación iniciada",
        description: "Transcripción en tiempo real activada. Habla claramente.",
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
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }

    setIsRecording(false);
    
    toast({
      title: "✓ Grabación detenida",
      description: "Transcripción completada. Ahora puedes organizarla con IA.",
    });
  };


  const generateMedicalRecord = async () => {
    if (!transcript) {
      toast({
        title: "Sin transcripción",
        description: "Primero debes grabar y transcribir una consulta",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Generating medical record from transcript...');

      const { data, error } = await supabase.functions.invoke('generate-medical-record', {
        body: { transcript }
      });

      if (error) {
        console.error('Generation error:', error);
        throw error;
      }

      console.log('Medical record generated:', data);

      const record = data.medicalRecord;
      
      // Fill form with generated data
      setTitle(record.chief_complaint || `Consulta - ${new Date().toLocaleDateString()}`);
      setChiefComplaint(record.chief_complaint || "");
      setSymptoms(Array.isArray(record.symptoms) ? record.symptoms : []);
      setDiagnosis(record.diagnosis || "");
      setTreatmentPlan(record.treatment_plan || "");
      setMedications(Array.isArray(record.medications) ? record.medications : []);
      setNotes(record.notes || "");

      toast({
        title: "Historia clínica generada",
        description: "La IA ha organizado la transcripción. Revisa y edita antes de guardar.",
      });
    } catch (error: any) {
      console.error('Error generating medical record:', error);
      toast({
        title: "Error al generar",
        description: error.message || "No se pudo generar la historia clínica",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveMedicalRecord = async () => {
    if (!patientName.trim()) {
      toast({
        title: "Paciente requerido",
        description: "Ingresa el nombre del paciente antes de guardar",
        variant: "destructive",
      });
      return;
    }

    if (!title) {
      toast({
        title: "Título requerido",
        description: "Ingresa un título para la historia clínica",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Search for existing patient by name
      const { data: existingPatients, error: searchError } = await supabase
        .from('patients')
        .select('id')
        .eq('doctor_id', user.id)
        .ilike('full_name', patientName.trim())
        .limit(1);

      if (searchError) throw searchError;

      let patientId: string;

      if (existingPatients && existingPatients.length > 0) {
        // Use existing patient
        patientId = existingPatients[0].id;
      } else {
        // Create new patient
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert([{
            doctor_id: user.id,
            full_name: patientName.trim(),
            phone: 'Sin especificar',
          }])
          .select('id')
          .single();

        if (createError) throw createError;
        if (!newPatient) throw new Error('Failed to create patient');
        
        patientId = newPatient.id;
        
        toast({
          title: "Paciente creado",
          description: `Se ha creado el paciente: ${patientName}`,
        });
      }

      // Save audio recording if available
      let audioUrl: string | null = null;
      let durationSeconds: number | null = null;

      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const fileName = `${user.id}/${Date.now()}_recording.webm`;
        
        durationSeconds = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('voice-recordings')
          .upload(fileName, audioBlob);

        if (uploadError) {
          console.error('Error uploading audio:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('voice-recordings')
            .getPublicUrl(fileName);
          audioUrl = publicUrl;

          // Save voice recording reference
          await supabase.from('voice_recordings').insert({
            doctor_id: user.id,
            patient_id: patientId,
            audio_url: audioUrl,
            transcript: transcript,
            duration_seconds: durationSeconds,
          });
        }
      }

      // Save medical record
      const { error } = await supabase.from('medical_records').insert([{
        doctor_id: user.id,
        patient_id: patientId,
        record_type: recordType as "consultation" | "procedure" | "diagnosis" | "prescription" | "lab_result" | "imaging",
        title,
        chief_complaint: chiefComplaint,
        symptoms,
        diagnosis,
        treatment_plan: treatmentPlan,
        medications,
        notes,
        voice_transcript: transcript,
      }]);

      if (error) throw error;

      toast({
        title: "✅ Historial guardado",
        description: "El historial médico y la grabación se guardaron exitosamente",
      });

      // Reset form
      setTranscript("");
      setTitle("");
      setChiefComplaint("");
      setSymptoms([]);
      setDiagnosis("");
      setTreatmentPlan("");
      setMedications([]);
      setNotes("");
      setPatientName("");
      audioChunksRef.current = [];
    } catch (error: any) {
      console.error('Error saving medical record:', error);
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">VoiceNotes MD</h1>
              <p className="text-sm text-muted-foreground">Transcripción y generación automática con IA</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Recording Card */}
        <Card className="bg-gradient-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Grabación de Audio
            </CardTitle>
            <CardDescription>
              Paso 1: Transcripción automática en tiempo real (sin IA)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="gap-2"
                >
                  <Mic className="w-5 h-5" />
                  Iniciar Grabación
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="gap-2 animate-pulse"
                >
                  <Square className="w-5 h-5" />
                  Detener Grabación
                </Button>
              )}
            </div>

            {isRecording && (
              <div className="text-center space-y-3">
                <Badge variant="destructive" className="animate-pulse text-base py-2 px-4">
                  ● GRABANDO EN TIEMPO REAL
                </Badge>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    🎤 Transcripción automática activada
                  </p>
                  <p className="text-xs text-muted-foreground">
                    La conversación se está transcribiendo en tiempo real
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Suggestions Panel - Only visible while recording */}
        {isRecording && suggestions.length > 0 && (
          <Card className="shadow-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Sugerencias de la IA
                {isAnalyzing && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
              <CardDescription>
                Preguntas sugeridas para completar la historia clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    suggestion.priority === 'high' 
                      ? 'bg-destructive/10 border-destructive' 
                      : suggestion.priority === 'medium'
                      ? 'bg-yellow-500/10 border-yellow-500'
                      : 'bg-blue-500/10 border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-foreground">
                        💡 {suggestion.question}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {suggestion.reason}
                      </p>
                    </div>
                    <Badge 
                      variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
                      className="shrink-0"
                    >
                      {suggestion.priority === 'high' ? '🔴 Alta' : suggestion.priority === 'medium' ? '🟡 Media' : '🔵 Baja'}
                    </Badge>
                  </div>
                </div>
              ))}
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  ℹ️ Estas son solo sugerencias. La transcripción literal no se modifica.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transcript Card */}
        {transcript && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary" />
                Transcripción Literal
              </CardTitle>
            <CardDescription>
              Paso 2: Revisa la transcripción de la consulta (médico + paciente)
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={transcript + interimTranscript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="La transcripción aparecerá aquí..."
                className="min-h-[150px] font-mono text-sm"
              />
              
              {interimTranscript && isRecording && (
                <p className="text-xs text-muted-foreground italic">
                  ✨ Transcribiendo en tiempo real: "{interimTranscript}"
                </p>
              )}
              
              <Button
                onClick={generateMedicalRecord}
                disabled={isGenerating || !transcript}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analizando y generando con IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analizar y Generar Historia Clínica con IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Medical Record Form */}
        {(chiefComplaint || diagnosis) && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                Historia Clínica Organizada por IA
              </CardTitle>
              <CardDescription>
                Paso 3: IA organiza e identifica médico vs paciente automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Paciente *</Label>
                  <Input
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Ej: Cristian López"
                  />
                  <p className="text-xs text-muted-foreground">
                    Se creará automáticamente si no existe
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Registro</Label>
                  <Select value={recordType} onValueChange={setRecordType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consulta</SelectItem>
                      <SelectItem value="procedure">Procedimiento</SelectItem>
                      <SelectItem value="diagnosis">Diagnóstico</SelectItem>
                      <SelectItem value="prescription">Prescripción</SelectItem>
                      <SelectItem value="lab_result">Resultado de Laboratorio</SelectItem>
                      <SelectItem value="imaging">Imagenología</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Consulta de seguimiento - Dolor abdominal"
                />
              </div>

              <div className="space-y-2">
                <Label>Motivo de Consulta</Label>
                <Textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Síntomas</Label>
                <Textarea
                  value={symptoms.join('\n')}
                  onChange={(e) => setSymptoms(e.target.value.split('\n').filter(s => s.trim()))}
                  placeholder="Un síntoma por línea"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Diagnóstico</Label>
                <Textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Plan de Tratamiento</Label>
                <Textarea
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Medicamentos</Label>
                <Textarea
                  value={medications.join('\n')}
                  onChange={(e) => setMedications(e.target.value.split('\n').filter(m => m.trim()))}
                  placeholder="Un medicamento por línea (incluye dosis y frecuencia)"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Notas Adicionales</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button
                onClick={saveMedicalRecord}
                disabled={isSaving || !patientName.trim() || !title}
                className="w-full gap-2"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Historia Clínica
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Patient Form */}
        <div className="pt-8">
          <div className="flex items-center gap-4 mb-6">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground font-medium">
              O agrega un paciente manualmente
            </span>
            <Separator className="flex-1" />
          </div>
          <QuickPatientForm />
        </div>
      </main>
    </div>
  );
};

export default VoiceNotes;