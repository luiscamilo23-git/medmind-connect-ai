import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AISuggestion {
  inventory_id: string;
  inventory_name: string;
  quantity_used: number;
  appointment_id: string;
  patient_name: string;
  reason: string;
}

interface AIInventorySuggestionsProps {
  onApplied: () => void;
}

const AIInventorySuggestions = ({ onApplied }: AIInventorySuggestionsProps) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);

  const analyzeTodayAppointments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke(
        "analyze-inventory-usage",
        {
          body: { date: today, doctorId: user.id },
        }
      );

      if (error) throw error;

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        // Select all by default
        setSelectedSuggestions(new Set(data.suggestions.map((_: any, i: number) => i)));
        toast.success(`IA analizó ${data.total_appointments} citas y generó ${data.total_suggestions} sugerencias`);
      } else {
        toast.info("No hay sugerencias de uso de inventario para hoy");
        setSuggestions([]);
      }
    } catch (error: any) {
      console.error("Error analyzing appointments:", error);
      if (error.message?.includes("429")) {
        toast.error("Límite de tasa excedido. Por favor intenta más tarde.");
      } else if (error.message?.includes("402")) {
        toast.error("Créditos insuficientes. Por favor recarga tu cuenta.");
      } else {
        toast.error("Error al analizar citas con IA");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const applySuggestions = async () => {
    try {
      setApplying(true);
      const selectedItems = Array.from(selectedSuggestions).map(i => suggestions[i]);

      // Insert all selected suggestions
      const usageRecords = selectedItems.map(suggestion => ({
        inventory_id: suggestion.inventory_id,
        quantity_used: suggestion.quantity_used,
        medical_record_id: null,
        notes: `IA: ${suggestion.reason} (${suggestion.patient_name})`,
      }));

      const { error } = await supabase
        .from("inventory_usage")
        .insert(usageRecords);

      if (error) throw error;

      toast.success(`Se aplicaron ${selectedItems.length} actualizaciones de inventario`);
      setSuggestions([]);
      setSelectedSuggestions(new Set());
      onApplied();
    } catch (error) {
      console.error("Error applying suggestions:", error);
      toast.error("Error al aplicar sugerencias");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Actualización Inteligente de Stock
            </CardTitle>
            <CardDescription>
              La IA analiza las citas del día y sugiere qué inventario se usó
            </CardDescription>
          </div>
          <Button
            onClick={analyzeTodayAppointments}
            disabled={loading || applying}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Analizar Citas de Hoy
          </Button>
        </div>
      </CardHeader>

      {suggestions.length > 0 && (
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedSuggestions.size} de {suggestions.length} sugerencias seleccionadas
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSuggestions(new Set())}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Deseleccionar Todo
              </Button>
              <Button
                size="sm"
                onClick={applySuggestions}
                disabled={selectedSuggestions.size === 0 || applying}
              >
                {applying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Aplicar Seleccionadas
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSuggestions.has(index)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedSuggestions.has(index)}
                    onCheckedChange={() => toggleSuggestion(index)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{suggestion.inventory_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Paciente: {suggestion.patient_name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-lg font-bold">
                        {suggestion.quantity_used}x
                      </Badge>
                    </div>
                    <p className="text-sm bg-muted/50 p-2 rounded">
                      💡 {suggestion.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AIInventorySuggestions;
