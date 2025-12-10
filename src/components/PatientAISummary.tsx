import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, AlertCircle, Calendar, Pill, Activity, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientAISummaryProps {
  patientId: string;
  patientName: string;
}

interface MedicalRecord {
  id: string;
  title: string;
  record_type: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  medications: string[] | null;
  treatment_plan: string | null;
  created_at: string;
}

export const PatientAISummary = ({ patientId, patientName }: PatientAISummaryProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecordsAndGenerateSummary();
  }, [patientId]);

  const loadRecordsAndGenerateSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load medical records
      const { data: recordsData, error: recordsError } = await supabase
        .from("medical_records")
        .select("id, title, record_type, chief_complaint, diagnosis, medications, treatment_plan, created_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (recordsError) throw recordsError;

      if (!recordsData || recordsData.length === 0) {
        setSummary(null);
        setRecords([]);
        return;
      }

      setRecords(recordsData);

      // Generate AI summary
      await generateAISummary(recordsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async (recordsData: MedicalRecord[]) => {
    try {
      const recordsSummary = recordsData.map(r => ({
        fecha: new Date(r.created_at).toLocaleDateString("es-ES"),
        tipo: r.record_type,
        motivo: r.chief_complaint,
        diagnostico: r.diagnosis,
        medicamentos: r.medications,
        plan: r.treatment_plan
      }));

      const { data, error } = await supabase.functions.invoke("generate-patient-summary", {
        body: {
          patientName,
          records: recordsSummary
        }
      });

      if (error) throw error;

      setSummary(data.summary);
    } catch (err: any) {
      console.error("Error generating AI summary:", err);
      // Generate a basic summary if AI fails
      const lastVisit = recordsData[0];
      const uniqueDiagnoses = [...new Set(recordsData.filter(r => r.diagnosis).map(r => r.diagnosis))];
      const allMedications = [...new Set(recordsData.flatMap(r => r.medications || []))];
      
      setSummary(`**Última consulta:** ${new Date(lastVisit.created_at).toLocaleDateString("es-ES")} - ${lastVisit.title || "Sin título"}\n\n` +
        `**Total de consultas:** ${recordsData.length}\n\n` +
        (uniqueDiagnoses.length > 0 ? `**Diagnósticos previos:** ${uniqueDiagnoses.slice(0, 3).join(", ")}\n\n` : "") +
        (allMedications.length > 0 ? `**Medicamentos recetados:** ${allMedications.slice(0, 5).join(", ")}` : ""));
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <CardTitle className="text-lg">Resumen IA del Paciente</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!records.length) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-6 text-center text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay historial médico previo para este paciente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Resumen IA del Historial</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadRecordsAndGenerateSummary}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Error al generar resumen</span>
          </div>
        ) : summary ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {summary}
            </div>
          </div>
        ) : null}

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {records.length} consultas
          </Badge>
          {records[0] && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Última: {new Date(records[0].created_at).toLocaleDateString("es-ES")}
            </Badge>
          )}
          {records.some(r => r.medications?.length) && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Pill className="w-3 h-3" />
              Con medicación
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
