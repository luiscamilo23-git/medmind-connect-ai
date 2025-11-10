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
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Pill, Activity, Download, Package } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import InventoryUsageDialog from "./InventoryUsageDialog";
import { InventoryItem } from "@/pages/SupplyLens";

interface Patient {
  id: string;
  full_name: string;
}

interface MedicalRecord {
  id: string;
  title: string;
  record_type: string;
  chief_complaint: string | null;
  symptoms: string[] | null;
  diagnosis: string | null;
  medications: string[] | null;
  treatment_plan: string | null;
  notes: string | null;
  voice_transcript: string | null;
  created_at: string;
}

interface PatientMedicalHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

export const PatientMedicalHistory = ({ open, onOpenChange, patient }: PatientMedicalHistoryProps) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && patient) {
      loadMedicalRecords();
      loadInventoryItems();
    }
  }, [open, patient]);

  const loadMedicalRecords = async () => {
    if (!patient) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
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

  const loadInventoryItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("doctor_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error("Error loading inventory:", error);
    }
  };

  const handleRegisterUsage = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setUsageDialogOpen(true);
  };

  const getRecordTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      consultation: "bg-primary text-primary-foreground",
      followup: "bg-secondary text-secondary-foreground",
      procedure: "bg-accent text-accent-foreground",
      emergency: "bg-destructive text-destructive-foreground",
    };
    return colors[type] || "bg-muted text-muted-foreground";
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

  const exportToPDF = async () => {
    if (!patient) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Header
      doc.setFillColor(33, 150, 243);
      doc.rect(0, 0, pageWidth, 40, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("Historial Médico", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(14);
      doc.text(patient.full_name, pageWidth / 2, 32, { align: "center" });
      
      yPosition = 50;
      doc.setTextColor(0, 0, 0);

      // Patient info section
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Información del Paciente", 14, yPosition);
      yPosition += 7;

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(`Fecha de Generación: ${new Date().toLocaleDateString("es-ES")}`, 14, yPosition);
      yPosition += 7;
      doc.text(`Total de Registros: ${records.length}`, 14, yPosition);
      yPosition += 15;

      // Medical records
      if (records.length === 0) {
        doc.text("No hay registros médicos disponibles", 14, yPosition);
      } else {
        records.forEach((record, index) => {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          // Record header with colored background
          const recordColors: Record<string, [number, number, number]> = {
            consultation: [33, 150, 243],
            followup: [76, 175, 80],
            procedure: [255, 152, 0],
            emergency: [244, 67, 54],
          };
          const color = recordColors[record.record_type] || [158, 158, 158];
          
          doc.setFillColor(...color);
          doc.roundedRect(14, yPosition - 5, pageWidth - 28, 12, 2, 2, "F");
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont(undefined, "bold");
          doc.text(record.title, 18, yPosition + 2);
          
          const typeLabels: Record<string, string> = {
            consultation: "Consulta",
            followup: "Seguimiento",
            procedure: "Procedimiento",
            emergency: "Emergencia",
          };
          const typeText = typeLabels[record.record_type] || record.record_type;
          doc.setFontSize(9);
          doc.text(typeText, pageWidth - 18, yPosition + 2, { align: "right" });
          
          yPosition += 12;
          doc.setTextColor(0, 0, 0);

          // Date
          doc.setFont(undefined, "normal");
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`Fecha: ${formatDate(record.created_at)}`, 18, yPosition);
          yPosition += 8;

          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);

          // Content sections
          if (record.chief_complaint) {
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
            doc.setFont(undefined, "bold");
            doc.text("Motivo de Consulta:", 18, yPosition);
            yPosition += 5;
            doc.setFont(undefined, "normal");
            const lines = doc.splitTextToSize(record.chief_complaint, pageWidth - 36);
            doc.text(lines, 18, yPosition);
            yPosition += lines.length * 5 + 3;
          }

          if (record.symptoms && record.symptoms.length > 0) {
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
            doc.setFont(undefined, "bold");
            doc.text("Síntomas:", 18, yPosition);
            yPosition += 5;
            doc.setFont(undefined, "normal");
            doc.text(record.symptoms.join(", "), 18, yPosition);
            yPosition += 8;
          }

          if (record.diagnosis) {
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
            doc.setFont(undefined, "bold");
            doc.text("Diagnóstico:", 18, yPosition);
            yPosition += 5;
            doc.setFont(undefined, "normal");
            const lines = doc.splitTextToSize(record.diagnosis, pageWidth - 36);
            doc.text(lines, 18, yPosition);
            yPosition += lines.length * 5 + 3;
          }

          if (record.medications && record.medications.length > 0) {
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
            doc.setFont(undefined, "bold");
            doc.text("Medicamentos:", 18, yPosition);
            yPosition += 5;
            doc.setFont(undefined, "normal");
            record.medications.forEach((med) => {
              const lines = doc.splitTextToSize(`• ${med}`, pageWidth - 40);
              doc.text(lines, 22, yPosition);
              yPosition += lines.length * 5;
            });
            yPosition += 3;
          }

          if (record.treatment_plan) {
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
            doc.setFont(undefined, "bold");
            doc.text("Plan de Tratamiento:", 18, yPosition);
            yPosition += 5;
            doc.setFont(undefined, "normal");
            const lines = doc.splitTextToSize(record.treatment_plan, pageWidth - 36);
            doc.text(lines, 18, yPosition);
            yPosition += lines.length * 5 + 3;
          }

          if (record.notes) {
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
            doc.setFont(undefined, "bold");
            doc.text("Notas:", 18, yPosition);
            yPosition += 5;
            doc.setFont(undefined, "normal");
            const lines = doc.splitTextToSize(record.notes, pageWidth - 36);
            doc.text(lines, 18, yPosition);
            yPosition += lines.length * 5 + 3;
          }

          // Separator line
          yPosition += 5;
          if (index < records.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.line(14, yPosition, pageWidth - 14, yPosition);
            yPosition += 10;
          }
        });
      }

      // Footer on last page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${totalPages} - Generado por MedLink AI`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `Historial_${patient.full_name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF generado",
        description: "El historial médico se ha exportado exitosamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF: " + error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Historial Médico - {patient?.full_name}
              </DialogTitle>
              <DialogDescription>
                Registro completo de consultas y tratamientos
              </DialogDescription>
            </div>
            {records.length > 0 && (
              <Button onClick={exportToPDF} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Activity className="w-8 h-8 text-primary animate-pulse" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay registros médicos para este paciente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{record.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(record.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRegisterUsage(record)}
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Registrar Uso
                        </Button>
                        <Badge className={getRecordTypeColor(record.record_type)}>
                          {record.record_type === "consultation" && "Consulta"}
                          {record.record_type === "followup" && "Seguimiento"}
                          {record.record_type === "procedure" && "Procedimiento"}
                          {record.record_type === "emergency" && "Emergencia"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {record.chief_complaint && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Motivo de Consulta</h4>
                        <p className="text-sm text-muted-foreground">{record.chief_complaint}</p>
                      </div>
                    )}

                    {record.symptoms && record.symptoms.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Síntomas</h4>
                        <div className="flex flex-wrap gap-2">
                          {record.symptoms.map((symptom, idx) => (
                            <Badge key={idx} variant="outline">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {record.diagnosis && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Diagnóstico</h4>
                        <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                      </div>
                    )}

                    {record.medications && record.medications.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Pill className="w-4 h-4" />
                          Medicamentos
                        </h4>
                        <div className="space-y-1">
                          {record.medications.map((med, idx) => (
                            <p key={idx} className="text-sm text-muted-foreground pl-6">
                              • {med}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {record.treatment_plan && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Plan de Tratamiento</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {record.treatment_plan}
                        </p>
                      </div>
                    )}

                    {record.notes && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Notas Adicionales</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {record.notes}
                        </p>
                      </div>
                    )}

                    {record.voice_transcript && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <h4 className="font-semibold text-sm mb-1">Transcripción de Audio</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {record.voice_transcript}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {patient && (
          <InventoryUsageDialog
            open={usageDialogOpen}
            onOpenChange={setUsageDialogOpen}
            inventoryItems={inventoryItems}
            preselectedPatientId={patient.id}
            preselectedRecordId={selectedRecord?.id}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
