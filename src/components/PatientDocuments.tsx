import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Calendar, 
  Activity, 
  Download,
  Pill,
  TestTube,
  Image,
  Award,
  UserCheck,
  Clock
} from "lucide-react";
import { jsPDF } from "jspdf";

interface Patient {
  id: string;
  full_name: string;
}

interface MedicalDocument {
  id: string;
  document_type: string;
  document_data: any;
  created_at: string;
  medical_record_id: string | null;
}

interface PatientDocumentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

const documentTypeLabels: Record<string, string> = {
  prescription: "Fórmula Médica",
  lab_order: "Orden de Laboratorio",
  image_order: "Orden de Imágenes",
  certificate: "Certificado Médico",
  referral: "Remisión",
  disability: "Incapacidad",
};

const documentTypeIcons: Record<string, React.ReactNode> = {
  prescription: <Pill className="w-4 h-4" />,
  lab_order: <TestTube className="w-4 h-4" />,
  image_order: <Image className="w-4 h-4" />,
  certificate: <Award className="w-4 h-4" />,
  referral: <UserCheck className="w-4 h-4" />,
  disability: <Clock className="w-4 h-4" />,
};

const documentTypeColors: Record<string, string> = {
  prescription: "bg-blue-500/10 text-blue-600 border-blue-200",
  lab_order: "bg-primary/10 text-primary border-primary/20",
  image_order: "bg-green-500/10 text-green-600 border-green-200",
  certificate: "bg-amber-500/10 text-amber-600 border-amber-200",
  referral: "bg-pink-500/10 text-pink-600 border-pink-200",
  disability: "bg-red-500/10 text-red-600 border-red-200",
};

export const PatientDocuments = ({ open, onOpenChange, patient }: PatientDocumentsProps) => {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open && patient) {
      loadDocuments();
      loadDoctorProfile();
    }
  }, [open, patient]);

  const loadDocuments = async () => {
    if (!patient) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("medical_documents")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
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

  const loadDoctorProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (data) {
        setDoctorName(data.full_name);
      }
    } catch (error) {
      console.error("Error loading doctor profile:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadDocumentPDF = (doc: MedicalDocument) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Header
      pdf.setFillColor(33, 150, 243);
      pdf.rect(0, 0, pageWidth, 35, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text(documentTypeLabels[doc.document_type] || doc.document_type, pageWidth / 2, 18, { align: "center" });
      
      pdf.setFontSize(10);
      pdf.text(`Dr(a). ${doctorName}`, pageWidth / 2, 28, { align: "center" });
      
      yPosition = 50;
      pdf.setTextColor(0, 0, 0);

      // Patient info
      pdf.setFontSize(11);
      pdf.setFont(undefined, "bold");
      pdf.text("Paciente:", 14, yPosition);
      pdf.setFont(undefined, "normal");
      pdf.text(patient?.full_name || "", 45, yPosition);
      yPosition += 8;

      pdf.setFont(undefined, "bold");
      pdf.text("Fecha:", 14, yPosition);
      pdf.setFont(undefined, "normal");
      pdf.text(formatDate(doc.created_at), 45, yPosition);
      yPosition += 15;

      // Separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(14, yPosition, pageWidth - 14, yPosition);
      yPosition += 10;

      // Document content
      const data = doc.document_data;
      pdf.setFontSize(10);

      if (doc.document_type === "prescription" && data.medications) {
        pdf.setFont(undefined, "bold");
        pdf.text("Medicamentos Recetados:", 14, yPosition);
        yPosition += 8;
        pdf.setFont(undefined, "normal");

        data.medications.forEach((med: any, idx: number) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.setFont(undefined, "bold");
          pdf.text(`${idx + 1}. ${med.name}`, 18, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, "normal");
          if (med.dosage) {
            pdf.text(`   Dosis: ${med.dosage}`, 18, yPosition);
            yPosition += 5;
          }
          if (med.frequency) {
            pdf.text(`   Frecuencia: ${med.frequency}`, 18, yPosition);
            yPosition += 5;
          }
          if (med.duration) {
            pdf.text(`   Duración: ${med.duration}`, 18, yPosition);
            yPosition += 5;
          }
          if (med.instructions) {
            const lines = pdf.splitTextToSize(`   Instrucciones: ${med.instructions}`, pageWidth - 36);
            pdf.text(lines, 18, yPosition);
            yPosition += lines.length * 5;
          }
          yPosition += 5;
        });
      }

      if ((doc.document_type === "lab_order" || doc.document_type === "image_order") && data.tests) {
        pdf.setFont(undefined, "bold");
        pdf.text(doc.document_type === "lab_order" ? "Exámenes Solicitados:" : "Imágenes Solicitadas:", 14, yPosition);
        yPosition += 8;
        pdf.setFont(undefined, "normal");

        data.tests.forEach((test: any, idx: number) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${idx + 1}. ${test.name || test}`, 18, yPosition);
          yPosition += 6;
          if (test.instructions) {
            const lines = pdf.splitTextToSize(`   Instrucciones: ${test.instructions}`, pageWidth - 36);
            pdf.text(lines, 18, yPosition);
            yPosition += lines.length * 5 + 2;
          }
        });
      }

      if (data.diagnosis) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFont(undefined, "bold");
        pdf.text("Diagnóstico:", 14, yPosition);
        yPosition += 6;
        pdf.setFont(undefined, "normal");
        const lines = pdf.splitTextToSize(data.diagnosis, pageWidth - 28);
        pdf.text(lines, 14, yPosition);
        yPosition += lines.length * 5 + 8;
      }

      if (data.clinicalFindings) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFont(undefined, "bold");
        pdf.text("Hallazgos Clínicos:", 14, yPosition);
        yPosition += 6;
        pdf.setFont(undefined, "normal");
        const lines = pdf.splitTextToSize(data.clinicalFindings, pageWidth - 28);
        pdf.text(lines, 14, yPosition);
        yPosition += lines.length * 5 + 8;
      }

      if (doc.document_type === "certificate") {
        if (data.purpose) {
          pdf.setFont(undefined, "bold");
          pdf.text("Propósito:", 14, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, "normal");
          const lines = pdf.splitTextToSize(data.purpose, pageWidth - 28);
          pdf.text(lines, 14, yPosition);
          yPosition += lines.length * 5 + 8;
        }
        if (data.findings) {
          pdf.setFont(undefined, "bold");
          pdf.text("Hallazgos:", 14, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, "normal");
          const lines = pdf.splitTextToSize(data.findings, pageWidth - 28);
          pdf.text(lines, 14, yPosition);
          yPosition += lines.length * 5 + 8;
        }
        if (data.conclusion) {
          pdf.setFont(undefined, "bold");
          pdf.text("Conclusión:", 14, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, "normal");
          const lines = pdf.splitTextToSize(data.conclusion, pageWidth - 28);
          pdf.text(lines, 14, yPosition);
          yPosition += lines.length * 5 + 8;
        }
      }

      if (doc.document_type === "referral") {
        if (data.specialty) {
          pdf.setFont(undefined, "bold");
          pdf.text("Especialidad de Referencia:", 14, yPosition);
          pdf.setFont(undefined, "normal");
          pdf.text(data.specialty, 75, yPosition);
          yPosition += 8;
        }
        if (data.reason) {
          pdf.setFont(undefined, "bold");
          pdf.text("Motivo de Remisión:", 14, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, "normal");
          const lines = pdf.splitTextToSize(data.reason, pageWidth - 28);
          pdf.text(lines, 14, yPosition);
          yPosition += lines.length * 5 + 8;
        }
        if (data.clinicalSummary) {
          pdf.setFont(undefined, "bold");
          pdf.text("Resumen Clínico:", 14, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, "normal");
          const lines = pdf.splitTextToSize(data.clinicalSummary, pageWidth - 28);
          pdf.text(lines, 14, yPosition);
          yPosition += lines.length * 5 + 8;
        }
      }

      if (doc.document_type === "disability") {
        if (data.startDate) {
          pdf.setFont(undefined, "bold");
          pdf.text("Fecha de Inicio:", 14, yPosition);
          pdf.setFont(undefined, "normal");
          pdf.text(data.startDate, 55, yPosition);
          yPosition += 7;
        }
        if (data.endDate) {
          pdf.setFont(undefined, "bold");
          pdf.text("Fecha de Fin:", 14, yPosition);
          pdf.setFont(undefined, "normal");
          pdf.text(data.endDate, 55, yPosition);
          yPosition += 7;
        }
        if (data.days) {
          pdf.setFont(undefined, "bold");
          pdf.text("Días de Incapacidad:", 14, yPosition);
          pdf.setFont(undefined, "normal");
          pdf.text(String(data.days), 60, yPosition);
          yPosition += 10;
        }
        if (data.reason) {
          pdf.setFont(undefined, "bold");
          pdf.text("Motivo:", 14, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, "normal");
          const lines = pdf.splitTextToSize(data.reason, pageWidth - 28);
          pdf.text(lines, 14, yPosition);
          yPosition += lines.length * 5 + 8;
        }
        if (data.recommendations) {
          pdf.setFont(undefined, "bold");
          pdf.text("Recomendaciones:", 14, yPosition);
          yPosition += 6;
          pdf.setFont(undefined, "normal");
          const lines = pdf.splitTextToSize(data.recommendations, pageWidth - 28);
          pdf.text(lines, 14, yPosition);
          yPosition += lines.length * 5 + 8;
        }
      }

      // Signature area
      yPosition = Math.max(yPosition + 20, 230);
      if (yPosition > 260) {
        pdf.addPage();
        yPosition = 60;
      }

      pdf.setDrawColor(100, 100, 100);
      pdf.line(pageWidth / 2 - 40, yPosition, pageWidth / 2 + 40, yPosition);
      yPosition += 6;
      pdf.setFontSize(10);
      pdf.text(`Dr(a). ${doctorName}`, pageWidth / 2, yPosition, { align: "center" });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Generado por MEDMIND - ${new Date().toLocaleDateString("es-ES")}`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );

      // Download
      const fileName = `${documentTypeLabels[doc.document_type] || doc.document_type}_${patient?.full_name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF descargado",
        description: "El documento se ha descargado exitosamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF: " + error.message,
        variant: "destructive",
      });
    }
  };

  const renderDocumentPreview = (doc: MedicalDocument) => {
    const data = doc.document_data;

    if (doc.document_type === "prescription" && data.medications) {
      return (
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Medicamentos:</p>
          <ul className="list-disc list-inside space-y-1">
            {data.medications.slice(0, 3).map((med: any, idx: number) => (
              <li key={idx}>{med.name} {med.dosage && `- ${med.dosage}`}</li>
            ))}
            {data.medications.length > 3 && (
              <li className="text-muted-foreground">+{data.medications.length - 3} más...</li>
            )}
          </ul>
        </div>
      );
    }

    if ((doc.document_type === "lab_order" || doc.document_type === "image_order") && data.tests) {
      return (
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">
            {doc.document_type === "lab_order" ? "Exámenes:" : "Imágenes:"}
          </p>
          <ul className="list-disc list-inside space-y-1">
            {data.tests.slice(0, 3).map((test: any, idx: number) => (
              <li key={idx}>{typeof test === "string" ? test : test.name}</li>
            ))}
            {data.tests.length > 3 && (
              <li className="text-muted-foreground">+{data.tests.length - 3} más...</li>
            )}
          </ul>
        </div>
      );
    }

    if (doc.document_type === "certificate" && data.purpose) {
      return (
        <p className="text-sm text-muted-foreground line-clamp-2">
          <span className="font-medium text-foreground">Propósito: </span>
          {data.purpose}
        </p>
      );
    }

    if (doc.document_type === "referral" && data.specialty) {
      return (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Especialidad: </span>
          {data.specialty}
        </p>
      );
    }

    if (doc.document_type === "disability" && data.days) {
      return (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Días de incapacidad: </span>
          {data.days} días
        </p>
      );
    }

    if (data.diagnosis) {
      return (
        <p className="text-sm text-muted-foreground line-clamp-2">
          <span className="font-medium text-foreground">Diagnóstico: </span>
          {data.diagnosis}
        </p>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentos Médicos - {patient?.full_name}
          </DialogTitle>
          <DialogDescription>
            Órdenes, fórmulas, certificados y otros documentos generados
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Activity className="w-8 h-8 text-primary animate-pulse" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay documentos médicos para este paciente</p>
              <p className="text-sm mt-2">Los documentos generados desde la historia clínica aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${documentTypeColors[doc.document_type] || "bg-muted"}`}>
                          {documentTypeIcons[doc.document_type] || <FileText className="w-4 h-4" />}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {documentTypeLabels[doc.document_type] || doc.document_type}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(doc.created_at)}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocumentPDF(doc)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {renderDocumentPreview(doc)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
