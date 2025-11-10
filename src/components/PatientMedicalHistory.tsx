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
import { FileText, Calendar, Pill, Activity } from "lucide-react";

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
  const { toast } = useToast();

  useEffect(() => {
    if (open && patient) {
      loadMedicalRecords();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Historial Médico - {patient?.full_name}
          </DialogTitle>
          <DialogDescription>
            Registro completo de consultas y tratamientos
          </DialogDescription>
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
                      <Badge className={getRecordTypeColor(record.record_type)}>
                        {record.record_type === "consultation" && "Consulta"}
                        {record.record_type === "followup" && "Seguimiento"}
                        {record.record_type === "procedure" && "Procedimiento"}
                        {record.record_type === "emergency" && "Emergencia"}
                      </Badge>
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
      </DialogContent>
    </Dialog>
  );
};
