import { useState, useEffect } from "react";
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
import {
  FileText,
  Microscope,
  Camera,
  FileCheck,
  UserCheck,
  ClipboardX,
  Download,
  Loader2,
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
  { id: "lab_order", label: "Orden de Laboratorio", icon: Microscope, color: "text-purple-600" },
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

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

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

      if (error) throw error;

      setGeneratedData(data.document);
      toast.success("Documento generado exitosamente");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error al generar documento");
      setSelectedType(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!generatedData) return;

    const doc = new jsPDF();
    const docData = generatedData.document_data;
    
    // Header
    doc.setFontSize(16);
    doc.text(doctorName, 20, 20);
    if (doctorLicense) {
      doc.setFontSize(10);
      doc.text(`Reg. Médico: ${doctorLicense}`, 20, 26);
    }
    
    // Título del documento
    const docLabel = documentTypes.find(d => d.id === selectedType)?.label || 'DOCUMENTO MÉDICO';
    doc.setFontSize(14);
    doc.text(docLabel.toUpperCase(), 105, 40, { align: 'center' });
    
    // Datos del paciente
    doc.setFontSize(11);
    doc.text(`Paciente: ${patientName}`, 20, 55);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 20, 61);
    
    doc.line(20, 65, 190, 65); // Línea divisoria
    
    let y = 75;
    
    // Contenido específico según tipo
    if (selectedType === 'prescription' && docData.medications) {
      doc.setFontSize(12);
      doc.text('MEDICAMENTOS:', 20, y);
      y += 10;
      
      docData.medications.forEach((med: any, i: number) => {
        doc.setFontSize(10);
        doc.text(`${i + 1}. ${med.name} - ${med.dose}`, 25, y);
        y += 5;
        doc.text(`   ${med.frequency} durante ${med.duration}`, 25, y);
        if (med.instructions) {
          y += 5;
          doc.text(`   ${med.instructions}`, 25, y);
        }
        y += 8;
      });
      
      if (docData.generalInstructions) {
        y += 5;
        doc.text('INDICACIONES:', 20, y);
        y += 6;
        const lines = doc.splitTextToSize(docData.generalInstructions, 170);
        doc.text(lines, 20, y);
      }
    } else if (selectedType === 'lab_order' && docData.tests) {
      doc.setFontSize(12);
      doc.text('EXÁMENES SOLICITADOS:', 20, y);
      y += 10;
      
      docData.tests.forEach((test: any, i: number) => {
        doc.setFontSize(10);
        doc.text(`${i + 1}. ${test.name}`, 25, y);
        if (test.instructions) {
          y += 5;
          doc.text(`   ${test.instructions}`, 25, y);
        }
        y += 8;
      });
      
      if (docData.clinicalIndication) {
        y += 5;
        doc.text('INDICACIÓN CLÍNICA:', 20, y);
        y += 6;
        const lines = doc.splitTextToSize(docData.clinicalIndication, 170);
        doc.text(lines, 20, y);
      }
    } else if (selectedType === 'image_order' && docData.studies) {
      doc.setFontSize(12);
      doc.text('ESTUDIOS SOLICITADOS:', 20, y);
      y += 10;
      
      docData.studies.forEach((study: any, i: number) => {
        doc.setFontSize(10);
        doc.text(`${i + 1}. ${study.name} - ${study.bodyPart}`, 25, y);
        if (study.specialInstructions) {
          y += 5;
          doc.text(`   ${study.specialInstructions}`, 25, y);
        }
        y += 8;
      });
    }
    
    // Firma Médica
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    y += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Firma Médica", 20, y);
    y += 8;

    if (doctorSignature) {
      doc.addImage(doctorSignature, 'PNG', 20, y, 50, 20);
      y += 22;
    }
    doc.line(20, y, 70, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(doctorName, 20, y);
    if (doctorLicense) {
      y += 4;
      doc.text(`Reg. ${doctorLicense}`, 20, y);
    }
    
    // Descargar
    const fileName = `${docLabel.replace(/ /g, '_')}_${patientName.replace(/ /g, '_')}.pdf`;
    doc.save(fileName);
    
    toast.success("PDF descargado");
    setIsOpen(false);
    setSelectedType(null);
    setGeneratedData(null);
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
              Puedes personalizar el resultado usando tus plantillas personalizadas.
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
                    <span className="text-sm font-medium">{docType.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {documentTypes.find(d => d.id === selectedType)?.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Documento generado correctamente
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={downloadPDF} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGeneratedData(null);
                      setSelectedType(null);
                      setSelectedTemplate("");
                    }}
                  >
                    Generar Otro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};