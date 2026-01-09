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
import { Mic, Square, Stethoscope, Baby, Heart, Brain, Scissors, Sparkles } from "lucide-react";
import { 
  MedicalSpecialty, 
  SpecialtyField,
  getFieldsForSpecialty,
  SPECIALTY_CONFIGS 
} from "@/config/medicalSpecialties";

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

const sectionLabels: Record<string, { title: string; icon: React.ReactNode }> = {
  datos_paciente: { title: "Datos del Paciente y Encuentro", icon: <Stethoscope className="w-4 h-4" /> },
  antecedentes: { title: "Antecedentes", icon: <Heart className="w-4 h-4" /> },
  examen: { title: "Examen Físico y Signos Vitales", icon: <Brain className="w-4 h-4" /> },
  diagnostico: { title: "Diagnóstico", icon: <Sparkles className="w-4 h-4" /> },
  plan: { title: "Plan de Manejo", icon: <Scissors className="w-4 h-4" /> },
  especializado: { title: "Campos Especializados", icon: <Baby className="w-4 h-4" /> },
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
  const config = SPECIALTY_CONFIGS[specialty];

  useEffect(() => {
    setFields(getFieldsForSpecialty(specialty));
  }, [specialty]);

  // Agrupar campos por sección
  const groupedFields = fields.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = [];
    }
    acc[field.section].push(field);
    return acc;
  }, {} as Record<string, SpecialtyField[]>);

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

  const sectionOrder = ["datos_paciente", "antecedentes", "examen", "diagnostico", "plan", "especializado"];

  return (
    <div className="space-y-6">
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

        const sectionInfo = sectionLabels[section];

        return (
          <Card key={section} className="border-border/50">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {sectionInfo.icon}
                {sectionInfo.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sectionFields.map(renderField)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
