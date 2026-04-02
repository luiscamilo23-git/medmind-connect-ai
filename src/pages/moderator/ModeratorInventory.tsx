import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useModerator } from "@/hooks/useModerator";
import { ModeratorLayout } from "@/components/moderator/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Loader2, AlertTriangle } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit_cost: number | null;
  supplier: string | null;
  location: string | null;
}

export default function ModeratorInventory() {
  const { logAction } = useModerator();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadInventory();
    logAction("VIEW", "inventory");
  }, []);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, category, current_stock, minimum_stock, unit_cost, supplier, location')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase()) ||
    (i.supplier && i.supplier.toLowerCase().includes(search.toLowerCase()))
  );

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'medication': return 'Medicamento';
      case 'surgical': return 'Quirúrgico';
      case 'diagnostic': return 'Diagnóstico';
      case 'disposable': return 'Desechable';
      case 'equipment': return 'Equipo';
      default: return 'Otro';
    }
  };

  return (
    <ModeratorLayout title="SupplyLens" icon={<Package className="w-6 h-6 text-orange-500" />}>
      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Inventario Global</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-red-400 border-red-500">
                {items.filter(i => i.current_stock <= i.minimum_stock).length} alertas
              </Badge>
              <Badge variant="outline" className="text-orange-400 border-orange-500">
                {filteredItems.length} items
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, categoría o proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="rounded-md border border-orange-500/20">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Costo Unit.</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Ubicación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className={item.current_stock <= item.minimum_stock ? "bg-red-500/5" : ""}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {item.current_stock <= item.minimum_stock && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getCategoryLabel(item.category)}</Badge>
                      </TableCell>
                      <TableCell className={item.current_stock <= item.minimum_stock ? "text-red-500 font-medium" : ""}>
                        {item.current_stock}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.minimum_stock}</TableCell>
                      <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                      <TableCell className="text-muted-foreground">{item.supplier || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{item.location || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No se encontraron items
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </ModeratorLayout>
  );
}
