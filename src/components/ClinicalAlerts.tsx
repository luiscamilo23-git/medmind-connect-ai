import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  Pill, 
  Activity, 
  FileText, 
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";

interface VitalSignAlert {
  parameter: string;
  value: string;
  status: 'normal' | 'warning' | 'critical';
  message: string;
}

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'low' | 'moderate' | 'severe';
  description: string;
  recommendation: string;
}

interface CIE10Suggestion {
  code: string;
  description: string;
  confidence: number;
}

interface LabResult {
  testName: string;
  value: string;
  unit?: string;
  status?: 'normal' | 'abnormal';
  referenceRange?: string;
}

export interface ClinicalAlertsData {
  vitalSignAlerts?: VitalSignAlert[];
  drugInteractions?: DrugInteraction[];
  cie10Suggestions?: CIE10Suggestion[];
  labResults?: LabResult[];
}

interface ClinicalAlertsProps {
  data: ClinicalAlertsData;
  onSelectCIE10?: (code: string) => void;
  onDismissInteraction?: (index: number) => void;
}

export function ClinicalAlerts({ data, onSelectCIE10, onDismissInteraction }: ClinicalAlertsProps) {
  const hasAlerts = 
    (data.vitalSignAlerts && data.vitalSignAlerts.length > 0) ||
    (data.drugInteractions && data.drugInteractions.length > 0) ||
    (data.cie10Suggestions && data.cie10Suggestions.length > 0) ||
    (data.labResults && data.labResults.length > 0);

  if (!hasAlerts) return null;

  const getVitalStatusColor = (status: VitalSignAlert['status']) => {
    switch (status) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'warning': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      default: return 'bg-primary/20 text-primary';
    }
  };

  const getInteractionColor = (severity: DrugInteraction['severity']) => {
    switch (severity) {
      case 'severe': return 'destructive';
      case 'moderate': return 'secondary';
      default: return 'outline';
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return { label: 'Alta', variant: 'default' as const };
    if (confidence >= 70) return { label: 'Media', variant: 'secondary' as const };
    return { label: 'Baja', variant: 'outline' as const };
  };

  return (
    <div className="space-y-4">
      {/* Alertas de Signos Vitales */}
      {data.vitalSignAlerts && data.vitalSignAlerts.filter(a => a.status !== 'normal').length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-yellow-500" />
              Alertas de Signos Vitales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.vitalSignAlerts.filter(a => a.status !== 'normal').map((alert, idx) => (
              <Alert key={idx} variant={alert.status === 'critical' ? 'destructive' : 'default'} className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm font-medium">
                  {alert.parameter}: {alert.value}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Interacciones Medicamentosas */}
      {data.drugInteractions && data.drugInteractions.length > 0 && (
        <Card className="border-red-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4 text-red-500" />
              Interacciones Medicamentosas Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.drugInteractions.map((interaction, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getInteractionColor(interaction.severity)}>
                      {interaction.severity === 'severe' ? 'Severa' : 
                       interaction.severity === 'moderate' ? 'Moderada' : 'Leve'}
                    </Badge>
                    <span className="font-medium text-sm">
                      {interaction.drug1} + {interaction.drug2}
                    </span>
                  </div>
                  {onDismissInteraction && (
                    <button 
                      onClick={() => onDismissInteraction(idx)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{interaction.description}</p>
                <p className="text-xs text-primary font-medium">
                  💡 {interaction.recommendation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sugerencias CIE-10 */}
      {data.cie10Suggestions && data.cie10Suggestions.length > 0 && (
        <Card className="border-blue-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Códigos CIE-10 Sugeridos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.cie10Suggestions.map((suggestion, idx) => {
                const confidenceBadge = getConfidenceBadge(suggestion.confidence);
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectCIE10?.(suggestion.code)}
                    className="w-full text-left border rounded-lg p-3 hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-mono">
                        {suggestion.code}
                      </code>
                      <span className="text-sm">{suggestion.description}</span>
                    </div>
                    <Badge variant={confidenceBadge.variant} className="text-xs">
                      {suggestion.confidence}% {confidenceBadge.label}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados de Laboratorio Extraídos */}
      {data.labResults && data.labResults.length > 0 && (
        <Card className="border-purple-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-purple-500" />
              Laboratorios Mencionados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {data.labResults.map((lab, idx) => (
                <div key={idx} className="flex items-center justify-between border rounded px-3 py-2">
                  <span className="text-sm font-medium">{lab.testName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {lab.value} {lab.unit || ''}
                    </span>
                    {lab.status && (
                      lab.status === 'normal' ? 
                        <CheckCircle className="h-4 w-4 text-primary" /> :
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
              {data.labResults[0]?.referenceRange && (
                <p className="text-xs text-muted-foreground mt-1">
                  * Valores de referencia pueden variar según laboratorio
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
