import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";
import { InventoryItem } from "@/pages/SupplyLens";

interface InventoryAlertsProps {
  items: InventoryItem[];
  loading: boolean;
}

const InventoryAlerts = ({ items, loading }: InventoryAlertsProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas de Stock Bajo</CardTitle>
          <CardDescription>
            Items que necesitan reabastecimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">¡Todo en orden! No hay alertas de stock.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isOutOfStock = item.current_stock === 0;
        const percentageRemaining = (item.current_stock / item.minimum_stock) * 100;

        return (
          <Card key={item.id} className="border-l-4 border-l-destructive">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="destructive">
                  {isOutOfStock ? "Sin Stock" : "Stock Bajo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Actual</p>
                  <p className="text-2xl font-bold text-destructive">
                    {item.current_stock}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock Mínimo</p>
                  <p className="text-2xl font-bold">{item.minimum_stock}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categoría</p>
                  <Badge variant="outline" className="mt-1">
                    {item.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ubicación</p>
                  <p className="text-lg font-semibold">{item.location || "-"}</p>
                </div>
              </div>

              {item.supplier && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Proveedor sugerido</p>
                  <p className="font-medium">{item.supplier}</p>
                </div>
              )}

              {!isOutOfStock && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Nivel de stock</span>
                    <span className="font-medium">
                      {percentageRemaining.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-destructive h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(percentageRemaining, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default InventoryAlerts;
