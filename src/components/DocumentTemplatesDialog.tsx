import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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
import { Card, CardContent } from "./ui/card";
import { Settings, Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const documentTypes = [
  { id: "prescription", label: "Fórmula Médica" },
  { id: "lab_order", label: "Orden de Laboratorio" },
  { id: "image_order", label: "Orden de Imágenes" },
  { id: "certificate", label: "Certificado Médico" },
  { id: "referral", label: "Remisión" },
  { id: "disability", label: "Incapacidad" },
];

interface Template {
  id: string;
  template_name: string;
  document_type: string;
  specialty: string | null;
  custom_fields: any;
  is_default: boolean;
}

export const DocumentTemplatesDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [templateName, setTemplateName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [customFields, setCustomFields] = useState<{ label: string; type: string; required: boolean }[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");

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

    if (error) {
      toast.error("Error al cargar plantillas");
      return;
    }

    setTemplates(data as Template[] || []);
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) {
      toast.error("Ingresa el nombre del campo");
      return;
    }

    setCustomFields([
      ...customFields,
      { label: newFieldLabel, type: newFieldType, required: false },
    ]);
    setNewFieldLabel("");
    setNewFieldType("text");
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !selectedType) {
      toast.error("Completa nombre y tipo de documento");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("No autenticado");
      return;
    }

    const { error } = await supabase.from("document_templates").insert({
      doctor_id: user.id,
      template_name: templateName,
      document_type: selectedType,
      specialty: specialty || null,
      custom_fields: customFields,
      is_default: false,
    });

    if (error) {
      toast.error("Error al guardar plantilla");
      return;
    }

    toast.success("Plantilla creada exitosamente");
    setTemplateName("");
    setSelectedType("");
    setSpecialty("");
    setCustomFields([]);
    loadTemplates();
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from("document_templates")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar plantilla");
      return;
    }

    toast.success("Plantilla eliminada");
    loadTemplates();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Plantillas
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plantillas de Documentos Personalizadas</DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p className="text-base">
              Las plantillas te permiten personalizar los documentos que genera la IA (incapacidades, órdenes de examen, etc.).
            </p>
            <div className="bg-muted p-3 rounded-lg space-y-1">
              <p className="font-medium text-foreground">💡 ¿Cómo funcionan?</p>
              <ol className="text-sm space-y-1 ml-4 list-decimal">
                <li>Creas una plantilla agregando campos personalizados (ej: "Días de incapacidad")</li>
                <li>Al generar un documento, seleccionas tu plantilla</li>
                <li>La IA incluye automáticamente esos campos en el documento generado</li>
              </ol>
            </div>
            <p className="text-sm">
              <strong>Ejemplo:</strong> Para incapacidades, puedes agregar campos como "Duración", "Tipo de reposo", "Restricciones laborales".
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Create New Template */}
          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Crear Plantilla Personalizada</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Agrega campos específicos que necesitas en tus documentos
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre de la Plantilla</Label>
                  <Input
                    placeholder="Ej: Fórmula Cardiología"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Tipo de Documento</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Especialidad (Opcional)</Label>
                <Input
                  placeholder="Ej: Cardiología, Pediatría..."
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                />
              </div>

              {/* Custom Fields */}
              <div>
                <Label>Campos Adicionales (Opcional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Agrega campos extras que quieras incluir en este tipo de documento
                </p>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Nombre del campo"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                  />
                  <Select value={newFieldType} onValueChange={setNewFieldType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="date">Fecha</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addCustomField} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {customFields.length > 0 && (
                <div className="space-y-2">
                  {customFields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">
                        {field.label} ({field.type})
                      </span>
                      <Button
                        onClick={() => removeCustomField(index)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={saveTemplate} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Guardar Plantilla
              </Button>
            </CardContent>
          </Card>

          {/* Existing Templates */}
          {templates.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Mis Plantillas</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Selecciona estas plantillas al generar documentos para usar tus campos personalizados
              </p>
              <div className="space-y-2">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{template.template_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {documentTypes.find((t) => t.id === template.document_type)?.label}
                          {template.specialty && ` - ${template.specialty}`}
                        </p>
                        {template.custom_fields.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.custom_fields.length} campos custom
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => deleteTemplate(template.id)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
