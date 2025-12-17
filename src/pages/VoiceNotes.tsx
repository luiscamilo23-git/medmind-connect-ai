import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  Mic, 
  Square, 
  FileText, 
  Loader2,
  Save,
  Sparkles,
  Download,
  Upload,
  LogOut,
  User as UserIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { SignaturePad } from "@/components/SignaturePad";
import { MedicalDocumentGenerator } from "@/components/MedicalDocumentGenerator";
import { AudioFileUpload } from "@/components/AudioFileUpload";
import AudioWaveform from "@/components/AudioWaveform";
import { ExportMedicalRecordPDF } from "@/components/ExportMedicalRecordPDF";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { HeartbeatLine } from "@/components/HeartbeatLine";

interface Suggestion {
  question: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const VoiceNotes = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  // Recording state for individual fields
  const [recordingField, setRecordingField] = useState<string | null>(null);
  
  // Speech Recognition
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const [interimTranscript, setInterimTranscript] = useState("");
  
  // Medical record fields - Complete Colombian compliance
  const [patientName, setPatientName] = useState("");
  const [recordType, setRecordType] = useState("consultation");
  const [title, setTitle] = useState("");
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  
  // Required fields
  const [patientIdentification, setPatientIdentification] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [currentIllness, setCurrentIllness] = useState("");
  const [ros, setRos] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [vitalSigns, setVitalSigns] = useState({
    blood_pressure: "",
    heart_rate: "",
    respiratory_rate: "",
    temperature: "",
    spo2: "",
    weight: "",
    height: ""
  });
  const [physicalExam, setPhysicalExam] = useState("");
  const [diagnosticAids, setDiagnosticAids] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [cie10Code, setCie10Code] = useState("");
  const [treatment, setTreatment] = useState("");
  const [education, setEducation] = useState("");
  const [followup, setFollowup] = useState("");
  const [medications, setMedications] = useState<string[]>([]);
  const [consent, setConsent] = useState("");
  const [doctorSignature, setDoctorSignature] = useState<string | null>(null);
  const [evolutionNotes, setEvolutionNotes] = useState("");
  const [notes, setNotes] = useState("");
  
  // For document generation
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [savedMedicalRecord, setSavedMedicalRecord] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Load doctor profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setDoctorProfile(data);
      }
    };
    loadProfile();
  }, []);

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
            specialty: null
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

    const interval = setInterval(analyzeTranscript, 15000);
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

        if (final) {
          if (recordingField) {
            // Append to specific field
            appendToField(recordingField, final);
          } else {
            setTranscript(prev => prev + final);
          }
        }
        
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
  }, [recordingField]);

  const appendToField = (field: string, text: string) => {
    switch(field) {
      case 'patientIdentification': setPatientIdentification(prev => prev + text); break;
      case 'chiefComplaint': setChiefComplaint(prev => prev + text); break;
      case 'currentIllness': setCurrentIllness(prev => prev + text); break;
      case 'ros': setRos(prev => prev + text); break;
      case 'medicalHistory': setMedicalHistory(prev => prev + text); break;
      case 'physicalExam': setPhysicalExam(prev => prev + text); break;
      case 'diagnosticAids': setDiagnosticAids(prev => prev + text); break;
      case 'diagnosis': setDiagnosis(prev => prev + text); break;
      case 'cie10Code': setCie10Code(prev => prev + text); break;
      case 'treatment': setTreatment(prev => prev + text); break;
      case 'education': setEducation(prev => prev + text); break;
      case 'followup': setFollowup(prev => prev + text); break;
      case 'consent': setConsent(prev => prev + text); break;
      case 'evolutionNotes': setEvolutionNotes(prev => prev + text); break;
      case 'notes': setNotes(prev => prev + text); break;
    }
  };

  const startFieldRecording = (field: string) => {
    setRecordingField(field);
    startRecording();
  };

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      if (!recordingField) {
        setTranscript("");
      }
      setInterimTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "🎤 Grabación iniciada",
        description: recordingField ? `Transcribiendo ${getFieldLabel(recordingField)}` : "Transcripción en tiempo real activada",
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
      mediaRecorderRef.current.onstop = () => {
        // Create audio blob when recording stops
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      
      mediaRecorderRef.current.stop();
      
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }

    setIsRecording(false);
    setRecordingField(null);
    
    toast({
      title: "✓ Grabación detenida",
      description: "Transcripción completada. Puedes descargar el audio.",
    });
  };

  const downloadAudio = () => {
    if (!audioBlob) {
      toast({
        title: "Sin grabación",
        description: "No hay grabación disponible para descargar",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consulta_${patientName || 'paciente'}_${new Date().toISOString().split('T')[0]}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "✓ Audio descargado",
      description: "La grabación se ha guardado en tu dispositivo",
    });
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      patientIdentification: "Identificación",
      chiefComplaint: "Motivo de consulta",
      currentIllness: "Enfermedad actual",
      ros: "Revisión por sistemas",
      medicalHistory: "Antecedentes",
      physicalExam: "Examen físico",
      diagnosticAids: "Ayudas diagnósticas",
      diagnosis: "Diagnóstico",
      cie10Code: "Código CIE-10",
      treatment: "Tratamiento",
      education: "Educación",
      followup: "Seguimiento",
      consent: "Consentimiento",
      evolutionNotes: "Notas de evolución",
      notes: "Notas adicionales"
    };
    return labels[field] || field;
  };

  // Combined AI Assistant function removed - now using runAIAssistant

  const runAIAssistant = async () => {
    if (!transcript) {
      toast({
        title: "Sin transcripción",
        description: "Primero debes grabar y transcribir una consulta",
        variant: "destructive",
      });
      return;
    }

    setIsAutocompleting(true);

    try {
      // Paso 1: Autocompletar campos vacíos
      const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-clinical-info', {
        body: { transcript }
      });

      if (extractError) throw extractError;

      const extracted = extractData.extractedData;
      
      // Autocompletar solo campos vacíos con información detectada por la IA
      if (extracted.patientName && !patientName) setPatientName(extracted.patientName);
      if (extracted.patientIdentification && !patientIdentification) setPatientIdentification(extracted.patientIdentification);
      if (extracted.chiefComplaint && !chiefComplaint) {
        setChiefComplaint(extracted.chiefComplaint);
        if (!title) setTitle(extracted.chiefComplaint);
      }
      if (extracted.currentIllness && !currentIllness) setCurrentIllness(extracted.currentIllness);
      if (extracted.ros && !ros) setRos(extracted.ros);
      if (extracted.medicalHistory && !medicalHistory) setMedicalHistory(extracted.medicalHistory);
      if (extracted.physicalExam && !physicalExam) setPhysicalExam(extracted.physicalExam);
      if (extracted.diagnosticAids && !diagnosticAids) setDiagnosticAids(extracted.diagnosticAids);
      if (extracted.diagnosis && !diagnosis) setDiagnosis(extracted.diagnosis);
      if (extracted.cie10Code && !cie10Code) setCie10Code(extracted.cie10Code);
      if (extracted.treatment && !treatment) setTreatment(extracted.treatment);
      if (extracted.education && !education) setEducation(extracted.education);
      if (extracted.followup && !followup) setFollowup(extracted.followup);
      if (extracted.medications && Array.isArray(extracted.medications) && medications.length === 0) {
        setMedications(extracted.medications);
      }

      // Paso 2: Analizar y sugerir preguntas faltantes
      setIsAnalyzing(true);
      const { data: suggestData, error: suggestError } = await supabase.functions.invoke('analyze-clinical-transcript', {
        body: { 
          transcript,
          specialty: doctorProfile?.specialty || 'general'
        }
      });

      if (!suggestError && suggestData?.suggestions) {
        setSuggestions(suggestData.suggestions);
      }

      toast({
        title: "✨ Asistente IA completado",
        description: "Campos autocompletados y sugerencias de preguntas generadas.",
      });
    } catch (error: any) {
      console.error('Error en asistente IA:', error);
      toast({
        title: "Error en asistente IA",
        description: error.message || "No se pudo completar el análisis",
        variant: "destructive",
      });
    } finally {
      setIsAutocompleting(false);
      setIsAnalyzing(false);
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

      // Search for existing patient
      const { data: existingPatients, error: searchError } = await supabase
        .from('patients')
        .select('id')
        .eq('doctor_id', user.id)
        .ilike('full_name', patientName.trim())
        .limit(1);

      if (searchError) throw searchError;

      let patientId: string;

      if (existingPatients && existingPatients.length > 0) {
        patientId = existingPatients[0].id;
      } else {
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
      }

      // Save audio if available
      let audioUrl: string | null = null;
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const fileName = `${user.id}/${Date.now()}_recording.webm`;
        
        const durationSeconds = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('voice-recordings')
          .upload(fileName, audioBlob);

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('voice-recordings')
            .getPublicUrl(fileName);
          audioUrl = publicUrl;

          await supabase.from('voice_recordings').insert({
            doctor_id: user.id,
            patient_id: patientId,
            audio_url: audioUrl,
            transcript: transcript,
            duration_seconds: durationSeconds,
          });
        }
      }

      // Save complete medical record
      const { data: savedRecord, error } = await supabase.from('medical_records')
        .insert([{
          doctor_id: user.id,
          patient_id: patientId,
          record_type: recordType as "consultation" | "procedure" | "diagnosis" | "prescription" | "lab_result" | "imaging",
          title,
          patient_identification: patientIdentification,
          chief_complaint: chiefComplaint,
          current_illness: currentIllness,
          ros: ros,
          medical_history: medicalHistory,
          vital_signs: vitalSigns,
          physical_exam: physicalExam,
          diagnostic_aids: diagnosticAids,
          diagnosis: diagnosis,
          cie10_code: cie10Code,
          treatment: treatment,
          education: education,
          followup: followup,
          medications: medications,
          consent: consent,
          doctor_signature: doctorSignature,
          evolution_notes: evolutionNotes,
          notes: notes,
          voice_transcript: transcript,
        }])
        .select('*')
        .single();

      if (error) throw error;
      
      // Save record ID and full record for document generation
      if (savedRecord) {
        setSavedRecordId(savedRecord.id);
        setSavedMedicalRecord(savedRecord);
        setShowExportDialog(true); // Show export dialog after save
      }

      toast({
        title: "✅ Historia clínica guardada",
        description: "Historia clínica completa guardada exitosamente.",
      });
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

  const resetForm = () => {
    setShowExportDialog(false);
    setSavedRecordId(null);
    setSavedMedicalRecord(null);
    setTranscript("");
    setTitle("");
    setPatientIdentification("");
    setChiefComplaint("");
    setCurrentIllness("");
    setRos("");
    setMedicalHistory("");
    setVitalSigns({
      blood_pressure: "",
      heart_rate: "",
      respiratory_rate: "",
      temperature: "",
      spo2: "",
      weight: "",
      height: ""
    });
    setPhysicalExam("");
    setDiagnosticAids("");
    setDiagnosis("");
    setCie10Code("");
    setTreatment("");
    setEducation("");
    setFollowup("");
    setMedications([]);
    setConsent("");
    setDoctorSignature(null);
    setEvolutionNotes("");
    setNotes("");
    setPatientName("");
    audioChunksRef.current = [];
    setAudioBlob(null);
  };

  const renderFieldWithMic = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    fieldKey: string,
    isTextarea: boolean = true
  ) => {
    const isRecordingThis = isRecording && recordingField === fieldKey;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <Button
            size="sm"
            variant={isRecordingThis ? "destructive" : "outline"}
            onClick={() => isRecordingThis ? stopRecording() : startFieldRecording(fieldKey)}
            className="gap-2"
          >
            {isRecordingThis ? (
              <>
                <Square className="w-4 h-4" />
                Detener
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Transcribir
              </>
            )}
          </Button>
        </div>
        {isTextarea ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Escribe o transcribe ${label.toLowerCase()}`}
            rows={3}
            className={isRecordingThis ? "border-destructive animate-pulse" : ""}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Escribe o transcribe ${label.toLowerCase()}`}
            className={isRecordingThis ? "border-destructive animate-pulse" : ""}
          />
        )}
        {isRecordingThis && interimTranscript && (
          <p className="text-sm text-muted-foreground italic">
            Transcribiendo: {interimTranscript}
          </p>
        )}
      </div>
    );
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
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-purple rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold truncate">
                    <span className="bg-gradient-purple-blue bg-clip-text text-transparent">VoiceNotes MD</span>
                  </h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">Historia Clínica con IA</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {savedRecordId && savedMedicalRecord && patientName && (
                  <div className="hidden sm:flex items-center gap-2">
                    <ExportMedicalRecordPDF
                      medicalRecord={savedMedicalRecord}
                      patientName={patientName}
                      doctorName={doctorProfile?.full_name || 'Doctor'}
                      doctorLicense={doctorProfile?.license_number || undefined}
                      doctorSignature={doctorSignature || undefined}
                    />
                    <MedicalDocumentGenerator
                      medicalRecordId={savedRecordId}
                      patientName={patientName}
                      doctorName={doctorProfile?.full_name || 'Doctor'}
                      doctorLicense={doctorProfile?.license_number || undefined}
                      doctorSignature={doctorSignature || undefined}
                    />
                  </div>
                )}
                <NotificationBell />
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => navigate("/profile")} title="Mi Perfil">
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-6xl space-y-4 sm:space-y-6">
              {/* Hero Banner */}
              <div className="relative overflow-hidden bg-gradient-to-br from-purple via-purple-glow to-primary rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
                <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full -mr-16 sm:-mr-24 -mt-16 sm:-mt-24" />
                <HeartbeatLine color="muted" position="bottom" opacity={0.2} speed="slow" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                    <h2 className="text-base sm:text-xl font-bold">Historia Clínica Completa</h2>
                  </div>
                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                    Cumple con normativa colombiana (Resolución 1995/1999) • Transcripción con IA
                  </p>
                </div>
              </div>
        {/* Recording Card */}
        <Card className={`bg-gradient-to-br from-card via-card to-primary/5 shadow-xl border-border/50 overflow-hidden relative ${isRecording && !recordingField ? "border-destructive/50" : ""}`}>
          <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-primary/5 rounded-full blur-3xl" />
          <CardHeader className="relative p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="leading-tight">Grabación de Consulta</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Graba en tiempo real o sube un archivo de audio para transcripción con IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 relative p-4 sm:p-6 pt-0 sm:pt-0">
            {/* Real-time recording buttons */}
            <div className="space-y-3">
              <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                Grabación en tiempo real
              </Label>
              <div className={`flex items-center justify-center gap-3 sm:gap-4 flex-wrap p-4 sm:p-8 border-2 border-dashed rounded-xl sm:rounded-2xl transition-all duration-500 ${
                isRecording && !recordingField 
                  ? "border-destructive bg-destructive/5" 
                  : "border-border/50 bg-muted/20 hover:border-primary/50 hover:bg-primary/5"
              }`}>
                {!isRecording || recordingField ? (
                  <div className="text-center space-y-3 sm:space-y-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <Button
                      size="default"
                      onClick={() => startRecording()}
                      className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 text-sm sm:text-base"
                      disabled={isRecording && recordingField !== null}
                    >
                      <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                      Iniciar Grabación Completa
                    </Button>
                  </div>
                ) : (
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
                      <AudioWaveform isRecording={isRecording && !recordingField} mediaStream={mediaStream} barCount={32} className="h-14 sm:h-20" />
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-base sm:text-lg font-semibold text-destructive">Grabando consulta...</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Habla claramente cerca del micrófono</p>
                    </div>
                    <Button
                      size="default"
                      variant="destructive"
                      onClick={stopRecording}
                      className="gap-2 shadow-lg shadow-destructive/25 text-sm sm:text-base"
                    >
                      <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                      Detener Grabación
                    </Button>
                  </div>
                )}
                
                {audioBlob && !isRecording && (
                  <Button
                    size="default"
                    variant="outline"
                    onClick={downloadAudio}
                    className="gap-2 border-border/50 hover:bg-primary/10 hover:border-primary/50 text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    Descargar Audio
                  </Button>
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

            {isRecording && !recordingField && (
              <div className="space-y-4">
                <Badge variant="destructive" className="animate-pulse text-base py-2.5 px-5 w-full justify-center rounded-xl shadow-lg shadow-destructive/25">
                  ● GRABANDO CONSULTA COMPLETA
                </Badge>

                {/* Suggestions while recording */}
                {suggestions.length > 0 && (
                  <Card className="bg-purple/5 border-purple/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple" />
                        Sugerencias de IA en tiempo real
                        {isAnalyzing && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {suggestions.map((suggestion, idx) => (
                        <div key={idx} className="bg-card p-3 rounded-lg border">
                          <div className="flex items-start gap-2">
                            <Badge variant={
                              suggestion.priority === 'high' ? 'destructive' :
                              suggestion.priority === 'medium' ? 'default' : 'secondary'
                            } className="shrink-0 mt-1">
                              {suggestion.priority}
                            </Badge>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">{suggestion.question}</p>
                              <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Literal Transcript */}
        {transcript && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Transcripción Literal
                  </CardTitle>
                  <CardDescription>
                    Paso 2: Organiza con IA o llena manualmente los campos
                  </CardDescription>
                </div>
                <Button
                  onClick={runAIAssistant}
                  disabled={isAutocompleting || isAnalyzing}
                  className="gap-2"
                >
                  {isAutocompleting || isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando con IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 w-4" />
                      Asistente IA
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{transcript}</p>
                {interimTranscript && !recordingField && (
                  <p className="text-sm text-muted-foreground italic mt-2">
                    {interimTranscript}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Complete Medical Record Form */}
        <Card>
          <CardHeader>
            <CardTitle>Historia Clínica Completa</CardTitle>
            <CardDescription>
              Completa todos los campos requeridos. Puedes escribir o usar el micrófono en cada campo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nombre completo del paciente"
                />
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* 1. Identificación */}
            {renderFieldWithMic("1. Identificación del Paciente", patientIdentification, setPatientIdentification, "patientIdentification")}

            <Separator />

            {/* 2-4. Motivo, Enfermedad, ROS */}
            {renderFieldWithMic("2. Motivo de Consulta", chiefComplaint, setChiefComplaint, "chiefComplaint")}
            {renderFieldWithMic("3. Enfermedad Actual", currentIllness, setCurrentIllness, "currentIllness")}
            {renderFieldWithMic("4. Revisión por Sistemas (ROS)", ros, setRos, "ros")}

            <Separator />

            {/* 5. Antecedentes */}
            {renderFieldWithMic("5. Antecedentes Médicos", medicalHistory, setMedicalHistory, "medicalHistory")}

            <Separator />

            {/* 6. Signos Vitales */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">6. Signos Vitales</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Presión Arterial</Label>
                  <Input
                    value={vitalSigns.blood_pressure}
                    onChange={(e) => setVitalSigns({...vitalSigns, blood_pressure: e.target.value})}
                    placeholder="120/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Frecuencia Cardíaca</Label>
                  <Input
                    value={vitalSigns.heart_rate}
                    onChange={(e) => setVitalSigns({...vitalSigns, heart_rate: e.target.value})}
                    placeholder="72 lpm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Frecuencia Respiratoria</Label>
                  <Input
                    value={vitalSigns.respiratory_rate}
                    onChange={(e) => setVitalSigns({...vitalSigns, respiratory_rate: e.target.value})}
                    placeholder="16 rpm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Temperatura</Label>
                  <Input
                    value={vitalSigns.temperature}
                    onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value})}
                    placeholder="36.5°C"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">SpO2</Label>
                  <Input
                    value={vitalSigns.spo2}
                    onChange={(e) => setVitalSigns({...vitalSigns, spo2: e.target.value})}
                    placeholder="98%"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Peso</Label>
                  <Input
                    value={vitalSigns.weight}
                    onChange={(e) => setVitalSigns({...vitalSigns, weight: e.target.value})}
                    placeholder="70 kg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Talla</Label>
                  <Input
                    value={vitalSigns.height}
                    onChange={(e) => setVitalSigns({...vitalSigns, height: e.target.value})}
                    placeholder="170 cm"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 7-8. Examen Físico y Ayudas */}
            {renderFieldWithMic("7. Examen Físico", physicalExam, setPhysicalExam, "physicalExam")}
            {renderFieldWithMic("8. Ayudas Diagnósticas", diagnosticAids, setDiagnosticAids, "diagnosticAids")}

            <Separator />

            {/* 9. Diagnóstico */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                {renderFieldWithMic("9. Diagnóstico", diagnosis, setDiagnosis, "diagnosis")}
              </div>
              <div>
                {renderFieldWithMic("Código CIE-10", cie10Code, setCie10Code, "cie10Code", false)}
              </div>
            </div>

            <Separator />

            {/* 10. Plan */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">10. Plan de Manejo</Label>
              {renderFieldWithMic("Tratamiento", treatment, setTreatment, "treatment")}
              {renderFieldWithMic("Educación al Paciente", education, setEducation, "education")}
              {renderFieldWithMic("Seguimiento", followup, setFollowup, "followup")}
            </div>

            <Separator />

            {/* 11. Consentimiento */}
            {renderFieldWithMic("11. Consentimiento Informado", consent, setConsent, "consent")}

            <Separator />

            {/* 12. Firma Médica */}
            <SignaturePad
              onSignatureChange={setDoctorSignature}
              initialSignature={doctorSignature}
            />

            <Separator />

            {/* 13. Notas de Evolución */}
            {renderFieldWithMic("13. Notas de Evolución (SOAP)", evolutionNotes, setEvolutionNotes, "evolutionNotes")}

            <Separator />

            {/* Additional Notes */}
            {renderFieldWithMic("Notas Adicionales", notes, setNotes, "notes")}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <Button
              size="lg"
              onClick={saveMedicalRecord}
              disabled={isSaving}
              className="w-full gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Historia Clínica Completa
                </>
              )}
            </Button>
          </CardContent>
        </Card>

      {/* Export Dialog after saving */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>✅ Historia Clínica Guardada</DialogTitle>
            <DialogDescription>
              Tu historia clínica ha sido guardada exitosamente. ¿Qué deseas hacer ahora?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {savedMedicalRecord && doctorProfile && (
              <ExportMedicalRecordPDF
                medicalRecord={savedMedicalRecord}
                patientName={patientName}
                doctorName={doctorProfile.full_name}
                doctorLicense={doctorProfile.license_number}
                doctorSignature={doctorSignature || undefined}
              />
            )}
            
            {savedRecordId && savedMedicalRecord && doctorProfile && (
              <MedicalDocumentGenerator
                medicalRecordId={savedRecordId}
                patientName={patientName}
                doctorName={doctorProfile.full_name}
                doctorLicense={doctorProfile.license_number}
                doctorSignature={doctorSignature || undefined}
              />
            )}
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setShowExportDialog(false);
                resetForm();
              }}
            >
              Crear Nueva Historia
            </Button>
          </div>
        </DialogContent>
      </Dialog>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default VoiceNotes;