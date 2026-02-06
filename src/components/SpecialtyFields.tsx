import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Mic, 
  Square, 
  Stethoscope, 
  Baby, 
  Heart, 
  Brain, 
  Scissors, 
  Sparkles, 
  Users, 
  Activity,
  Clipboard,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  MedicalSpecialty, 
  SpecialtyField,
  getFieldsForSpecialty,
  SPECIALTY_CONFIGS 
} from "@/config/medicalSpecialties";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SpecialtyFieldsProps {
  specialty: MedicalSpecialty;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  isRecording?: boolean;
  recordingField?: string | null;
  onStartRecording?: (field: string) => void;
  onStopRecording?: () => void;
  interimTranscript?: string;
}

const sectionLabels: Record<string, { title: string; icon: React.ReactNode; description?: string }> = {
  datos_paciente: { title: "Datos del Paciente y Encuentro", icon: <Users className="w-4 h-4" /> },
  antecedentes: { title: "Antecedentes", icon: <Heart className="w-4 h-4" /> },
  ros: { title: "Revisión por Sistemas (ROS)", icon: <Activity className="w-4 h-4" />, description: "Síntomas por cada sistema corporal - Obligatorio para RIPS completos" },
  examen: { title: "Examen Físico y Signos Vitales", icon: <Stethoscope className="w-4 h-4" /> },
  diagnostico: { title: "Diagnóstico", icon: <Sparkles className="w-4 h-4" /> },
  plan: { title: "Plan de Manejo", icon: <Brain className="w-4 h-4" /> },
  quirurgico: { title: "Información Quirúrgica", icon: <Scissors className="w-4 h-4" />, description: "Datos preoperatorios, intraoperatorios y postoperatorios" },
  especializado: { title: "Campos Especializados", icon: <Clipboard className="w-4 h-4" /> },
};

export const SpecialtyFields = ({
  specialty,
  values,
  onChange,
  isRecording = false,
  recordingField = null,
  onStartRecording,
  onStopRecording,
  interimTranscript = "",
}: SpecialtyFieldsProps) => {
  const [fields, setFields] = useState<SpecialtyField[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    datos_paciente: true,
    antecedentes: true,
    ros: true,
    examen: true,
    diagnostico: true,
    plan: true,
    quirurgico: true,
    especializado: true,
  });
  const config = SPECIALTY_CONFIGS[specialty];

  useEffect(() => {
    setFields(getFieldsForSpecialty(specialty));
  }, [specialty]);

  // Check if companion fields should be visible
  const showCompanionFields = values.has_companion === "si";

  // Filter fields based on companion visibility
  const getVisibleFields = (sectionFields: SpecialtyField[]) => {
    return sectionFields.filter(field => {
      // Hide companion detail fields if no companion
      if (['companion_name', 'companion_relationship', 'companion_phone', 'companion_id'].includes(field.key)) {
        return showCompanionFields;
      }
      return true;
    });
  };

  // Agrupar campos por sección
  const groupedFields = fields.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = [];
    }
    acc[field.section].push(field);
    return acc;
  }, {} as Record<string, SpecialtyField[]>);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderField = (field: SpecialtyField) => {
    const isRecordingThis = isRecording && recordingField === field.key;
    const value = values[field.key] || "";

    const renderMicButton = () => {
      if (field.type !== "textarea" && field.type !== "text") return null;
      if (!onStartRecording || !onStopRecording) return null;

      return (
        <Button
          size="sm"
          variant={isRecordingThis ? "destructive" : "outline"}
          onClick={() => isRecordingThis ? onStopRecording() : onStartRecording(field.key)}
          className="gap-1 h-7 text-xs"
          type="button"
        >
          {isRecordingThis ? (
            <>
              <Square className="w-3 h-3" />
              Detener
            </>
          ) : (
            <>
              <Mic className="w-3 h-3" />
            </>
          )}
        </Button>
      );
    };

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.key} className="text-sm">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderMicButton()}
            </div>
            <Textarea
              id={field.key}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder || `Ingresa ${field.label.toLowerCase()}`}
              rows={3}
              className={isRecordingThis ? "border-destructive animate-pulse" : ""}
            />
            {isRecordingThis && interimTranscript && (
              <p className="text-xs text-muted-foreground italic">
                Transcribiendo: {interimTranscript}
              </p>
            )}
          </div>
        );

      case "text":
        return (
          <div key={field.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.key} className="text-sm">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderMicButton()}
            </div>
            <Input
              id={field.key}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder || `Ingresa ${field.label.toLowerCase()}`}
              className={isRecordingThis ? "border-destructive animate-pulse" : ""}
            />
            {isRecordingThis && interimTranscript && (
              <p className="text-xs text-muted-foreground italic">
                Transcribiendo: {interimTranscript}
              </p>
            )}
          </div>
        );

      case "number":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key} className="text-sm">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="number"
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );

      case "date":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key} className="text-sm">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="date"
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          </div>
        );

      case "select":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key} className="text-sm">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => onChange(field.key, val)}>
              <SelectTrigger id={field.key}>
                <SelectValue placeholder={`Selecciona ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "checkbox":
        return (
          <div key={field.key} className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={value}
              onCheckedChange={(checked) => onChange(field.key, checked)}
            />
            <Label htmlFor={field.key} className="text-sm cursor-pointer">
              {field.label}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  const sectionOrder = ["datos_paciente", "antecedentes", "ros", "examen", "diagnostico", "plan", "quirurgico", "especializado"];

  return (
    <div className="space-y-4">
      {/* Header con info de especialidad */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2 mb-1">
          <Stethoscope className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-primary">{config?.name || specialty}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{config?.description}</p>
        {config && !config.hasFullClinicalRecord && (
          <p className="text-xs text-amber-600 mt-2">
            ◐ Historia clínica simplificada - campos esenciales
          </p>
        )}
      </div>

      {/* Campos agrupados por sección */}
      {sectionOrder.map((section) => {
        const sectionFields = groupedFields[section];
        if (!sectionFields || sectionFields.length === 0) return null;

        const visibleFields = getVisibleFields(sectionFields);
        if (visibleFields.length === 0) return null;

        const sectionInfo = sectionLabels[section];
        const isOpen = openSections[section];

        // ROS section gets special styling
        const isRosSection = section === "ros";
        const isQuirurgicoSection = section === "quirurgico";

        return (
          <Collapsible 
            key={section} 
            open={isOpen} 
            onOpenChange={() => toggleSection(section)}
          >
            <Card className={`border-border/50 ${isRosSection ? 'border-blue-500/30 bg-blue-500/5' : ''} ${isQuirurgicoSection ? 'border-orange-500/30 bg-orange-500/5' : ''}`}>
              <CollapsibleTrigger asChild>
                <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {sectionInfo.icon}
                      <div>
                        <span>{sectionInfo.title}</span>
                        {sectionInfo.description && (
                          <p className="text-xs text-muted-foreground font-normal mt-0.5">
                            {sectionInfo.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-4 pb-4">
                  <div className={`grid gap-4 ${isRosSection ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {visibleFields.map(renderField)}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};
