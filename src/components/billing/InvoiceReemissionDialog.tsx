import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle2, Send, Lightbulb, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ValidationError {
  field: string;
  error: string;
  currentValue: any;
}

interface Suggestion {
  field: string;
  issue: string;
  suggestion: string;
  suggestedValue?: any;
  priority: 'high' | 'medium' | 'low';
}

interface InvoiceReemissionDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InvoiceReemissionDialog({
  invoiceId,
  open,
  onOpenChange,
  onSuccess,
}: InvoiceReemissionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [reemitting, setReemitting] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [provider, setProvider] = useState("");
  
  // Form fields
  const [fechaEmision, setFechaEmision] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (open && invoiceId) {
      loadInvoiceData();
    }
  }, [open, invoiceId]);

  const loadInvoiceData = async () => {
    setLoading(true);
    setAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('analyze-invoice-errors', {
        body: { invoiceId },
      });

      if (response.error) {
        throw response.error;
      }

      const data = response.data;
      setInvoice(data.invoice);
      setValidationErrors(data.validationErrors || []);
      setSuggestions(data.suggestions || []);
      setErrorMessage(data.errorMessage || "");
      setProvider(data.provider || "");
      
      // Initialize form fields
      setFechaEmision(data.invoice.fecha_emision);
      setFechaVencimiento(data.invoice.fecha_vencimiento);
      setNotas(data.invoice.notas || "");
    } catch (error: any) {
      console.error('Error loading invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Error al cargar datos de la factura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const handleReemit = async () => {
    if (!invoice) return;

    setReemitting(true);
    try {
      // Update invoice with corrected data
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          fecha_emision: fechaEmision,
          fecha_vencimiento: fechaVencimiento,
          notas,
          estado: 'DRAFT', // Reset to draft for reemission
          errores_validacion: null, // Clear previous errors
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      // Emit to DIAN again
      const response = await supabase.functions.invoke('emit-invoice-dian', {
        body: { invoiceId },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "¡Factura reemitida exitosamente!",
        description: `CUFE: ${response.data.cufe?.substring(0, 20)}...`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error reemitting invoice:', error);
      toast({
        title: "Error al reemitir",
        description: error.message || "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setReemitting(false);
    }
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    if (suggestion.suggestedValue) {
      if (suggestion.field === 'fecha_emision') {
        setFechaEmision(suggestion.suggestedValue);
      } else if (suggestion.field === 'fecha_vencimiento') {
        setFechaVencimiento(suggestion.suggestedValue);
      } else if (suggestion.field === 'notas') {
        setNotas(suggestion.suggestedValue);
      }
      
      toast({
        title: "Sugerencia aplicada",
        description: `Se ha actualizado ${suggestion.field}`,
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analizando factura rechazada</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                {analyzing ? "Analizando errores con IA..." : "Cargando datos..."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reemisión de Factura Rechazada</DialogTitle>
          <DialogDescription>
            Corrige los errores identificados y reemite la factura a DIAN
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Summary */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error del proveedor {provider}:</strong> {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Invoice Info */}
          {invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Información de la Factura</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Paciente</p>
                  <p className="font-medium">{invoice.patients?.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">
                    ${invoice.total.toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Proveedor DIAN</p>
                  <p className="font-medium">{invoice.proveedor_dian || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Sugerencias de Corrección (IA)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority === 'high' ? 'Alta' : 
                             suggestion.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                          <span className="font-medium text-sm">{suggestion.field}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Problema:</strong> {suggestion.issue}
                        </p>
                        <p className="text-sm">
                          <strong>Sugerencia:</strong> {suggestion.suggestion}
                        </p>
                        {suggestion.suggestedValue && (
                          <p className="text-sm mt-2 font-mono bg-muted p-2 rounded">
                            Valor sugerido: {suggestion.suggestedValue}
                          </p>
                        )}
                      </div>
                      {suggestion.suggestedValue && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplySuggestion(suggestion)}
                        >
                          Aplicar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Errores de Validación ({validationErrors.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-sm border-l-2 border-destructive pl-3 py-1">
                    <strong>{error.field}:</strong> {error.error}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Edit Form */}
          <div className="space-y-4">
            <h3 className="font-semibold">Corregir Datos</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_emision">Fecha de Emisión</Label>
                <Input
                  id="fecha_emision"
                  type="date"
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento</Label>
                <Input
                  id="fecha_vencimiento"
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                placeholder="Notas adicionales (opcional)"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleReemit}
              disabled={reemitting}
            >
              {reemitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reemitiendo...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reemitir a DIAN
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
