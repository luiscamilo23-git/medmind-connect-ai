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

const VoiceNotes = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();


  const startRecording = async () => {
    try {
      // Request high-quality audio with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        }
      });
      
      // Use higher quality codec if available
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Record in chunks every 1 second for better quality
      mediaRecorder.start(1000);
      setIsRecording(true);
      
      toast({
        title: "Grabación iniciada",
        description: "Hablando con alta calidad. Habla cerca del micrófono.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error de micrófono",
        description: "No se pudo acceder al micrófono. Verifica los permisos.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Failed to convert audio to base64');
        }

        console.log('Sending audio to transcription service...');

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) {
          console.error('Transcription error:', error);
          throw error;
        }

        console.log('Transcription successful:', data);
        setTranscript(data.text);
        
        toast({
          title: "Transcripción completada",
          description: "El audio ha sido transcrito exitosamente",
        });
      };
    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Error de transcripción",
        description: error.message || "No se pudo transcribir el audio",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
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
        description: "Revisa y edita los campos antes de guardar",
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
        title: "Historia clínica guardada",
        description: "Se ha guardado exitosamente en la base de datos",
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
              Graba la consulta médica con alta calidad de audio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <Button
                  size="lg"
                  onClick={startRecording}
                  disabled={isTranscribing}
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
              <div className="text-center space-y-2">
                <Badge variant="destructive" className="animate-pulse">
                  ● Grabando...
                </Badge>
                <p className="text-xs text-muted-foreground">
                  🎤 Habla cerca del micrófono para mejor calidad
                </p>
              </div>
            )}

            {isTranscribing && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Transcribiendo audio...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transcript Card */}
        {transcript && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary" />
                Transcripción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="La transcripción aparecerá aquí..."
                className="min-h-[150px] font-mono text-sm"
              />
              
              <Button
                onClick={generateMedicalRecord}
                disabled={isGenerating || !transcript}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando con IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generar Historia Clínica con IA
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
                Historia Clínica Generada
              </CardTitle>
              <CardDescription>
                Revisa y edita los campos antes de guardar
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