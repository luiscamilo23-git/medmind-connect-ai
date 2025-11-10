import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Package } from "lucide-react";
import { InventoryItem } from "@/pages/SupplyLens";

interface InventoryListProps {
  items: InventoryItem[];
  loading: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

const InventoryList = ({ items, loading, onEdit, onDelete }: InventoryListProps) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      medication: "bg-blue-500/10 text-blue-500",
      equipment: "bg-purple-500/10 text-purple-500",
      surgical: "bg-red-500/10 text-red-500",
      diagnostic: "bg-cyan-500/10 text-cyan-500",
      disposable: "bg-green-500/10 text-green-500",
      other: "bg-gray-500/10 text-gray-500",
    };
    return colors[category] || colors.other;
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock === 0) {
      return { label: "Sin Stock", color: "bg-destructive/10 text-destructive" };
    } else if (item.current_stock <= item.minimum_stock) {
      return { label: "Stock Bajo", color: "bg-yellow-500/10 text-yellow-500" };
    }
    return { label: "Stock OK", color: "bg-green-500/10 text-green-500" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay items en el inventario</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Stock Actual</TableHead>
            <TableHead>Stock Mínimo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Costo Unitario</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const stockStatus = getStockStatus(item);
            const totalValue = item.current_stock * (item.unit_cost || 0);
            
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getCategoryColor(item.category)}>
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold">{item.current_stock}</TableCell>
                <TableCell>{item.minimum_stock}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={stockStatus.color}>
                    {stockStatus.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.unit_cost 
                    ? `$${item.unit_cost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                    : "-"
                  }
                </TableCell>
                <TableCell className="font-semibold">
                  ${totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>{item.location || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente
                            "{item.name}" del inventario.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(item.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default InventoryList;
