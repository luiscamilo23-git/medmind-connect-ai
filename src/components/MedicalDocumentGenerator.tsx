import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  FileText,
  Microscope,
  Camera,
  FileCheck,
  UserCheck,
  ClipboardX,
  Download,
  Loader2,
  Mic,
  MicOff,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface MedicalDocumentGeneratorProps {
  medicalRecordId: string;
  patientName: string;
  doctorName: string;
  doctorLicense?: string;
  doctorSignature?: string;
}

const documentTypes = [
  { id: "prescription", label: "Fórmula Médica", icon: FileText, color: "text-blue-600" },
  { id: "lab_order", label: "Orden de Laboratorio", icon: Microscope, color: "text-primary" },
  { id: "image_order", label: "Orden de Imágenes", icon: Camera, color: "text-green-600" },
  { id: "certificate", label: "Certificado Médico", icon: FileCheck, color: "text-orange-600" },
  { id: "referral", label: "Remisión", icon: UserCheck, color: "text-pink-600" },
  { id: "disability", label: "Incapacidad", icon: ClipboardX, color: "text-red-600" },
];

interface Template {
  id: string;
  template_name: string;
  document_type: string;
  custom_fields: any;
}

export const MedicalDocumentGenerator = ({
  medicalRecordId,
  patientName,
  doctorName,
  doctorLicense,
  doctorSignature,
}: MedicalDocumentGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [editableData, setEditableData] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingField, setRecordingField] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        
        if (finalTranscript && recordingField) {
          appendToField(recordingField, finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast.error(`Error en reconocimiento de voz: ${event.error}`);
          setIsRecording(false);
          setRecordingField(null);
        }
      };

      recognition.onend = () => {
        if (isRecording && recordingField) {
          try {
            recognition.start();
          } catch (e) {
            console.error('Error restarting recognition:', e);
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording, recordingField]);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTemplates(data as Template[]);
    }
  };

  const generateDocument = async (documentType: string) => {
    setLoading(true);
    setSelectedType(documentType);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-medical-document', {
        body: { 
          medicalRecordId, 
          documentType,
          templateId: selectedTemplate || null
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error al generar documento');
      }

      if (!data?.document) {
        throw new Error('No se recibió el documento generado');
      }

      setGeneratedData(data.document);
      setEditableData(JSON.parse(JSON.stringify(data.document.document_data)));
      toast.success("Documento generado exitosamente. Revísalo y edítalo antes de descargar.");
    } catch (error: any) {
      console.error('Error generating document:', error);
      toast.error(error.message || "Error al generar documento");
      setSelectedType(null);
    } finally {
      setLoading(false);
    }
  };

  const appendToField = (field: string, text: string) => {
    setEditableData((prev: any) => {
      const newData = { ...prev };
      const fieldPath = field.split('.');
      
      if (fieldPath.length === 1) {
        newData[field] = (newData[field] || '') + text;
      } else if (fieldPath.length === 3) {
        const [array, index, prop] = fieldPath;
        if (!newData[array]) newData[array] = [];
        if (!newData[array][parseInt(index)]) newData[array][parseInt(index)] = {};
        newData[array][parseInt(index)][prop] = (newData[array][parseInt(index)][prop] || '') + text;
      }
      
      return newData;
    });
  };

  const startFieldRecording = (field: string) => {
    if (isRecording && recordingField === field) {
      stopRecording();
      return;
    }
    
    if (isRecording) {
      stopRecording();
    }
    
    setRecordingField(field);
    startRecording();
  };

  const startRecording = async () => {
    if (!recognitionRef.current) {
      toast.error("Reconocimiento de voz no disponible");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
      recognitionRef.current.start();
      setIsRecording(true);
      toast.success("🎤 Grabación iniciada");
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("No se pudo iniciar la grabación");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }

    setIsRecording(false);
    setRecordingField(null);
    toast.success("✓ Grabación detenida");
  };

  const updateField = (field: string, value: string) => {
    setEditableData((prev: any) => {
      const newData = { ...prev };
      const fieldPath = field.split('.');
      
      if (fieldPath.length === 1) {
        newData[field] = value;
      } else if (fieldPath.length === 3) {
        const [array, index, prop] = fieldPath;
        if (!newData[array]) newData[array] = [];
        if (!newData[array][parseInt(index)]) newData[array][parseInt(index)] = {};
        newData[array][parseInt(index)][prop] = value;
      }
      
      return newData;
    });
  };

  const downloadPDF = () => {
    if (!editableData) return;

    const doc = new jsPDF();
    const docData = editableData;
    
    // Header with doctor info
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(doctorName, 20, 20);
    if (doctorLicense) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Reg. Médico: ${doctorLicense}`, 20, 26);
    }
    
    // Document title
    const docLabel = documentTypes.find(d => d.id === selectedType)?.label || 'DOCUMENTO MÉDICO';
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(docLabel.toUpperCase(), 105, 40, { align: 'center' });
    
    // Patient info
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Paciente: ${patientName}`, 20, 55);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 20, 61);
    
    doc.line(20, 65, 190, 65);
    
    let y = 75;
    doc.setFont("helvetica", "normal");
    
    // Content based on document type
    if (selectedType === 'prescription' && docData.medications) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('MEDICAMENTOS PRESCRITOS:', 20, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      
      docData.medications.forEach((med: any, i: number) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${i + 1}. ${med.name}`, 25, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        if (med.presentation) doc.text(`   Presentación: ${med.presentation}`, 25, y), y += 5;
        if (med.dose) doc.text(`   Dosis: ${med.dose}`, 25, y), y += 5;
        if (med.frequency) doc.text(`   Frecuencia: ${med.frequency}`, 25, y), y += 5;
        if (med.duration) doc.text(`   Duración: ${med.duration}`, 25, y), y += 5;
        if (med.route) doc.text(`   Vía: ${med.route}`, 25, y), y += 5;
        if (med.instructions) {
          const lines = doc.splitTextToSize(`   Instrucciones: ${med.instructions}`, 165);
          doc.text(lines, 25, y);
          y += lines.length * 5;
        }
        y += 5;
      });
      
      if (docData.generalInstructions) {
        if (y > 220) { doc.addPage(); y = 20; }
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text('INDICACIONES GENERALES:', 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(docData.generalInstructions, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 5;
      }

      if (docData.warnings && docData.warnings.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text('ADVERTENCIAS:', 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        docData.warnings.forEach((warning: string) => {
          const lines = doc.splitTextToSize(`• ${warning}`, 170);
          doc.text(lines, 20, y);
          y += lines.length * 5;
        });
      }
    } 
    else if (selectedType === 'lab_order' && docData.tests) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('EXÁMENES DE LABORATORIO SOLICITADOS:', 20, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      
      docData.tests.forEach((test: any, i: number) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${i + 1}. ${test.name}`, 25, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        if (test.code) doc.text(`   Código: ${test.code}`, 25, y), y += 5;
        if (test.urgency) doc.text(`   Urgencia: ${test.urgency}`, 25, y), y += 5;
        if (test.specialInstructions) {
          const lines = doc.splitTextToSize(`   Preparación: ${test.specialInstructions}`, 165);
          doc.text(lines, 25, y);
          y += lines.length * 5;
        }
        y += 5;
      });
      
      if (docData.clinicalIndication) {
        if (y > 220) { doc.addPage(); y = 20; }
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text('INDICACIÓN CLÍNICA:', 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(docData.clinicalIndication, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5;
      }
    }
    else if (selectedType === 'image_order' && docData.studies) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('ESTUDIOS DE IMAGEN SOLICITADOS:', 20, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      
      docData.studies.forEach((study: any, i: number) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${i + 1}. ${study.name}`, 25, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        if (study.modality) doc.text(`   Modalidad: ${study.modality}`, 25, y), y += 5;
        if (study.bodyPart) doc.text(`   Región: ${study.bodyPart}`, 25, y), y += 5;
        if (study.urgency) doc.text(`   Urgencia: ${study.urgency}`, 25, y), y += 5;
        if (study.projection) doc.text(`   Proyección: ${study.projection}`, 25, y), y += 5;
        if (study.contrast) doc.text(`   Contraste: ${study.contrast}`, 25, y), y += 5;
        if (study.specialInstructions) {
          const lines = doc.splitTextToSize(`   Preparación: ${study.specialInstructions}`, 165);
          doc.text(lines, 25, y);
          y += lines.length * 5;
        }
        y += 5;
      });
      
      if (docData.clinicalIndication) {
        if (y > 220) { doc.addPage(); y = 20; }
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text('INDICACIÓN CLÍNICA:', 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(docData.clinicalIndication, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5;
      }
    }
    else if (selectedType === 'certificate') {
      doc.setFontSize(11);
      if (docData.purpose) {
        doc.setFont("helvetica", "bold");
        doc.text('PROPÓSITO:', 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(docData.purpose, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 5;
      }
      if (docData.findings) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text('HALLAZGOS:', 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(docData.findings, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 5;
      }
      if (docData.conclusion) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text('CONCLUSIÓN:', 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(docData.conclusion, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5;
      }
    }
    else if (selectedType === 'referral') {
      if (docData.specialty) {
        doc.setFont("helvetica", "bold");
        doc.text(`ESPECIALIDAD: ${docData.specialty}`, 20, y);
        y += 8;
      }
      if (docData.urgency) {
        doc.setFont("helvetica", "normal");
        doc.text(`Urgencia: ${docData.urgency}`, 20, y);
        y += 8;
      }
      if (docData.reason) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text('MOTIVO DE REMISIÓN:', 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(docData.reason, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 5;
      }
      if (docData.clinicalSummary) {
        if (y > 200) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text('RESUMEN CLÍNICO:', 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(docData.clinicalSummary, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5;
      }
    }
    else if (selectedType === 'disability') {
      if (docData.diagnosis) {
        doc.setFont("helvetica", "bold");
        doc.text('DIAGNÓSTICO:', 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.text(docData.diagnosis, 20, y);
        y += 8;
      }
      if (docData.cie10Code) {
        doc.text(`CIE-10: ${docData.cie10Code}`, 20, y);
        y += 8;
      }
      if (docData.days) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`INCAPACIDAD: ${docData.days} DÍAS`, 20, y);
        y += 10;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
      }
      if (docData.startDate && docData.endDate) {
        doc.text(`Desde: ${docData.startDate}  Hasta: ${docData.endDate}`, 20, y);
        y += 8;
      }
      if (docData.justification) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text('JUSTIFICACIÓN:', 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(docData.justification, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 5;
      }
      if (docData.restrictions && docData.restrictions.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text('RESTRICCIONES:', 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        docData.restrictions.forEach((r: string) => {
          const lines = doc.splitTextToSize(`• ${r}`, 170);
          doc.text(lines, 20, y);
          y += lines.length * 5;
        });
      }
    }
    
    // Signature section
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    y += 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Firma Médica", 20, y);
    y += 8;

    if (doctorSignature) {
      try {
        doc.addImage(doctorSignature, 'PNG', 20, y, 50, 20);
        y += 22;
      } catch (e) {
        console.error('Error adding signature:', e);
        y += 5;
      }
    }
    doc.line(20, y, 70, y);
    y += 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(doctorName, 20, y);
    if (doctorLicense) {
      y += 4;
      doc.text(`Reg. ${doctorLicense}`, 20, y);
    }
    
    // Download
    const fileName = `${docLabel.replace(/ /g, '_')}_${patientName.replace(/ /g, '_')}.pdf`;
    doc.save(fileName);
    
    toast.success("PDF descargado exitosamente");
    setIsOpen(false);
    setSelectedType(null);
    setGeneratedData(null);
    setEditableData(null);
  };

  const renderFieldWithMic = (label: string, field: string, value: string, multiline = false) => {
    const isRecordingThis = isRecording && recordingField === field;
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          {label}
          <Button
            type="button"
            size="sm"
            variant={isRecordingThis ? "destructive" : "outline"}
            onClick={() => startFieldRecording(field)}
            className="h-7 w-7 p-0"
          >
            {isRecordingThis ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          </Button>
        </Label>
        {multiline ? (
          <Textarea
            value={value || ''}
            onChange={(e) => updateField(field, e.target.value)}
            className="min-h-[80px]"
          />
        ) : (
          <Input
            value={value || ''}
            onChange={(e) => updateField(field, e.target.value)}
          />
        )}
      </div>
    );
  };

  const renderEditForm = () => {
    if (!editableData || !selectedType) return null;

    return (
      <div className="space-y-6 py-4">
        <div className="bg-accent/20 p-4 rounded-lg border border-accent/30">
          <p className="text-sm font-semibold mb-2">📝 Edita el Documento</p>
          <p className="text-xs text-muted-foreground">
            Usa el teclado o haz clic en el ícono del micrófono para editar por voz cada campo.
          </p>
        </div>

        {selectedType === 'prescription' && (
          <div className="space-y-6">
            {editableData.medications?.map((med: any, i: number) => (
              <Card key={i} className="p-4 space-y-4">
                <h3 className="font-bold text-lg">Medicamento {i + 1}</h3>
                {renderFieldWithMic('Nombre', `medications.${i}.name`, med.name)}
                {renderFieldWithMic('Presentación', `medications.${i}.presentation`, med.presentation)}
                {renderFieldWithMic('Dosis', `medications.${i}.dose`, med.dose)}
                {renderFieldWithMic('Frecuencia', `medications.${i}.frequency`, med.frequency)}
                {renderFieldWithMic('Duración', `medications.${i}.duration`, med.duration)}
                {renderFieldWithMic('Vía', `medications.${i}.route`, med.route)}
                {renderFieldWithMic('Instrucciones', `medications.${i}.instructions`, med.instructions, true)}
              </Card>
            ))}
            {renderFieldWithMic('Indicaciones Generales', 'generalInstructions', editableData.generalInstructions, true)}
          </div>
        )}

        {selectedType === 'lab_order' && (
          <div className="space-y-6">
            {editableData.tests?.map((test: any, i: number) => (
              <Card key={i} className="p-4 space-y-4">
                <h3 className="font-bold text-lg">Examen {i + 1}</h3>
                {renderFieldWithMic('Nombre del Examen', `tests.${i}.name`, test.name)}
                {renderFieldWithMic('Código', `tests.${i}.code`, test.code)}
                {renderFieldWithMic('Urgencia', `tests.${i}.urgency`, test.urgency)}
                {renderFieldWithMic('Preparación', `tests.${i}.specialInstructions`, test.specialInstructions, true)}
              </Card>
            ))}
            {renderFieldWithMic('Indicación Clínica', 'clinicalIndication', editableData.clinicalIndication, true)}
          </div>
        )}

        {selectedType === 'image_order' && (
          <div className="space-y-6">
            {editableData.studies?.map((study: any, i: number) => (
              <Card key={i} className="p-4 space-y-4">
                <h3 className="font-bold text-lg">Estudio {i + 1}</h3>
                {renderFieldWithMic('Nombre del Estudio', `studies.${i}.name`, study.name)}
                {renderFieldWithMic('Modalidad', `studies.${i}.modality`, study.modality)}
                {renderFieldWithMic('Región Anatómica', `studies.${i}.bodyPart`, study.bodyPart)}
                {renderFieldWithMic('Urgencia', `studies.${i}.urgency`, study.urgency)}
                {renderFieldWithMic('Preparación', `studies.${i}.specialInstructions`, study.specialInstructions, true)}
              </Card>
            ))}
            {renderFieldWithMic('Indicación Clínica', 'clinicalIndication', editableData.clinicalIndication, true)}
          </div>
        )}

        {selectedType === 'certificate' && (
          <div className="space-y-4">
            {renderFieldWithMic('Propósito', 'purpose', editableData.purpose, true)}
            {renderFieldWithMic('Hallazgos', 'findings', editableData.findings, true)}
            {renderFieldWithMic('Conclusión', 'conclusion', editableData.conclusion, true)}
          </div>
        )}

        {selectedType === 'referral' && (
          <div className="space-y-4">
            {renderFieldWithMic('Especialidad', 'specialty', editableData.specialty)}
            {renderFieldWithMic('Urgencia', 'urgency', editableData.urgency)}
            {renderFieldWithMic('Motivo de Remisión', 'reason', editableData.reason, true)}
            {renderFieldWithMic('Resumen Clínico', 'clinicalSummary', editableData.clinicalSummary, true)}
          </div>
        )}

        {selectedType === 'disability' && (
          <div className="space-y-4">
            {renderFieldWithMic('Diagnóstico', 'diagnosis', editableData.diagnosis, true)}
            {renderFieldWithMic('Código CIE-10', 'cie10Code', editableData.cie10Code)}
            {renderFieldWithMic('Días de Incapacidad', 'days', editableData.days)}
            {renderFieldWithMic('Fecha Inicio', 'startDate', editableData.startDate)}
            {renderFieldWithMic('Fecha Fin', 'endDate', editableData.endDate)}
            {renderFieldWithMic('Justificación', 'justification', editableData.justification, true)}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => {
              setGeneratedData(null);
              setEditableData(null);
              setSelectedType(null);
            }}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button onClick={downloadPDF} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          Generar Documentos
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Documento Médico con IA</DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>Selecciona el tipo de documento médico que necesitas.</p>
            <p className="text-xs bg-muted p-2 rounded">
              💡 La IA generará el documento basándose en la historia clínica guardada. 
              Podrás editarlo con voz o texto antes de descargarlo.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        {!generatedData ? (
          <div className="space-y-4 py-4">
            {/* Template Selection */}
            {templates.length > 0 && (
              <div className="bg-accent/20 p-4 rounded-lg border border-accent/30">
                <Label className="text-sm font-semibold mb-2 block">
                  🎨 Usar Plantilla Personalizada (Opcional)
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Si creaste plantillas con campos personalizados, selecciónalas aquí para incluirlos en el documento.
                </p>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Plantilla estándar (sin personalizar)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Plantilla estándar</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {documentTypes.map((docType) => (
                <Card
                  key={docType.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => !loading && generateDocument(docType.id)}
                >
                  <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                    {loading && selectedType === docType.id ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    ) : (
                      <docType.icon className={`h-8 w-8 mb-2 ${docType.color}`} />
                    )}
                    <p className="text-sm font-medium">{docType.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          renderEditForm()
        )}
      </DialogContent>
    </Dialog>
  );
};
