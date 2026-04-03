import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { RIPSRecordEditor, buildDatosJson, TIPOS_RIPS } from "./RIPSRecordEditor";

interface RIPSBatchDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  batchInfo: { pagador: string; fecha_inicio: string; fecha_fin: string };
}

export function RIPSBatchDetail({ open, onOpenChange, batchId, batchInfo }: RIPSBatchDetailProps) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const { data: records, isLoading } = useQuery({
    queryKey: ["rips-records", batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rips_records")
        .select("*, patients(full_name, document_type, document_number)")
        .eq("rips_batch_id", batchId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Obtener pacientes para el select
  const { data: patients } = useQuery({
    queryKey: ["patients-simple"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("patients")
        .select("id, full_name, document_type, document_number, phone")
        .eq("doctor_id", user!.id)
        .order("full_name");
      return data ?? [];
    },
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!selectedPatientId) throw new Error("Selecciona un paciente");
      const datosJson = buildDatosJson(formData);
      const { error } = await supabase.from("rips_records").insert([{
        rips_batch_id: batchId,
        patient_id: selectedPatientId,
        tipo_archivo: formData.tipo_archivo,
        numero_autorizacion: formData.numero_autorizacion || null,
        codigo_servicio: formData.codigo_servicio,
        descripcion_servicio: formData.descripcion_servicio,
        fecha_inicio_atencion: formData.fecha_inicio_atencion,
        fecha_fin_atencion: formData.fecha_fin_atencion || null,
        codigo_diagnostico_principal: formData.codigo_diagnostico_principal || null,
        codigo_diagnostico_relacionado: formData.codigo_diagnostico_relacionado || null,
        tipo_diagnostico_principal: formData.tipo_diagnostico_principal || null,
        valor_total: formData.valor_total,
        copago: formData.copago || 0,
        valor_neto: formData.valor_neto,
        datos_json: datosJson,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rips-records", batchId] });
      queryClient.invalidateQueries({ queryKey: ["rips-batches"] });
      toast.success("Registro agregado correctamente");
      setShowAddForm(false);
      setSelectedPatientId("");
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase.from("rips_records").delete().eq("id", recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rips-records", batchId] });
      queryClient.invalidateQueries({ queryKey: ["rips-batches"] });
      toast.success("Registro eliminado");
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  // Contar por tipo
  const countByType = (records ?? []).reduce((acc: Record<string, number>, r: any) => {
    acc[r.tipo_archivo] = (acc[r.tipo_archivo] || 0) + 1;
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Registros RIPS — {batchInfo.pagador}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Período: {batchInfo.fecha_inicio} → {batchInfo.fecha_fin}
          </p>
        </DialogHeader>

        {/* Resumen por tipo */}
        <div className="flex flex-wrap gap-2">
          {TIPOS_RIPS.map((t) => {
            const count = countByType[t.value] || 0;
            if (count === 0) return null;
            return (
              <Badge key={t.value} variant="outline" className={`${t.color} gap-1`}>
                {t.value}: {count}
              </Badge>
            );
          })}
          {(records ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Sin registros aún</p>
          )}
        </div>

        {/* Lista de registros */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>}
          {(records ?? []).map((r: any) => {
            const tipoInfo = TIPOS_RIPS.find((t) => t.value === r.tipo_archivo);
            return (
              <Card key={r.id} className="border">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className={`${tipoInfo?.color} shrink-0 text-xs`}>
                      {r.tipo_archivo}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.patients?.full_name ?? "Paciente"}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.codigo_servicio} — {r.descripcion_servicio} | {r.fecha_inicio_atencion} | ${Number(r.valor_total).toLocaleString("es-CO")}
                      </p>
                      {r.codigo_diagnostico_principal && (
                        <p className="text-xs text-muted-foreground">CIE-10: {r.codigo_diagnostico_principal}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("¿Eliminar este registro?")) deleteMutation.mutate(r.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Agregar nuevo registro */}
        {!showAddForm ? (
          <Button onClick={() => setShowAddForm(true)} className="w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Agregar registro RIPS
          </Button>
        ) : (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">Nuevo registro</p>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>✕</Button>
            </div>

            {/* Selector de paciente */}
            <div>
              <label className="text-sm font-medium">Paciente *</label>
              <select
                className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">Seleccionar paciente...</option>
                {(patients ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} — {p.document_type ?? "CC"} {p.document_number ?? p.phone}
                  </option>
                ))}
              </select>
            </div>

            <RIPSRecordEditor
              onSave={(data) => addMutation.mutate(data)}
              onCancel={() => setShowAddForm(false)}
              isLoading={addMutation.isPending}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
