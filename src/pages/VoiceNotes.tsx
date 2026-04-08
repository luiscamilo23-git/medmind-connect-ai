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
  History,
  Mic,
  Square,
  FileText,
  Loader2,
  Save,
  Sparkles,
  Download,
  Upload,
  User as UserIcon
} from "lucide-react";
import RecordingTimer from "@/components/RecordingTimer";
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
import { SpecialtyFields } from "@/components/SpecialtyFields";
import { MedicalSpecialty, SPECIALTY_CONFIGS, getFieldsForSpecialty } from "@/config/medicalSpecialties";
import { ClinicalAlerts, ClinicalAlertsData } from "@/components/ClinicalAlerts";
import { blobToWavBase64 } from "@/utils/audioWav";
import { ServiceSelector, SelectedService } from "@/components/ServiceSelector";
import { ConsentimientoInformadoDialog } from "@/components/ConsentimientoInformadoDialog";
import { PatientSearchCombobox, PatientOption } from "@/components/PatientSearchCombobox";
import { FileCheck, Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { InvoiceDialog } from "@/components/billing/InvoiceDialog";
import { PatientMedicalHistory } from "@/components/PatientMedicalHistory";

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
  
  const [servicioExpanded, setServicioExpanded] = useState(false);

  // Recording state for individual fields
  const [recordingField, setRecordingField] = useState<string | null>(null);
  
  // Speech Recognition
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const runAIAssistantRef = useRef<(() => void) | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [pendingAutoAnalyze, setPendingAutoAnalyze] = useState(false);
  const transcriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  
  // Medical record fields - Complete Colombian compliance
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientSex, setPatientSex] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [recordType, setRecordType] = useState("consultation");
  const [title, setTitle] = useState("");
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  
  // Dynamic specialty fields state
  const [specialtyFieldsValues, setSpecialtyFieldsValues] = useState<Record<string, any>>({});
  
  // Required fields (base fields - still maintained for backwards compatibility)
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
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  // Clinical alerts state
  const [clinicalAlerts, setClinicalAlerts] = useState<ClinicalAlertsData>({});
  
  // Selected service for the consultation (mandatory)
  const [selectedService, setSelectedService] = useState<SelectedService | null>(null);

  // Modalidad de atención — Res. 2654/2019
  const [modalidadAtencion, setModalidadAtencion] = useState<
    "presencial" | "telemedicina_interactiva" | "telemedicina_no_interactiva"
  >("presencial");
  const [consentimientoOpen, setConsentimientoOpen] = useState(false);
  const [consentimientoObtenido, setConsentimientoObtenido] = useState(false);
  const [linkedPatient, setLinkedPatient] = useState<PatientOption | null>(null);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get doctor specialty
  const doctorSpecialty: MedicalSpecialty = (doctorProfile?.specialty as MedicalSpecialty) || "MEDICO_GENERAL";
  const specialtyConfig = SPECIALTY_CONFIGS[doctorSpecialty];
  
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
            specialty: doctorSpecialty
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });

        if (error) {
          return;
        }
        
        if (data?.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      } catch (error) {
      } finally {
        setIsAnalyzing(false);
      }
    };

    const interval = setInterval(analyzeTranscript, 15000);
    if (transcript.length > 100) {
      analyzeTranscript();
    }

    return () => clearInterval(interval);
  }, [isRecording, transcript, doctorSpecialty]);

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
            setTranscript(prev => {
              const newTranscript = prev + final;
              transcriptRef.current = newTranscript;
              return newTranscript;
            });
          }
        }
        
        interimTranscriptRef.current = interim;
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
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
    // Check base fields first
    switch(field) {
      case 'patientIdentification': setPatientIdentification(prev => prev + text); return;
      case 'chiefComplaint': setChiefComplaint(prev => prev + text); return;
      case 'currentIllness': setCurrentIllness(prev => prev + text); return;
      case 'ros': setRos(prev => prev + text); return;
      case 'medicalHistory': setMedicalHistory(prev => prev + text); return;
      case 'physicalExam': setPhysicalExam(prev => prev + text); return;
      case 'diagnosticAids': setDiagnosticAids(prev => prev + text); return;
      case 'diagnosis': setDiagnosis(prev => prev + text); return;
      case 'cie10Code': setCie10Code(prev => prev + text); return;
      case 'treatment': setTreatment(prev => prev + text); return;
      case 'education': setEducation(prev => prev + text); return;
      case 'followup': setFollowup(prev => prev + text); return;
      case 'consent': setConsent(prev => prev + text); return;
      case 'evolutionNotes': setEvolutionNotes(prev => prev + text); return;
      case 'notes': setNotes(prev => prev + text); return;
    }
    
    // Check specialty fields
    setSpecialtyFieldsValues(prev => ({
      ...prev,
      [field]: (prev[field] || '') + text
    }));
  };

  const startFieldRecording = (field: string) => {
    setRecordingField(field);
    startRecording();
  };

  const stopFieldRecording = () => {
    stopRecording();
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
        transcriptRef.current = "";
      }
      setInterimTranscript("");
      interimTranscriptRef.current = "";
      recognitionRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "🎤 Grabación iniciada",
        description: recordingField ? `Transcribiendo ${getFieldLabel(recordingField)}` : "Transcripción en tiempo real activada",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar la grabación. Verifica los permisos del micrófono.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    const wasMainRecording = !recordingField; // Check if it was a full consultation recording
    
    // Capture any remaining interim text before stopping
    if (wasMainRecording && interimTranscriptRef.current) {
      setTranscript(prev => {
        const newTranscript = prev + interimTranscriptRef.current + ' ';
        transcriptRef.current = newTranscript;
        return newTranscript;
      });
      interimTranscriptRef.current = '';
      setInterimTranscript('');
    }
    
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
    
    // Trigger auto-analysis for main recording
    if (wasMainRecording) {
      setPendingAutoAnalyze(true);
      toast({
        title: "✓ Grabación detenida",
        description: "Procesando transcripción con IA...",
      });
    } else {
      toast({
        title: "✓ Grabación detenida",
        description: "Transcripción completada.",
      });
    }
  };

  const transcribeAudioBlob = async (blob: Blob) => {
    setIsTranscribingAudio(true);
    try {
      // Convert recorded WebM to WAV for better compatibility.
      const base64Audio = await blobToWavBase64(blob);

      const invokePromise = supabase.functions.invoke('transcribe-audio', {
        body: {
          audio: base64Audio,
          mimeType: 'audio/wav',
          fileName: 'consulta.wav',
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('La transcripción está tardando demasiado (timeout). Intenta de nuevo.')), 60_000)
      );

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'No se pudo transcribir el audio');
      if (!data?.text) throw new Error('No se recibió transcripción');

      setTranscript(data.text);
      transcriptRef.current = data.text;
      return data.text as string;
    } finally {
      setIsTranscribingAudio(false);
    }
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
    
    // Also check specialty fields
    const specialtyFields = getFieldsForSpecialty(doctorSpecialty);
    const specialtyField = specialtyFields.find(f => f.key === field);
    if (specialtyField) {
      return specialtyField.label;
    }
    
    return labels[field] || field;
  };

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
      // Paso 1: Autocompletar campos vacíos con contexto de especialidad
      const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-clinical-info', {
        body: { 
          transcript,
          specialty: doctorSpecialty
        }
      });

      if (extractError) throw extractError;

      const extracted = extractData.extractedData;
      const alerts = extractData.clinicalAlerts;
      
      
      // Actualizar alertas clínicas
      if (alerts) {
        setClinicalAlerts(alerts);
        
        // Notificar al médico si hay alertas críticas
        const criticalVitals = alerts.vitalSignAlerts?.filter((a: any) => a.status === 'critical') || [];
        const severeInteractions = alerts.drugInteractions?.filter((d: any) => d.severity === 'severe') || [];
        
        if (criticalVitals.length > 0 || severeInteractions.length > 0) {
          toast({
            title: "⚠️ Alertas Críticas Detectadas",
            description: `${criticalVitals.length} signos vitales críticos, ${severeInteractions.length} interacciones severas`,
            variant: "destructive",
          });
        }
      }
      
      // Autocompletar solo campos vacíos con información detectada por la IA
      if (extracted.patientName && !patientName) setPatientName(extracted.patientName);
      if (extracted.patientIdentification && !patientIdentification) setPatientIdentification(extracted.patientIdentification);
      if (extracted.patientAge && !patientAge) setPatientAge(extracted.patientAge);
      if (extracted.patientSex && !patientSex) setPatientSex(extracted.patientSex);
      if (extracted.patientPhone && !patientPhone) setPatientPhone(extracted.patientPhone);
      if (extracted.patientAddress && !patientAddress) setPatientAddress(extracted.patientAddress);
      if (extracted.chiefComplaint && !chiefComplaint) {
        setChiefComplaint(extracted.chiefComplaint);
        if (!title) setTitle(extracted.chiefComplaint);
      }
      if (extracted.currentIllness && !currentIllness) setCurrentIllness(extracted.currentIllness);
      if (extracted.ros && !ros) setRos(extracted.ros);
      
      // Handle structured ROS from AI
      if (extracted.rosStructured) {
        setSpecialtyFieldsValues(prev => ({
          ...prev,
          ros_general: prev.ros_general || extracted.rosStructured.ros_general || "",
          ros_cardiovascular: prev.ros_cardiovascular || extracted.rosStructured.ros_cardiovascular || "",
          ros_respiratorio: prev.ros_respiratorio || extracted.rosStructured.ros_respiratorio || "",
          ros_digestivo: prev.ros_digestivo || extracted.rosStructured.ros_digestivo || "",
          ros_genitourinario: prev.ros_genitourinario || extracted.rosStructured.ros_genitourinario || "",
          ros_musculoesqueletico: prev.ros_musculoesqueletico || extracted.rosStructured.ros_musculoesqueletico || "",
          ros_neurologico: prev.ros_neurologico || extracted.rosStructured.ros_neurologico || "",
          ros_piel: prev.ros_piel || extracted.rosStructured.ros_piel || "",
          ros_endocrino: prev.ros_endocrino || extracted.rosStructured.ros_endocrino || "",
          ros_psiquiatrico: prev.ros_psiquiatrico || extracted.rosStructured.ros_psiquiatrico || "",
        }));
      }
      
      // Handle companion info
      if (extracted.hasCompanion) {
        setSpecialtyFieldsValues(prev => ({
          ...prev,
          has_companion: extracted.hasCompanion || prev.has_companion || "no",
          companion_name: prev.companion_name || extracted.companionName || "",
          companion_relationship: prev.companion_relationship || extracted.companionRelationship || "",
          companion_phone: prev.companion_phone || extracted.companionPhone || "",
          companion_id: prev.companion_id || extracted.companionId || "",
        }));
      }
      
      // Antecedentes - combinar todos los tipos (y también mapear a campos visibles)
      const antecedentesExtraidos = [
        extracted.medicalHistory,
        extracted.personalHistory && `Personales: ${extracted.personalHistory}`,
        extracted.familyHistory && `Familiares: ${extracted.familyHistory}`,
        extracted.surgicalHistory && `Quirúrgicos: ${extracted.surgicalHistory}`,
        extracted.currentMedications && `Medicamentos: ${extracted.currentMedications}`,
        extracted.allergies && `Alergias: ${extracted.allergies}`
      ].filter(Boolean).join('\n');
      if (antecedentesExtraidos && !medicalHistory) setMedicalHistory(antecedentesExtraidos);

      // Estos son los campos que la UI realmente muestra en la sección "Antecedentes"
      setSpecialtyFieldsValues(prev => ({
        ...prev,
        personal_history: (prev.personal_history || extracted.personalHistory || ""),
        family_history: (prev.family_history || extracted.familyHistory || ""),
        current_medications: (prev.current_medications || extracted.currentMedications || ""),
        allergies: (prev.allergies || extracted.allergies || ""),
      }));
      
      if (extracted.physicalExam && !physicalExam) setPhysicalExam(extracted.physicalExam);
      if (extracted.diagnosticAids && !diagnosticAids) setDiagnosticAids(extracted.diagnosticAids);
      if (extracted.diagnosis && !diagnosis) setDiagnosis(extracted.diagnosis);
      if (extracted.cie10Code && !cie10Code) setCie10Code(extracted.cie10Code);
      
      // Plan de manejo - combinar treatment y treatmentPlan
      const planManejo = extracted.treatmentPlan || extracted.treatment;
      if (planManejo && !treatment) setTreatment(planManejo);
      
      if (extracted.consent && !consent) setConsent(extracted.consent);
      if (extracted.education && !education) setEducation(extracted.education);
      if (extracted.followup && !followup) setFollowup(extracted.followup);
      if (extracted.medications && Array.isArray(extracted.medications) && medications.length === 0) {
        setMedications(extracted.medications);
      }
      
      // Autocompletar fecha y hora del encuentro
      if (extracted.encounterDateTime) {
        setSpecialtyFieldsValues(prev => ({
          ...prev,
          encounter_date: prev.encounter_date || extracted.encounterDateTime,
        }));
      }
      
      // Autocompletar signos vitales
      if (extracted.vitalSigns) {
        setVitalSigns(prev => ({
          blood_pressure: extracted.vitalSigns.blood_pressure || prev.blood_pressure,
          heart_rate: extracted.vitalSigns.heart_rate || prev.heart_rate,
          respiratory_rate: extracted.vitalSigns.respiratory_rate || prev.respiratory_rate,
          temperature: extracted.vitalSigns.temperature || prev.temperature,
          spo2: extracted.vitalSigns.spo2 || prev.spo2,
          weight: extracted.vitalSigns.weight || prev.weight,
          height: extracted.vitalSigns.height || prev.height
        }));
      }
      
      // Autocompletar campos específicos de especialidad
      if (extracted.specialtyFields) {
        setSpecialtyFieldsValues(prev => {
          const updated = { ...prev };
          for (const [key, value] of Object.entries(extracted.specialtyFields)) {
            if (value && !prev[key]) {
              updated[key] = value;
            }
          }
          return updated;
        });
      }

      // Paso 2: Analizar y sugerir preguntas faltantes (con delay para evitar rate limit)
      setIsAnalyzing(true);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      let suggestRetries = 0;
      let suggestSuccess = false;
      while (suggestRetries < 3 && !suggestSuccess) {
        const { data: suggestData, error: suggestError } = await supabase.functions.invoke('analyze-clinical-transcript', {
          body: { 
            transcript,
            specialty: doctorSpecialty
          }
        });

        if (!suggestError && suggestData?.suggestions) {
          setSuggestions(suggestData.suggestions);
          suggestSuccess = true;
        } else if (suggestError || suggestData?.error?.includes('Límite')) {
          suggestRetries++;
          console.warn(`Analyze retry ${suggestRetries}/3...`);
          if (suggestRetries < 3) await new Promise(resolve => setTimeout(resolve, 4000));
        } else {
          break;
        }
      }

      toast({
        title: "✨ Asistente IA completado",
        description: `Campos autocompletados según tu especialidad: ${specialtyConfig?.name || doctorSpecialty}`,
      });
    } catch (error: any) {
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

  // If speech recognition produced no transcript, transcribe from the recorded audio
  useEffect(() => {
    if (!pendingAutoAnalyze) return;
    if (isRecording) return;
    if (!audioBlob) return;
    if ((transcriptRef.current || transcript || '').length > 20) return;
    if (isTranscribingAudio) return;

    transcribeAudioBlob(audioBlob).catch((err: any) => {
      toast({
        title: 'Error de transcripción',
        description: err?.message || 'No se pudo transcribir la grabación.',
        variant: 'destructive',
      });
    });
  }, [pendingAutoAnalyze, isRecording, audioBlob, transcript, isTranscribingAudio]);

  // Auto-run AI analysis when transcript is ready
  useEffect(() => {
    if (!pendingAutoAnalyze) return;
    if (isRecording) return;
    if (!transcript || transcript.length <= 20) return;
    if (isTranscribingAudio) return;

    setPendingAutoAnalyze(false);
    const timer = setTimeout(() => {
      runAIAssistant();
    }, 300);
    return () => clearTimeout(timer);
  }, [pendingAutoAnalyze, isRecording, transcript, isTranscribingAudio]);

  // Handler para seleccionar código CIE-10 desde alertas
  const handleSelectCIE10 = (code: string) => {
    setCie10Code(code);
    toast({
      title: "Código CIE-10 seleccionado",
      description: code,
    });
  };

  // Handler para descartar interacción medicamentosa
  const handleDismissInteraction = (index: number) => {
    setClinicalAlerts(prev => ({
      ...prev,
      drugInteractions: prev.drugInteractions?.filter((_, i) => i !== index)
    }));
  };

  // Handler para cambios en SpecialtyFields
  const handleSpecialtyFieldChange = (key: string, value: any) => {
    // Map keys (config/medicalSpecialties.ts) to our local state
    if (key === 'patient_identification') {
      setPatientIdentification(value);
      return;
    }
    if (key === 'patient_name') {
      setPatientName(value);
      return;
    }

    // Datos del paciente (estos campos existen en BASE_FIELDS)
    if (key === 'age') {
      setPatientAge(value);
      return;
    }
    if (key === 'sex') {
      setPatientSex(value);
      return;
    }
    if (key === 'phone') {
      setPatientPhone(value);
      return;
    }
    if (key === 'address') {
      setPatientAddress(value);
      return;
    }

    if (key === 'chief_complaint') {
      setChiefComplaint(value);
      return;
    }
    if (key === 'current_illness') {
      setCurrentIllness(value);
      return;
    }

    // Antecedentes (la UI los muestra como campos separados)
    if (key === 'personal_history' || key === 'family_history' || key === 'current_medications' || key === 'allergies') {
      setSpecialtyFieldsValues(prev => ({ ...prev, [key]: value }));
      return;
    }

    // Signos vitales
    if (key === 'blood_pressure') {
      setVitalSigns(prev => ({ ...prev, blood_pressure: value }));
      return;
    }
    if (key === 'heart_rate') {
      setVitalSigns(prev => ({ ...prev, heart_rate: value }));
      return;
    }
    if (key === 'respiratory_rate') {
      setVitalSigns(prev => ({ ...prev, respiratory_rate: value }));
      return;
    }
    if (key === 'temperature') {
      setVitalSigns(prev => ({ ...prev, temperature: value }));
      return;
    }
    if (key === 'spo2') {
      setVitalSigns(prev => ({ ...prev, spo2: value }));
      return;
    }
    if (key === 'weight') {
      setVitalSigns(prev => ({ ...prev, weight: value }));
      return;
    }
    if (key === 'height') {
      setVitalSigns(prev => ({ ...prev, height: value }));
      return;
    }

    // Examen
    if (key === 'ros') {
      setRos(value);
      return;
    }
    if (key === 'physical_exam') {
      setPhysicalExam(value);
      return;
    }

    // Diagnóstico
    if (key === 'diagnosis') {
      setDiagnosis(value);
      return;
    }
    if (key === 'cie10_code') {
      setCie10Code(value);
      return;
    }

    // Plan
    if (key === 'treatment_plan') {
      setTreatment(value);
      return;
    }
    if (key === 'consent') {
      setConsent(value);
      return;
    }

    // Todo lo demás lo guardamos como campo especializado
    setSpecialtyFieldsValues(prev => ({ ...prev, [key]: value }));
  };

  const handleLinkedPatientSelect = (patient: PatientOption | null) => {
    setLinkedPatient(patient);
    if (patient) {
      setPatientName(patient.full_name);
      setPatientPhone(patient.phone || "");
      setPatientAddress(patient.address || "");
      if (patient.date_of_birth) {
        const age = Math.floor(
          (Date.now() - new Date(patient.date_of_birth).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25)
        );
        setPatientAge(String(age));
      }
      if (patient.allergies?.length) {
        setSpecialtyFieldsValues(prev => ({ ...prev, allergies: patient.allergies!.join(", ") }));
      }
    } else {
      setPatientName("");
      setPatientPhone("");
      setPatientAddress("");
      setPatientAge("");
    }
  };

  // Get combined values for SpecialtyFields component
  const getSpecialtyFieldsValues = (): Record<string, any> => {
    return {
      // Datos del paciente
      patient_identification: patientIdentification,
      patient_name: patientName,
      age: patientAge,
      sex: patientSex,
      phone: patientPhone,
      address: patientAddress,

      // Encuentro
      chief_complaint: chiefComplaint,
      current_illness: currentIllness,

      // Antecedentes (visibles en UI)
      personal_history: specialtyFieldsValues.personal_history || "",
      family_history: specialtyFieldsValues.family_history || "",
      current_medications: specialtyFieldsValues.current_medications || "",
      allergies: specialtyFieldsValues.allergies || "",

      // Signos vitales
      blood_pressure: vitalSigns.blood_pressure,
      heart_rate: vitalSigns.heart_rate,
      respiratory_rate: vitalSigns.respiratory_rate,
      temperature: vitalSigns.temperature,
      spo2: vitalSigns.spo2,
      weight: vitalSigns.weight,
      height: vitalSigns.height,

      // Examen
      ros: ros,
      physical_exam: physicalExam,

      // Dx + plan
      diagnosis: diagnosis,
      cie10_code: cie10Code,
      treatment_plan: treatment,
      consent: consent,

      // Campos específicos
      ...specialtyFieldsValues,
    };
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

      let patientId: string;

      if (linkedPatient) {
        // Patient already linked via combobox — use directly
        patientId = linkedPatient.id;
      } else {
        // Search for existing patient by name
        const { data: existingPatients, error: searchError } = await supabase
          .from('patients')
          .select('id')
          .eq('doctor_id', user.id)
          .ilike('full_name', patientName.trim())
          .limit(1);

        if (searchError) throw searchError;

        if (existingPatients && existingPatients.length > 0) {
          patientId = existingPatients[0].id;
          // Actualizar datos del paciente si la IA los extrajo
          const updateData: Record<string, any> = {};
          if (patientPhone && patientPhone !== 'Sin especificar') updateData.phone = patientPhone;
          if (patientAddress) updateData.address = patientAddress;
          if (patientSex) updateData.sex = patientSex;

          if (Object.keys(updateData).length > 0) {
            await supabase
              .from('patients')
              .update(updateData)
              .eq('id', patientId);
          }
        } else {
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert([{
            doctor_id: user.id,
            full_name: patientName.trim(),
            phone: patientPhone || 'Sin especificar',
            address: patientAddress || null,
            sex: patientSex || null,
          }])
          .select('id')
          .single();

        if (createError) throw createError;
        if (!newPatient) throw new Error('Failed to create patient');

        patientId = newPatient.id;
        }
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

      // Combine medical history from specialty fields
      const combinedMedicalHistory = [
        medicalHistory,
        specialtyFieldsValues.personal_history && `Antecedentes Personales: ${specialtyFieldsValues.personal_history}`,
        specialtyFieldsValues.family_history && `Antecedentes Familiares: ${specialtyFieldsValues.family_history}`,
        specialtyFieldsValues.current_medications && `Medicamentos Actuales: ${specialtyFieldsValues.current_medications}`,
        specialtyFieldsValues.allergies && `Alergias: ${specialtyFieldsValues.allergies}`,
      ].filter(Boolean).join('\n\n');

      // Save complete medical record with specialty fields in notes
      const specialtyNotes = Object.entries(specialtyFieldsValues)
        .filter(([key, value]) => value && !['personal_history', 'family_history', 'current_medications', 'allergies'].includes(key))
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      // Determine RIPS status based on service modalidad (only if service selected)
      const ripsStatus = selectedService?.modalidad === 'eps_aseguradora' ? 'pendiente' : 'no_aplica';

      const recordPayload: Record<string, any> = {
          doctor_id: user.id,
          patient_id: patientId,
          service_id: selectedService?.id || null,
          rips_status: ripsStatus,
          record_type: recordType as "consultation" | "procedure" | "diagnosis" | "prescription" | "lab_result" | "imaging",
          title,
          patient_identification: patientIdentification,
          chief_complaint: chiefComplaint,
          current_illness: currentIllness,
          ros: ros,
          medical_history: combinedMedicalHistory || medicalHistory,
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
          notes: [notes, specialtyNotes].filter(Boolean).join('\n\n--- Campos Especializados ---\n'),
          voice_transcript: transcript,
          modalidad_atencion: modalidadAtencion,
      };

      let { data: savedRecord, error } = await supabase.from('medical_records')
        .insert([recordPayload])
        .select('*')
        .single();

      // Fallback: if column doesn't exist yet in DB, retry without modalidad_atencion
      if (error?.message?.includes('modalidad_atencion')) {
        const { modalidad_atencion: _, ...payloadWithout } = recordPayload;
        const retry = await supabase.from('medical_records')
          .insert([payloadWithout])
          .select('*')
          .single();
        savedRecord = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      
      // Save record ID and full record for document generation
      if (savedRecord) {
        setSavedRecordId(savedRecord.id);
        setSavedMedicalRecord(savedRecord);
        setShowExportDialog(true); // Show export dialog after save
      }

      // Show appropriate message based on service type
      const ripsMessage = selectedService?.modalidad === 'eps_aseguradora'
        ? "📋 RIPS pendientes de generación para este servicio EPS."
        : selectedService ? "ℹ️ Servicio particular registrado." : "";

      toast({
        title: "✅ Historia clínica guardada",
        description: `${specialtyConfig?.name || 'Médico General'}${selectedService ? ` - ${selectedService.nombre_servicio}` : ""}. ${ripsMessage}`.trim(),
      });
    } catch (error: any) {
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
    setSelectedService(null);
    setSpecialtyFieldsValues({});
    setModalidadAtencion("presencial");
    setConsentimientoObtenido(false);
    audioChunksRef.current = [];
    setAudioBlob(null);
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
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold truncate">
                    <span className="bg-gradient-feature-soft bg-clip-text text-transparent">VoiceNotes MD</span>
                  </h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">
                    {specialtyConfig?.name || 'Médico General'} • Historia Clínica con IA
                  </p>
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
              <div className="relative overflow-hidden bg-primary rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
                <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full -mr-16 sm:-mr-24 -mt-16 sm:-mt-24" />
                <HeartbeatLine color="muted" variant="card" intensity="low" speed="slow" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                    <h2 className="text-base sm:text-xl font-bold">
                      Historia Clínica - {specialtyConfig?.name || 'Médico General'}
                    </h2>
                  </div>
                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                    {specialtyConfig?.description || 'Atención primaria y medicina familiar'} • Cumple con normativa colombiana (Resolución 1995/1999)
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
                          <div className="flex items-center justify-center gap-3 flex-wrap">
                            <Button
                              size="default"
                              onClick={() => startRecording()}
                              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 text-sm sm:text-base"
                              disabled={isRecording && recordingField !== null}
                            >
                              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                              Iniciar Grabación Completa
                            </Button>
                            {audioBlob && (
                              <Button
                                size="default"
                                variant="secondary"
                                onClick={downloadAudio}
                                className="gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-md text-sm sm:text-base"
                              >
                                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                Descargar Audio
                              </Button>
                            )}
                          </div>
                          {(isAutocompleting || isAnalyzing) && (
                            <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm font-medium">Analizando con IA...</span>
                            </div>
                          )}
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
                          
                          {/* Recording Timer */}
                          <RecordingTimer isRecording={isRecording && !recordingField} className="mx-auto" />
                          
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
                      onTranscriptionComplete={(text) => {
                        setTranscript(text);
                        transcriptRef.current = text;
                        setPendingAutoAnalyze(true);
                      }}
                    />
                  </div>

                  {isRecording && !recordingField && (
                    <div className="space-y-4">
                      <Badge variant="destructive" className="animate-pulse text-base py-2.5 px-5 w-full justify-center rounded-xl shadow-lg shadow-destructive/25">
                        ● GRABANDO CONSULTA COMPLETA
                      </Badge>

                      {/* Suggestions while recording */}
                      {suggestions.length > 0 && (
                        <Card className="bg-primary/5 border-primary/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary" />
                              Sugerencias de IA para {specialtyConfig?.name || 'Médico General'}
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
                          Paso 2: Organiza con IA ({specialtyConfig?.name}) o llena manualmente los campos
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

              {/* Clinical Alerts - Semi-automatic mode */}
              {(clinicalAlerts.vitalSignAlerts?.length || clinicalAlerts.drugInteractions?.length || 
                clinicalAlerts.cie10Suggestions?.length || clinicalAlerts.labResults?.length) ? (
                <ClinicalAlerts 
                  data={clinicalAlerts}
                  onSelectCIE10={handleSelectCIE10}
                  onDismissInteraction={handleDismissInteraction}
                />
              ) : null}

              {/* Service Selection - OPTIONAL */}
              <Card className="border border-border">
                <CardHeader
                  className="pb-3 cursor-pointer select-none"
                  onClick={() => setServicioExpanded(v => !v)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      📋 Servicio Médico
                      <Badge variant="secondary" className="text-xs">Opcional</Badge>
                      {selectedService && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {selectedService.nombre_servicio}
                        </Badge>
                      )}
                    </CardTitle>
                    {servicioExpanded
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                  {!servicioExpanded && (
                    <CardDescription className="text-xs mt-1">
                      {selectedService
                        ? `CUPS: ${selectedService.codigo_cups || '—'} · $${selectedService.precio_unitario?.toLocaleString('es-CO')}`
                        : "Haz clic para seleccionar el servicio a facturar"}
                    </CardDescription>
                  )}
                </CardHeader>
                {servicioExpanded && (
                  <CardContent className="pt-0">
                    <ServiceSelector
                      selectedService={selectedService}
                      onServiceSelect={setSelectedService}
                      disabled={isSaving}
                    />
                  </CardContent>
                )}
              </Card>

              {/* Modalidad de atención — Res. 2654/2019 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Modalidad de Atención</CardTitle>
                  <CardDescription className="text-xs">
                    Resolución 2654/2019 — Obligatorio registrar la modalidad de atención
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-sm font-medium">Modalidad</Label>
                      <Select
                        value={modalidadAtencion}
                        onValueChange={(v) => {
                          setModalidadAtencion(v as typeof modalidadAtencion);
                          setConsentimientoObtenido(false);
                        }}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-full sm:w-72">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="presencial">Presencial</SelectItem>
                          <SelectItem value="telemedicina_interactiva">Telemedicina interactiva</SelectItem>
                          <SelectItem value="telemedicina_no_interactiva">Telemedicina no interactiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3 pt-1 sm:pt-5">
                      {modalidadAtencion === "presencial" ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300 gap-1.5">
                          <FileCheck className="w-3.5 h-3.5" />
                          Consentimiento general en archivo
                        </Badge>
                      ) : consentimientoObtenido ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300 gap-1.5">
                          <FileCheck className="w-3.5 h-3.5" />
                          Consentimiento telemedicina obtenido
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConsentimientoOpen(true)}
                          disabled={isSaving}
                          className="gap-2"
                        >
                          <FileCheck className="w-4 h-4" />
                          Consentimiento telemedicina
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vincular paciente existente */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Vincular Paciente</CardTitle>
                  <CardDescription className="text-xs">
                    Busca un paciente registrado para vincular esta historia clínica y auto-completar sus datos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PatientSearchCombobox
                    selectedPatient={linkedPatient}
                    onSelect={handleLinkedPatientSelect}
                    disabled={isSaving}
                  />
                  {linkedPatient && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => setHistoryPanelOpen(true)}
                    >
                      <History className="w-4 h-4 mr-2" />
                      Ver historial de {linkedPatient.full_name}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Title Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Información Básica</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título de la Historia</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Consulta por dolor abdominal"
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
                </CardContent>
              </Card>

              {/* Dynamic Specialty Fields */}
              <SpecialtyFields
                specialty={doctorSpecialty}
                values={getSpecialtyFieldsValues()}
                onChange={handleSpecialtyFieldChange}
                isRecording={isRecording}
                recordingField={recordingField}
                onStartRecording={startFieldRecording}
                onStopRecording={stopFieldRecording}
                interimTranscript={interimTranscript}
              />

              <Separator className="my-6" />

              {/* Signature */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Firma Digital del Médico</span>
                    {doctorProfile?.signature_url && !doctorSignature && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDoctorSignature(doctorProfile.signature_url);
                          toast({
                            title: "✓ Firma importada",
                            description: "Se ha cargado tu firma guardada en el perfil",
                          });
                        }}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Importar Firma del Perfil
                      </Button>
                    )}
                  </CardTitle>
                  {!doctorProfile?.signature_url && (
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Guarda tu firma en <a href="/profile" className="text-primary underline">tu perfil</a> para importarla automáticamente
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <SignaturePad
                    onSignatureChange={setDoctorSignature}
                    initialSignature={doctorSignature}
                  />
                </CardContent>
              </Card>

              {/* Evolution Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notas de Evolución (SOAP)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Notas de Evolución</Label>
                      <Button
                        size="sm"
                        variant={isRecording && recordingField === 'evolutionNotes' ? "destructive" : "outline"}
                        onClick={() => isRecording && recordingField === 'evolutionNotes' ? stopRecording() : startFieldRecording('evolutionNotes')}
                        className="gap-2"
                      >
                        {isRecording && recordingField === 'evolutionNotes' ? (
                          <><Square className="w-4 h-4" />Detener</>
                        ) : (
                          <><Mic className="w-4 h-4" />Transcribir</>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={evolutionNotes}
                      onChange={(e) => setEvolutionNotes(e.target.value)}
                      placeholder="Subjective, Objective, Assessment, Plan"
                      rows={4}
                      className={isRecording && recordingField === 'evolutionNotes' ? "border-destructive animate-pulse" : ""}
                    />
                  </div>
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
                        Guardar Historia Clínica - {specialtyConfig?.name || 'Médico General'}
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
                      Historia de {specialtyConfig?.name || 'Médico General'} guardada exitosamente. ¿Qué deseas hacer ahora?
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
                    
                    {selectedService && (
                      <Button
                        className="w-full gap-2"
                        onClick={() => {
                          setShowExportDialog(false);
                          setShowInvoiceDialog(true);
                        }}
                      >
                        <Receipt className="w-4 h-4" />
                        Generar Factura
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setShowExportDialog(false);
                        resetForm();
                      }}
                    >
                      Nueva Consulta
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Invoice dialog pre-filled from this consultation */}
              <InvoiceDialog
                open={showInvoiceDialog}
                onOpenChange={setShowInvoiceDialog}
                initialPatientId={linkedPatient?.id}
                initialServiceId={selectedService?.id}
                initialMedicalRecordId={savedRecordId || undefined}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Historial del paciente vinculado */}
      <PatientMedicalHistory
        open={historyPanelOpen}
        onOpenChange={setHistoryPanelOpen}
        patient={linkedPatient ? { id: linkedPatient.id, full_name: linkedPatient.full_name } : null}
      />

      {/* Consentimiento informado */}
      {doctorProfile?.id && (
        <ConsentimientoInformadoDialog
          open={consentimientoOpen}
          onOpenChange={setConsentimientoOpen}
          patientId=""
          patientName={patientName}
          medicoId={doctorProfile.id}
          tipo={modalidadAtencion.startsWith("telemedicina") ? "telemedicina" : "consulta_general"}
          onConfirmed={() => setConsentimientoObtenido(true)}
        />
      )}
    </SidebarProvider>
  );
};

export default VoiceNotes;