import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, Package } from "lucide-react";
import { toast } from "sonner";

interface InventoryUsage {
  id: string;
  inventory_id: string;
  medical_record_id: string | null;
  quantity_used: number;
  used_at: string;
  notes: string | null;
  inventory: {
    name: string;
    category: string;
  };
  medical_records: {
    title: string;
    patient_id: string;
    patients: {
      full_name: string;
    };
  } | null;
}

interface InventoryUsageHistoryProps {
  loading: boolean;
}

const InventoryUsageHistory = ({ loading: parentLoading }: InventoryUsageHistoryProps) => {
  const [usageHistory, setUsageHistory] = useState<InventoryUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageHistory();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("inventory-usage-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_usage",
        },
        () => {
          loadUsageHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUsageHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("inventory_usage")
        .select(`
          id,
          inventory_id,
          medical_record_id,
          quantity_used,
          used_at,
          notes,
          inventory:inventory_id (
            name,
            category
          ),
          medical_records:medical_record_id (
            title,
            patient_id,
            patients:patient_id (
              full_name
            )
          )
        `)
        .order("used_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsageHistory(data as any || []);
    } catch (error) {
      console.error("Error loading usage history:", error);
      toast.error("Error al cargar el historial de uso");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      medication: "bg-blue-500/10 text-blue-500",
      equipment: "bg-primary/10 text-primary",
      surgical: "bg-red-500/10 text-red-500",
      diagnostic: "bg-cyan-500/10 text-cyan-500",
      disposable: "bg-green-500/10 text-green-500",
      other: "bg-gray-500/10 text-gray-500",
    };
    return colors[category] || colors.other;
  };

  if (loading || parentLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (usageHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Uso</CardTitle>
          <CardDescription>
            Registro de consumo de inventario médico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay registros de uso</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Uso de Inventario
        </CardTitle>
        <CardDescription>
          Tracking completo de consumo de suministros médicos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Historia Clínica</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageHistory.map((usage) => (
                <TableRow key={usage.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {new Date(usage.used_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(usage.used_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {usage.inventory.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getCategoryColor(usage.inventory.category)}
                    >
                      {usage.inventory.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {usage.quantity_used}
                  </TableCell>
                  <TableCell>
                    {usage.medical_records?.patients?.full_name || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {usage.medical_records?.title || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {usage.notes || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryUsageHistory;
