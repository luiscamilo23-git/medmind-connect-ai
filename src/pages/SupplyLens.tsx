import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, AlertTriangle, TrendingUp, Plus, ArrowLeft, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import InventoryList from "@/components/InventoryList";
import InventoryDialog from "@/components/InventoryDialog";
import InventoryAlerts from "@/components/InventoryAlerts";
import InventoryAnalytics from "@/components/InventoryAnalytics";
import InventoryUsageDialog from "@/components/InventoryUsageDialog";
import InventoryUsageHistory from "@/components/InventoryUsageHistory";
import AIInventorySuggestions from "@/components/AIInventorySuggestions";

export interface InventoryItem {
  id: string;
  doctor_id: string;
  name: string;
  description: string | null;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit_cost: number | null;
  unit_price: number | null;
  sku: string | null;
  supplier: string | null;
  location: string | null;
  expiration_date: string | null;
  last_restock_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const SupplyLens = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    checkAuth();
    loadInventory();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("inventory-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory",
        },
        () => {
          loadInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("doctor_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      toast.error("Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleRegisterUsage = () => {
    setUsageDialogOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Item eliminado correctamente");
      loadInventory();
    } catch (error) {
      toast.error("Error al eliminar el item");
    }
  };

  const handleDialogClose = (shouldRefresh?: boolean) => {
    setDialogOpen(false);
    setSelectedItem(null);
    if (shouldRefresh) {
      loadInventory();
    }
  };

  const lowStockItems = inventory.filter(
    (item) => item.current_stock <= item.minimum_stock
  );

  const totalValue = inventory.reduce(
    (sum, item) => sum + (item.current_stock * (item.unit_cost || 0)),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Package className="h-8 w-8 text-secondary" />
                <span className="bg-gradient-feature-soft bg-clip-text text-transparent">SupplyLens</span>
              </h1>
              <p className="text-muted-foreground">
                Gestión inteligente de inventario médico
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleRegisterUsage} variant="outline" size="lg">
              <ClipboardList className="h-4 w-4 mr-2" />
              Registrar Uso
            </Button>
            <Button onClick={handleAddItem} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Item
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-muted-foreground">
                En inventario
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas de Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {lowStockItems.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Items con stock bajo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Costo de inventario
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="usage">Uso</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventario Completo</CardTitle>
                <CardDescription>
                  Gestiona todos tus suministros médicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryList
                  items={inventory}
                  loading={loading}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <AIInventorySuggestions onApplied={loadInventory} />
            <InventoryUsageHistory loading={loading} />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <InventoryAlerts items={lowStockItems} loading={loading} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <InventoryAnalytics items={inventory} loading={loading} />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <InventoryDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          item={selectedItem}
        />
        
        <InventoryUsageDialog
          open={usageDialogOpen}
          onOpenChange={setUsageDialogOpen}
          inventoryItems={inventory}
        />
      </div>
    </div>
  );
};

export default SupplyLens;
