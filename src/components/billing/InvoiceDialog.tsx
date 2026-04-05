import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, FileCode, Eye, X, Save } from "lucide-react";
import { format, addDays } from "date-fns";

const invoiceSchema = z.object({
  patient_id: z.string().min(1, "Paciente requerido"),
  fecha_vencimiento: z.string().min(1, "Fecha de vencimiento requerida"),
  notas: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

type Service = {
  id: string;
  nombre_servicio: string;
  codigo_cups: string | null;
  precio_unitario: number;
  tipo_servicio: string;
  impuestos_aplican: boolean;
  porcentaje_impuesto: number;
};

type Patient = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
};

type InvoiceItem = {
  service_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  codigo_cups: string | null;
  subtotal_linea: number;
  impuestos_linea: number;
  total_linea: number;
};

type InvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPatientId?: string;
  initialServiceId?: string;
  initialMedicalRecordId?: string;
};

export function InvoiceDialog({ open, onOpenChange, initialPatientId, initialServiceId, initialMedicalRecordId }: InvoiceDialogProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [showXMLPreview, setShowXMLPreview] = useState(false);
  const [xmlContent, setXmlContent] = useState<string>("");
  const [prefilledFromRecord, setPrefilledFromRecord] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      patient_id: initialPatientId || "",
      fecha_vencimiento: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      notas: "",
    },
  });

  // Auto-prefill patient + service when opened from medical record
  useEffect(() => {
    if (!open) { setPrefilledFromRecord(false); return; }
    if (initialPatientId) form.setValue("patient_id", initialPatientId);
  }, [open, initialPatientId, form]);

  useEffect(() => {
    if (!open || prefilledFromRecord || !initialServiceId || !services) return;
    const service = services.find(s => s.id === initialServiceId);
    if (!service) return;
    const subtotal_linea = service.precio_unitario * 1;
    const impuestos_linea = service.impuestos_aplican
      ? subtotal_linea * (service.porcentaje_impuesto / 100) : 0;
    setItems([{
      service_id: service.id,
      descripcion: service.nombre_servicio,
      cantidad: 1,
      precio_unitario: service.precio_unitario,
      codigo_cups: service.codigo_cups,
      subtotal_linea,
      impuestos_linea,
      total_linea: subtotal_linea + impuestos_linea,
    }]);
    setPrefilledFromRecord(true);
  }, [open, services, initialServiceId, prefilledFromRecord]);

  // Fetch patients
  const { data: patients } = useQuery({
    queryKey: ["patients-for-invoice"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, phone, email, address")
        .eq("doctor_id", userData.user.id)
        .order("full_name");

      if (error) throw error;
      return data as Patient[];
    },
  });

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ["services-for-invoice"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("doctor_id", userData.user.id)
        .eq("activo", true)
        .order("nombre_servicio");

      if (error) throw error;
      return data as Service[];
    },
  });

  // Fetch doctor profile for XML preview
  const { data: doctorProfile } = useQuery({
    queryKey: ["doctor-profile-invoice"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, license_number, phone, clinic_name, city")
        .eq("id", userData.user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal_linea, 0);
    const impuestos = items.reduce((sum, item) => sum + item.impuestos_linea, 0);
    const total = subtotal + impuestos;
    return { subtotal, impuestos, total };
  };

  const addItem = () => {
    if (!selectedServiceId || quantity <= 0) {
      toast.error("Seleccione un servicio y cantidad válida");
      return;
    }

    const service = services?.find((s) => s.id === selectedServiceId);
    if (!service) return;

    const subtotal_linea = service.precio_unitario * quantity;
    const impuestos_linea = service.impuestos_aplican
      ? subtotal_linea * (service.porcentaje_impuesto / 100)
      : 0;
    const total_linea = subtotal_linea + impuestos_linea;

    const newItem: InvoiceItem = {
      service_id: service.id,
      descripcion: service.nombre_servicio,
      cantidad: quantity,
      precio_unitario: service.precio_unitario,
      codigo_cups: service.codigo_cups,
      subtotal_linea,
      impuestos_linea,
      total_linea,
    };

    setItems([...items, newItem]);
    setSelectedServiceId("");
    setQuantity(1);
    toast.success("Ítem agregado");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  const generateXMLPreview = () => {
    const patientId = form.getValues("patient_id");
    const patient = patients?.find((p) => p.id === patientId);
    
    if (!patient || items.length === 0) {
      toast.error("Seleccione un paciente y agregue al menos un ítem");
      return;
    }

    const { subtotal, impuestos, total } = calculateTotals();
    const now = new Date().toISOString();
    const fechaEmision = format(new Date(), "yyyy-MM-dd");
    const fechaVencimiento = form.getValues("fecha_vencimiento");
    const notas = form.getValues("notas");

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">\n';
    xml += '  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>\n';
    xml += '  <cbc:ID>[PENDIENTE - Se asignará al emitir]</cbc:ID>\n';
    xml += '  <cbc:UUID>[CUFE - Se generará al emitir a DIAN]</cbc:UUID>\n';
    xml += `  <cbc:IssueDate>${fechaEmision}</cbc:IssueDate>\n`;
    xml += `  <cbc:IssueTime>${now.split("T")[1].split(".")[0]}</cbc:IssueTime>\n`;
    xml += `  <cbc:DueDate>${fechaVencimiento}</cbc:DueDate>\n`;
    xml += '  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>\n';
    
    if (notas) {
      xml += `  <cbc:Note>${escapeXML(notas)}</cbc:Note>\n`;
    }

    // Supplier (Doctor/Clinic)
    xml += '  <cac:AccountingSupplierParty>\n';
    xml += '    <cac:Party>\n';
    xml += '      <cac:PartyName>\n';
    xml += `        <cbc:Name>${escapeXML(doctorProfile?.clinic_name || doctorProfile?.full_name || "N/A")}</cbc:Name>\n`;
    xml += '      </cac:PartyName>\n';
    xml += '      <cac:PhysicalLocation>\n';
    xml += '        <cac:Address>\n';
    xml += `          <cbc:CityName>${escapeXML(doctorProfile?.city || "N/A")}</cbc:CityName>\n`;
    xml += '          <cac:Country>\n';
    xml += '            <cbc:IdentificationCode>CO</cbc:IdentificationCode>\n';
    xml += '          </cac:Country>\n';
    xml += '        </cac:Address>\n';
    xml += '      </cac:PhysicalLocation>\n';
    xml += '      <cac:Contact>\n';
    xml += `        <cbc:Telephone>${escapeXML(doctorProfile?.phone || "N/A")}</cbc:Telephone>\n`;
    xml += '      </cac:Contact>\n';
    xml += '    </cac:Party>\n';
    xml += '  </cac:AccountingSupplierParty>\n';

    // Customer (Patient)
    xml += '  <cac:AccountingCustomerParty>\n';
    xml += '    <cac:Party>\n';
    xml += '      <cac:PartyName>\n';
    xml += `        <cbc:Name>${escapeXML(patient.full_name)}</cbc:Name>\n`;
    xml += '      </cac:PartyName>\n';
    xml += '      <cac:PhysicalLocation>\n';
    xml += '        <cac:Address>\n';
    xml += `          <cbc:AddressLine>${escapeXML(patient.address || "N/A")}</cbc:AddressLine>\n`;
    xml += '          <cac:Country>\n';
    xml += '            <cbc:IdentificationCode>CO</cbc:IdentificationCode>\n';
    xml += '          </cac:Country>\n';
    xml += '        </cac:Address>\n';
    xml += '      </cac:PhysicalLocation>\n';
    xml += '      <cac:Contact>\n';
    xml += `        <cbc:Telephone>${escapeXML(patient.phone)}</cbc:Telephone>\n`;
    if (patient.email) {
      xml += `        <cbc:ElectronicMail>${escapeXML(patient.email)}</cbc:ElectronicMail>\n`;
    }
    xml += '      </cac:Contact>\n';
    xml += '    </cac:Party>\n';
    xml += '  </cac:AccountingCustomerParty>\n';

    // Tax Total
    xml += '  <cac:TaxTotal>\n';
    xml += `    <cbc:TaxAmount currencyID="COP">${impuestos.toFixed(2)}</cbc:TaxAmount>\n`;
    xml += '  </cac:TaxTotal>\n';

    // Legal Monetary Total
    xml += '  <cac:LegalMonetaryTotal>\n';
    xml += `    <cbc:LineExtensionAmount currencyID="COP">${subtotal.toFixed(2)}</cbc:LineExtensionAmount>\n`;
    xml += `    <cbc:TaxExclusiveAmount currencyID="COP">${subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>\n`;
    xml += `    <cbc:TaxInclusiveAmount currencyID="COP">${total.toFixed(2)}</cbc:TaxInclusiveAmount>\n`;
    xml += `    <cbc:PayableAmount currencyID="COP">${total.toFixed(2)}</cbc:PayableAmount>\n`;
    xml += '  </cac:LegalMonetaryTotal>\n';

    // Invoice Lines
    items.forEach((item, index) => {
      xml += '  <cac:InvoiceLine>\n';
      xml += `    <cbc:ID>${index + 1}</cbc:ID>\n`;
      xml += `    <cbc:InvoicedQuantity unitCode="EA">${item.cantidad}</cbc:InvoicedQuantity>\n`;
      xml += `    <cbc:LineExtensionAmount currencyID="COP">${item.subtotal_linea.toFixed(2)}</cbc:LineExtensionAmount>\n`;
      xml += '    <cac:Item>\n';
      xml += `      <cbc:Description>${escapeXML(item.descripcion)}</cbc:Description>\n`;
      if (item.codigo_cups) {
        xml += '      <cac:StandardItemIdentification>\n';
        xml += `        <cbc:ID schemeID="CUPS">${escapeXML(item.codigo_cups)}</cbc:ID>\n`;
        xml += '      </cac:StandardItemIdentification>\n';
      }
      xml += '    </cac:Item>\n';
      xml += '    <cac:Price>\n';
      xml += `      <cbc:PriceAmount currencyID="COP">${item.precio_unitario.toFixed(2)}</cbc:PriceAmount>\n`;
      xml += '    </cac:Price>\n';
      xml += '  </cac:InvoiceLine>\n';
    });

    xml += '</Invoice>';

    setXmlContent(xml);
    setShowXMLPreview(true);
  };

  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      if (items.length === 0) {
        throw new Error("Debe agregar al menos un ítem a la factura");
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado");

      const { subtotal, impuestos, total } = calculateTotals();

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          doctor_id: userData.user.id,
          patient_id: data.patient_id,
          fecha_emision: format(new Date(), "yyyy-MM-dd"),
          fecha_vencimiento: data.fecha_vencimiento,
          subtotal,
          impuestos,
          total,
          notas: data.notas || null,
          estado: "DRAFT",
          payment_status: "PENDIENTE",
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = items.map((item) => ({
        invoice_id: invoice.id,
        service_id: item.service_id,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        codigo_cups: item.codigo_cups,
        subtotal_linea: item.subtotal_linea,
        impuestos_linea: item.impuestos_linea,
        total_linea: item.total_linea,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Factura creada como borrador");
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear factura");
    },
  });

  const resetForm = () => {
    form.reset();
    setItems([]);
    setSelectedServiceId("");
    setQuantity(1);
    setShowXMLPreview(false);
    setXmlContent("");
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const onSubmit = (data: InvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  const { subtotal, impuestos, total } = calculateTotals();
  const selectedPatient = patients?.find((p) => p.id === form.watch("patient_id"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Nueva Factura Electrónica
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {showXMLPreview ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="gap-1">
                  <FileCode className="h-3 w-3" />
                  Previsualización XML (Formato UBL 2.1 DIAN)
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setShowXMLPreview(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Cerrar
                </Button>
              </div>
              <ScrollArea className="flex-1 border rounded-md bg-muted/30">
                <pre className="p-4 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                  {xmlContent}
                </pre>
              </ScrollArea>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowXMLPreview(false)}>
                  Volver a editar
                </Button>
                <Button onClick={() => {
                  setShowXMLPreview(false);
                  form.handleSubmit(onSubmit)();
                }}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Factura
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[70vh] pr-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Patient Selection */}
                  <Card>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold mb-4">Datos del Cliente</h3>
                      <FormField
                        control={form.control}
                        name="patient_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Paciente *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar paciente..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {patients?.map((patient) => (
                                  <SelectItem key={patient.id} value={patient.id}>
                                    {patient.full_name} - {patient.phone}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {selectedPatient && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-md text-sm space-y-1">
                          <p><strong>Email:</strong> {selectedPatient.email || "No registrado"}</p>
                          <p><strong>Dirección:</strong> {selectedPatient.address || "No registrada"}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Add Services */}
                  <Card>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold mb-4">Servicios</h3>
                      <div className="flex gap-2 mb-4">
                        <div className="flex-1">
                          <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar servicio..." />
                            </SelectTrigger>
                            <SelectContent>
                              {services?.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.nombre_servicio} - {formatCurrency(service.precio_unitario)}
                                  {service.codigo_cups && ` (CUPS: ${service.codigo_cups})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-24"
                          placeholder="Cant."
                        />
                        <Button type="button" onClick={addItem} variant="secondary">
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar
                        </Button>
                      </div>

                      {items.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-4">
                          No hay servicios agregados
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{item.descripcion}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.cantidad} x {formatCurrency(item.precio_unitario)}
                                  {item.codigo_cups && ` • CUPS: ${item.codigo_cups}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(item.total_linea)}</p>
                                  {item.impuestos_linea > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      IVA: {formatCurrency(item.impuestos_linea)}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Invoice Details */}
                  <Card>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold mb-4">Detalles de la Factura</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fecha_vencimiento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha de Vencimiento *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notas"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Notas (Opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Observaciones adicionales..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Totals */}
                  {items.length > 0 && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">IVA</span>
                            <span>{formatCurrency(impuestos)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>{formatCurrency(total)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={generateXMLPreview}
                      disabled={items.length === 0 || !form.getValues("patient_id")}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Previsualizar XML
                    </Button>
                    <Button
                      type="submit"
                      disabled={createInvoiceMutation.isPending || items.length === 0}
                    >
                      {createInvoiceMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar como Borrador
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
