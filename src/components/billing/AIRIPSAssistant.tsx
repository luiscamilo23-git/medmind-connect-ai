import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  FileText,
  Stethoscope,
  ClipboardCheck,
  Wand2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AIRIPSAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId?: string;
  onSuggestionsApplied?: () => void;
}

interface CUPSSuggestion {
  codigo: string;
  descripcion: string;
  confianza: number;
}

interface CIE10Suggestion {
  codigo: string;
  descripcion: string;
  confianza: number;
}

interface ValidationIssue {
  record_index?: number;
  campo: string;
  valor_actual?: string;
  error: string;
  sugerencia: string;
  valor_corregido?: string;
  severidad: "error" | "warning" | "info";
  selected?: boolean;
}

interface CompletedRecord {
  record_id: string;
  updates: {
    codigo_servicio?: string;
    codigo_diagnostico_principal?: string;
    codigo_diagnostico_relacionado?: string;
    tipo_diagnostico_principal?: string;
    datos_json_updates?: any;
  };
  confidence: number;
  reasoning: string;
  selected?: boolean;
}

export function AIRIPSAssistant({
  open,
  onOpenChange,
  batchId,
  onSuggestionsApplied,
}: AIRIPSAssistantProps) {
  const queryClient = useQueryClient();
  
  // Tab states
  const [activeTab, setActiveTab] = useState("cups");
  
  // CUPS suggestion state
  const [serviceDescription, setServiceDescription] = useState("");
  const [cupsSuggestions, setCupsSuggestions] = useState<CUPSSuggestion[]>([]);
  
  // CIE-10 suggestion state
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [cie10Suggestions, setCIE10Suggestions] = useState<{
    principal?: CIE10Suggestion;
    relacionados?: CIE10Suggestion[];
  }>({});
  
  // Validation state
  const [validationResult, setValidationResult] = useState<{
    is_valid: boolean;
    total_errors: number;
    total_warnings: number;
    validation_issues: ValidationIssue[];
    summary: string;
  } | null>(null);
  
  // Auto-complete state
  const [completedRecords, setCompletedRecords] = useState<CompletedRecord[]>([]);
  const [autoCompleteSummary, setAutoCompleteSummary] = useState("");
  
  // Loading states
  const [isLoadingCups, setIsLoadingCups] = useState(false);
  const [isLoadingCie10, setIsLoadingCie10] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const suggestCUPSMutation = useMutation({
    mutationFn: async () => {
      setIsLoadingCups(true);
      const { data, error } = await supabase.functions.invoke("ai-rips-assistant", {
        body: {
          action: "suggest_cups",
          serviceDescription,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.result?.suggestions) {
        setCupsSuggestions(data.result.suggestions);
        toast.success("Sugerencias CUPS generadas");
      }
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
    onSettled: () => setIsLoadingCups(false),
  });

  const suggestCIE10Mutation = useMutation({
    mutationFn: async () => {
      setIsLoadingCie10(true);
      const { data, error } = await supabase.functions.invoke("ai-rips-assistant", {
        body: {
          action: "suggest_cie10",
          clinicalNotes,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.result) {
        setCIE10Suggestions({
          principal: data.result.diagnostico_principal,
          relacionados: data.result.diagnosticos_relacionados,
        });
        toast.success("Sugerencias CIE-10 generadas");
      }
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
    onSettled: () => setIsLoadingCie10(false),
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!batchId) throw new Error("No hay lote seleccionado");
      setIsValidating(true);
      const { data, error } = await supabase.functions.invoke("ai-rips-assistant", {
        body: {
          action: "validate_and_correct",
          batchId,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.result) {
        const issues = data.result.validation_issues.map((issue: ValidationIssue) => ({
          ...issue,
          selected: issue.severidad === "error",
        }));
        setValidationResult({ ...data.result, validation_issues: issues });
        toast.success("Validación completada");
      }
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
    onSettled: () => setIsValidating(false),
  });

  const autoCompleteMutation = useMutation({
    mutationFn: async () => {
      if (!batchId) throw new Error("No hay lote seleccionado");
      setIsAutoCompleting(true);
      const { data, error } = await supabase.functions.invoke("ai-rips-assistant", {
        body: {
          action: "auto_complete",
          batchId,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.result) {
        const records = data.result.completed_records.map((rec: CompletedRecord) => ({
          ...rec,
          selected: rec.confidence >= 80,
        }));
        setCompletedRecords(records);
        setAutoCompleteSummary(data.result.summary);
        toast.success("Autocompletado generado");
      }
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
    onSettled: () => setIsAutoCompleting(false),
  });

  const applyCorrections = async () => {
    if (!batchId) return;
    
    const selectedRecords = completedRecords.filter((r) => r.selected);
    if (selectedRecords.length === 0) {
      toast.error("Selecciona al menos una corrección para aplicar");
      return;
    }

    setIsApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-rips-assistant", {
        body: {
          action: "apply_ai_corrections",
          batchId,
          corrections: selectedRecords,
        },
      });

      if (error) throw error;

      toast.success(`${selectedRecords.length} correcciones aplicadas`);
      queryClient.invalidateQueries({ queryKey: ["rips-batches"] });
      onSuggestionsApplied?.();
      setCompletedRecords([]);
      setAutoCompleteSummary("");
    } catch (error: any) {
      toast.error(`Error al aplicar: ${error.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  const toggleRecordSelection = (index: number) => {
    setCompletedRecords((prev) =>
      prev.map((rec, i) =>
        i === index ? { ...rec, selected: !rec.selected } : rec
      )
    );
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-primary">Alta ({confidence}%)</Badge>;
    if (confidence >= 70) return <Badge className="bg-accent text-accent-foreground">Media ({confidence}%)</Badge>;
    return <Badge variant="destructive">Baja ({confidence}%)</Badge>;
  };

  const getSeverityIcon = (severity: "error" | "warning" | "info") => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
      case "info":
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Asistente IA para RIPS
          </DialogTitle>
          <DialogDescription>
            Automatiza la generación de códigos CUPS, CIE-10 y valida tus registros RIPS
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="cups" className="gap-2">
              <Search className="h-4 w-4" />
              CUPS
            </TabsTrigger>
            <TabsTrigger value="cie10" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              CIE-10
            </TabsTrigger>
            <TabsTrigger value="validate" className="gap-2" disabled={!batchId}>
              <ClipboardCheck className="h-4 w-4" />
              Validar
            </TabsTrigger>
            <TabsTrigger value="autocomplete" className="gap-2" disabled={!batchId}>
              <Wand2 className="h-4 w-4" />
              Auto
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            {/* CUPS Suggestions Tab */}
            <TabsContent value="cups" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="service-desc">Descripción del Servicio</Label>
                <Textarea
                  id="service-desc"
                  placeholder="Ej: Consulta de medicina general para paciente con dolor lumbar..."
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button
                onClick={() => suggestCUPSMutation.mutate()}
                disabled={isLoadingCups || !serviceDescription.trim()}
                className="w-full"
              >
                {isLoadingCups ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Sugerir Códigos CUPS
                  </>
                )}
              </Button>

              {cupsSuggestions.length > 0 && (
                <div className="space-y-2">
                  <Label>Sugerencias:</Label>
                  {cupsSuggestions.map((sug, idx) => (
                    <Card key={idx} className="cursor-pointer hover:bg-accent/50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-mono font-bold text-lg">{sug.codigo}</p>
                          <p className="text-sm text-muted-foreground">{sug.descripcion}</p>
                        </div>
                        {getConfidenceBadge(sug.confianza)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* CIE-10 Suggestions Tab */}
            <TabsContent value="cie10" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="clinical-notes">Notas Clínicas / Diagnóstico</Label>
                <Textarea
                  id="clinical-notes"
                  placeholder="Ej: Paciente refiere dolor epigástrico, náuseas, presenta signos de gastritis..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={() => suggestCIE10Mutation.mutate()}
                disabled={isLoadingCie10 || !clinicalNotes.trim()}
                className="w-full"
              >
                {isLoadingCie10 ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Sugerir Códigos CIE-10
                  </>
                )}
              </Button>

              {cie10Suggestions.principal && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-primary">Diagnóstico Principal:</Label>
                    <Card className="mt-2">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-mono font-bold text-lg">{cie10Suggestions.principal.codigo}</p>
                          <p className="text-sm text-muted-foreground">
                            {cie10Suggestions.principal.descripcion}
                          </p>
                        </div>
                        {getConfidenceBadge(cie10Suggestions.principal.confianza)}
                      </CardContent>
                    </Card>
                  </div>

                  {cie10Suggestions.relacionados && cie10Suggestions.relacionados.length > 0 && (
                    <div>
                      <Label>Diagnósticos Relacionados:</Label>
                      <div className="space-y-2 mt-2">
                        {cie10Suggestions.relacionados.map((rel, idx) => (
                          <Card key={idx} className="cursor-pointer hover:bg-accent/50">
                            <CardContent className="p-3 flex items-center justify-between">
                              <div>
                                <p className="font-mono font-semibold">{rel.codigo}</p>
                                <p className="text-sm text-muted-foreground">{rel.descripcion}</p>
                              </div>
                              {getConfidenceBadge(rel.confianza)}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Validation Tab */}
            <TabsContent value="validate" className="space-y-4 mt-4">
              {!batchId ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Selecciona un lote</AlertTitle>
                  <AlertDescription>
                    Abre este asistente desde un lote RIPS específico para validar sus registros.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Button
                    onClick={() => validateMutation.mutate()}
                    disabled={isValidating}
                    className="w-full"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validando RIPS...
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Validar con IA
                      </>
                    )}
                  </Button>

                  {validationResult && (
                    <div className="space-y-4">
                      <Alert variant={validationResult.is_valid ? "default" : "destructive"}>
                        {validationResult.is_valid ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>
                          {validationResult.is_valid ? "RIPS Válido" : "Se encontraron problemas"}
                        </AlertTitle>
                        <AlertDescription>
                          {validationResult.summary}
                          <div className="flex gap-4 mt-2">
                            <Badge variant="destructive">{validationResult.total_errors} errores</Badge>
                            <Badge variant="secondary">{validationResult.total_warnings} advertencias</Badge>
                          </div>
                        </AlertDescription>
                      </Alert>

                      {validationResult.validation_issues.length > 0 && (
                        <div className="space-y-2">
                          {validationResult.validation_issues.map((issue, idx) => (
                            <Card key={idx}>
                              <CardContent className="p-3">
                                <div className="flex items-start gap-2">
                                  {getSeverityIcon(issue.severidad)}
                                  <div className="flex-1">
                                    <p className="font-semibold">{issue.campo}</p>
                                    <p className="text-sm text-destructive">{issue.error}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      💡 {issue.sugerencia}
                                    </p>
                                    {issue.valor_corregido && (
                                      <Badge variant="outline" className="mt-1">
                                        Valor sugerido: {issue.valor_corregido}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Auto-complete Tab */}
            <TabsContent value="autocomplete" className="space-y-4 mt-4">
              {!batchId ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Selecciona un lote</AlertTitle>
                  <AlertDescription>
                    Abre este asistente desde un lote RIPS para autocompletar campos faltantes.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert>
                    <Wand2 className="h-4 w-4" />
                    <AlertTitle>Autocompletado Inteligente</AlertTitle>
                    <AlertDescription>
                      La IA analizará los registros y sugerirá códigos CUPS, CIE-10 y completará
                      campos faltantes basándose en la información disponible.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => autoCompleteMutation.mutate()}
                    disabled={isAutoCompleting}
                    className="w-full"
                  >
                    {isAutoCompleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analizando registros...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Autocompletar con IA
                      </>
                    )}
                  </Button>

                  {completedRecords.length > 0 && (
                    <div className="space-y-4">
                      {autoCompleteSummary && (
                        <Alert>
                          <Sparkles className="h-4 w-4" />
                          <AlertDescription>{autoCompleteSummary}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label>Sugerencias de completado:</Label>
                        {completedRecords.map((rec, idx) => (
                          <Card key={idx} className={rec.selected ? "border-primary" : ""}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={rec.selected}
                                  onCheckedChange={() => toggleRecordSelection(idx)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold text-sm">
                                      Registro: {rec.record_id.slice(0, 8)}...
                                    </p>
                                    {getConfidenceBadge(rec.confidence)}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    {rec.updates.codigo_servicio && (
                                      <div>
                                        <span className="text-muted-foreground">CUPS: </span>
                                        <span className="font-mono">{rec.updates.codigo_servicio}</span>
                                      </div>
                                    )}
                                    {rec.updates.codigo_diagnostico_principal && (
                                      <div>
                                        <span className="text-muted-foreground">CIE-10: </span>
                                        <span className="font-mono">{rec.updates.codigo_diagnostico_principal}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {rec.reasoning}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <Button
                        onClick={applyCorrections}
                        disabled={isApplying || !completedRecords.some((r) => r.selected)}
                        className="w-full"
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Aplicando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aplicar {completedRecords.filter((r) => r.selected).length} Correcciones
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
