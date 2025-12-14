import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useModerator } from "@/hooks/useModerator";
import { ModeratorLayout } from "@/components/moderator/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MedicalRecord {
  id: string;
  title: string;
  record_type: string;
  diagnosis: string | null;
  cie10_code: string | null;
  created_at: string;
  patients: { full_name: string } | null;
}

export default function ModeratorRecords() {
  const { logAction } = useModerator();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadRecords();
    logAction("VIEW", "medical_records");
  }, []);

  const loadRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('id, title, record_type, diagnosis, cie10_code, created_at, patients(full_name)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error loading records:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.patients?.full_name && r.patients.full_name.toLowerCase().includes(search.toLowerCase())) ||
    (r.cie10_code && r.cie10_code.toLowerCase().includes(search.toLowerCase()))
  );

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation': return 'Consulta';
      case 'procedure': return 'Procedimiento';
      case 'diagnosis': return 'Diagnóstico';
      case 'prescription': return 'Prescripción';
      case 'lab_result': return 'Laboratorio';
      case 'imaging': return 'Imágenes';
      default: return type;
    }
  };

  return (
    <ModeratorLayout title="Historias Clínicas" icon={<FileText className="w-6 h-6 text-orange-500" />}>
      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Registros Médicos (Solo Lectura)</span>
            <Badge variant="outline" className="text-orange-400 border-orange-500">
              {filteredRecords.length} registros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, paciente o CIE-10..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="rounded-md border border-orange-500/20">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>CIE-10</TableHead>
                    <TableHead>Diagnóstico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {format(new Date(record.created_at), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">{record.title}</TableCell>
                      <TableCell>{record.patients?.full_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTypeLabel(record.record_type)}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{record.cie10_code || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {record.diagnosis || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No se encontraron registros médicos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </ModeratorLayout>
  );
}
