import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  SPECIALTY_OPTIONS, 
  MedicalSpecialty 
} from "@/config/medicalSpecialties";
import { Stethoscope, Baby, Heart, Brain, Scissors, Sparkles, Apple, Activity as PhysioIcon, Briefcase, UserRound } from "lucide-react";

interface SpecialtySelectorProps {
  value: MedicalSpecialty | "";
  onChange: (value: MedicalSpecialty) => void;
  showDescription?: boolean;
  disabled?: boolean;
  required?: boolean;
  showWarning?: boolean;
}

const specialtyIcons: Record<MedicalSpecialty, React.ReactNode> = {
  MEDICO_GENERAL: <Stethoscope className="w-4 h-4" />,
  PEDIATRIA: <Baby className="w-4 h-4" />,
  GINECOLOGIA: <Heart className="w-4 h-4" />,
  MEDICINA_INTERNA: <UserRound className="w-4 h-4" />,
  PSIQUIATRIA: <Brain className="w-4 h-4" />,
  CIRUGIA: <Scissors className="w-4 h-4" />,
  ESTETICA: <Sparkles className="w-4 h-4" />,
  NUTRICION: <Apple className="w-4 h-4" />,
  FISIOTERAPIA: <PhysioIcon className="w-4 h-4" />,
  MEDICINA_LABORAL: <Briefcase className="w-4 h-4" />,
};

export const SpecialtySelector = ({
  value,
  onChange,
  showDescription = true,
  disabled = false,
  required = false,
  showWarning = false,
}: SpecialtySelectorProps) => {
  const selectedOption = SPECIALTY_OPTIONS.find(opt => opt.value === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="specialty" className="flex items-center gap-2">
        <Stethoscope className="w-4 h-4 text-primary" />
        Especialidad Médica
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      <Select
        value={value}
        onValueChange={(val) => onChange(val as MedicalSpecialty)}
        disabled={disabled}
      >
        <SelectTrigger id="specialty" className={!value && required ? "border-destructive" : ""}>
          <SelectValue placeholder="Selecciona tu especialidad" />
        </SelectTrigger>
        <SelectContent>
          {SPECIALTY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {specialtyIcons[option.value]}
                <span>{option.label}</span>
                {!option.hasFullRecord && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Simplificada
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showDescription && selectedOption && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p>{selectedOption.description}</p>
          {selectedOption.hasFullRecord ? (
            <p className="text-xs mt-1 text-primary">
              ✓ Historia clínica completa con campos especializados
            </p>
          ) : (
            <p className="text-xs mt-1 text-amber-600">
              ◐ Historia clínica simplificada
            </p>
          )}
        </div>
      )}

      {showWarning && (
        <div className="text-sm bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-3 rounded-lg">
          <p className="font-medium">⚠️ Aviso importante</p>
          <p className="text-xs mt-1">
            Cambiar la especialidad modificará la estructura de la historia clínica para nuevos registros. 
            Las historias clínicas anteriores NO se verán afectadas.
          </p>
        </div>
      )}
    </div>
  );
};
