import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HabeasDataDialog, HABEAS_DATA_TEXT, CONSENTIMIENTO_GENERAL_TEXT } from "@/components/HabeasDataDialog";

const patientSchema = z.object({
  full_name: z.string().min(1, "El nombre es requerido").max(100),
  phone: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  date_of_birth: z.string().optional(),
  blood_type: z.string().optional(),
  allergies: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  date_of_birth: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  address: string | null;
  notes: string | null;
}

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

export const PatientDialog = ({ open, onOpenChange, patient }: PatientDialogProps) => {
  const { toast } = useToast();
  const [showHabeas, setShowHabeas] = useState(false);
  const [pendingPatientData, setPendingPatientData] = useState<PatientFormData | null>(null);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
      date_of_birth: "",
      blood_type: "",
      allergies: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (patient) {
      form.reset({
        full_name: patient.full_name,
        phone: patient.phone,
        email: patient.email || "",
        date_of_birth: patient.date_of_birth || "",
        blood_type: patient.blood_type || "",
        allergies: patient.allergies?.join(", ") || "",
        emergency_contact_name: patient.emergency_contact_name || "",
        emergency_contact_phone: patient.emergency_contact_phone || "",
        address: patient.address || "",
        notes: patient.notes || "",
      });
    } else {
      form.reset({
        full_name: "",
        phone: "",
        email: "",
        date_of_birth: "",
        blood_type: "",
        allergies: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        address: "",
        notes: "",
      });
    }
  }, [patient, form]);

  const onSubmit = async (data: PatientFormData) => {
    if (!patient) {
      // For new patients, show Habeas Data dialog first
      setPendingPatientData(data);
      setShowHabeas(true);
      return;
    }

    // For existing patients, update directly
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const patientData = {
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || null,
        date_of_birth: data.date_of_birth || null,
        blood_type: data.blood_type || null,
        allergies: data.allergies ? data.allergies.split(",").map((a) => a.trim()) : null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        address: data.address || null,
        notes: data.notes || null,
        doctor_id: user.id,
      };

      const { error } = await supabase
        .from("patients")
        .update(patientData)
        .eq("id", patient.id);

      if (error) throw error;

      toast({
        title: "Paciente actualizado",
        description: "Los datos del paciente se actualizaron correctamente.",
      });

      onOpenChange(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleHabeasAccepted = async (firmaUrl?: string, consentimientoGeneral?: boolean) => {
    if (!pendingPatientData) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No user found");

      const patientData = {
        full_name: pendingPatientData.full_name,
        phone: pendingPatientData.phone,
        email: pendingPatientData.email || null,
        date_of_birth: pendingPatientData.date_of_birth || null,
        blood_type: pendingPatientData.blood_type || null,
        allergies: pendingPatientData.allergies
          ? pendingPatientData.allergies.split(",").map((a) => a.trim())
          : null,
        emergency_contact_name: pendingPatientData.emergency_contact_name || null,
        emergency_contact_phone: pendingPatientData.emergency_contact_phone || null,
        address: pendingPatientData.address || null,
        notes: pendingPatientData.notes || null,
        doctor_id: userData.user.id,
      };

      const { data: newPatient, error: insertError } = await supabase
        .from("patients")
        .insert([patientData])
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Save Habeas Data authorization
      const authInserts: object[] = [{
        patient_id: newPatient.id,
        tipo: "habeas_data",
        texto_mostrado: HABEAS_DATA_TEXT,
        aceptado: true,
        firma_url: firmaUrl || null,
        medico_id: userData.user.id,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent,
      }];

      // Save general consent if accepted (covers all future routine consultations)
      if (consentimientoGeneral) {
        authInserts.push({
          patient_id: newPatient.id,
          tipo: "consentimiento_informado",
          procedimiento: "consulta_general",
          texto_mostrado: CONSENTIMIENTO_GENERAL_TEXT.replace("[FECHA_REGISTRO]", new Date().toLocaleDateString("es-CO")),
          aceptado: true,
          firma_url: firmaUrl || null,
          medico_id: userData.user.id,
          ip_address: window.location.hostname,
          user_agent: navigator.userAgent,
        });
      }

      await supabase.from("patient_authorizations").insert(authInserts);

      toast({
        title: "Paciente creado",
        description: "El paciente se registró exitosamente con autorización Habeas Data.",
      });

      setShowHabeas(false);
      setPendingPatientData(null);
      onOpenChange(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleHabeasRejected = () => {
    setShowHabeas(false);
    setPendingPatientData(null);
  };

  return (
    <>
    <HabeasDataDialog
      open={showHabeas}
      patientName={pendingPatientData?.full_name ?? ""}
      onAccepted={handleHabeasAccepted}
      onRejected={handleHabeasRejected}
    />
    <Dialog open={open} onOpenChange={(open) => onOpenChange(open)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{patient ? "Editar Paciente" : "Nuevo Paciente"}</DialogTitle>
          <DialogDescription>
            {patient ? "Modifica los datos del paciente" : "Completa el formulario para registrar un nuevo paciente"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Juan Pérez" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+57 300 123 4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="juan@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blood_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Sangre</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="O+" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alergias</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Penicilina, Polen" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergency_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contacto de Emergencia</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="María Pérez" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergency_contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de Emergencia</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+57 300 123 4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Calle 123 #45-67" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Observaciones generales..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {patient ? "Actualizar" : "Crear Paciente"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
};
