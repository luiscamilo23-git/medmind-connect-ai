import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InventoryItem } from "@/pages/SupplyLens";

const usageSchema = z.object({
  inventory_id: z.string().min(1, "Selecciona un item del inventario"),
  patient_id: z.string().optional(),
  medical_record_id: z.string().optional(),
  quantity_used: z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
  notes: z.string().trim().max(500).optional(),
});

type UsageFormData = z.infer<typeof usageSchema>;

interface Patient {
  id: string;
  full_name: string;
}

interface MedicalRecord {
  id: string;
  title: string;
  created_at: string;
}

interface InventoryUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItems: InventoryItem[];
  preselectedInventoryId?: string;
  preselectedPatientId?: string;
  preselectedRecordId?: string;
}

const InventoryUsageDialog = ({ 
  open, 
  onOpenChange, 
  inventoryItems,
  preselectedInventoryId,
  preselectedPatientId,
  preselectedRecordId
}: InventoryUsageDialogProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [loadingRecords, setLoadingRecords] = useState(false);

  const form = useForm<UsageFormData>({
    resolver: zodResolver(usageSchema),
    defaultValues: {
      inventory_id: preselectedInventoryId || "",
      patient_id: preselectedPatientId || "",
      medical_record_id: preselectedRecordId || "",
      quantity_used: 1,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      loadPatients();
      if (preselectedInventoryId) {
        form.setValue("inventory_id", preselectedInventoryId);
      }
      if (preselectedPatientId) {
        form.setValue("patient_id", preselectedPatientId);
        setSelectedPatient(preselectedPatientId);
        loadMedicalRecords(preselectedPatientId);
      }
      if (preselectedRecordId) {
        form.setValue("medical_record_id", preselectedRecordId);
      }
    }
  }, [open, preselectedInventoryId, preselectedPatientId, preselectedRecordId]);

  const loadPatients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name")
        .eq("doctor_id", user.id)
        .order("full_name");

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error loading patients:", error);
      toast.error("Error al cargar pacientes");
    }
  };

  const loadMedicalRecords = async (patientId: string) => {
    try {
      setLoadingRecords(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("medical_records")
        .select("id, title, created_at")
        .eq("doctor_id", user.id)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setMedicalRecords(data || []);
    } catch (error) {
      console.error("Error loading medical records:", error);
      toast.error("Error al cargar historias clínicas");
    } finally {
      setLoadingRecords(false);
    }
  };

  const handlePatientChange = (patientId: string) => {
    setSelectedPatient(patientId);
    form.setValue("patient_id", patientId);
    form.setValue("medical_record_id", "");
    setMedicalRecords([]);
    if (patientId) {
      loadMedicalRecords(patientId);
    }
  };

  const onSubmit = async (data: UsageFormData) => {
    try {
      // Verify stock availability
      const selectedItem = inventoryItems.find(item => item.id === data.inventory_id);
      if (!selectedItem) {
        toast.error("Item de inventario no encontrado");
        return;
      }

      if (selectedItem.current_stock < data.quantity_used) {
        toast.error(`Stock insuficiente. Disponible: ${selectedItem.current_stock}`);
        return;
      }

      const usageData = {
        inventory_id: data.inventory_id,
        medical_record_id: data.medical_record_id || null,
        quantity_used: data.quantity_used,
        notes: data.notes || null,
      };

      const { error } = await supabase
        .from("inventory_usage")
        .insert([usageData]);

      if (error) throw error;

      toast.success("Uso de inventario registrado correctamente");
      form.reset();
      onOpenChange(true);
    } catch (error) {
      console.error("Error recording usage:", error);
      toast.error("Error al registrar el uso");
    }
  };

  const selectedInventoryItem = inventoryItems.find(
    item => item.id === form.watch("inventory_id")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar Uso de Inventario</DialogTitle>
          <DialogDescription>
            Registra el consumo de suministros médicos vinculado a pacientes
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="inventory_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item de Inventario *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inventoryItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (Stock: {item.current_stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedInventoryItem && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">{selectedInventoryItem.name}</p>
                <p className="text-muted-foreground">
                  Stock disponible: {selectedInventoryItem.current_stock}
                </p>
                {selectedInventoryItem.location && (
                  <p className="text-muted-foreground">
                    Ubicación: {selectedInventoryItem.location}
                  </p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="quantity_used"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad Utilizada *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max={selectedInventoryItem?.current_stock || 999}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente (Opcional)</FormLabel>
                  <Select 
                    onValueChange={handlePatientChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un paciente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin vincular</SelectItem>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPatient && (
              <FormField
                control={form.control}
                name="medical_record_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Historia Clínica (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            loadingRecords 
                              ? "Cargando..." 
                              : "Selecciona una historia"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin vincular</SelectItem>
                        {medicalRecords.map((record) => (
                          <SelectItem key={record.id} value={record.id}>
                            {record.title} - {new Date(record.created_at).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre el uso"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Uso
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryUsageDialog;
