import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useModerator } from "@/hooks/useModerator";
import { ModeratorLayout } from "@/components/moderator/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Invoice {
  id: string;
  numero_factura_dian: string | null;
  fecha_emision: string;
  total: number;
  estado: string;
  payment_status: string;
  cufe: string | null;
  patients: { full_name: string } | null;
}

export default function ModeratorInvoices() {
  const { logAction } = useModerator();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadInvoices();
    logAction("VIEW", "invoices_list");
  }, []);

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, numero_factura_dian, fecha_emision, total, estado, payment_status, cufe, patients(full_name)')
        .order('fecha_emision', { ascending: false })
        .limit(500);

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(i =>
    (i.numero_factura_dian && i.numero_factura_dian.includes(search)) ||
    (i.patients?.full_name && i.patients.full_name.toLowerCase().includes(search.toLowerCase()))
  );

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'VALIDADA': return 'bg-primary/20 text-primary border-primary';
      case 'EMITIDA': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'RECHAZADA': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'DRAFT': return 'bg-gray-500/20 text-gray-400 border-gray-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <ModeratorLayout title="Facturas" icon={<FileText className="w-6 h-6 text-orange-500" />}>
      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Todas las Facturas</span>
            <Badge variant="outline" className="text-orange-400 border-orange-500">
              {filteredInvoices.length} registros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número o paciente..."
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
                    <TableHead>Número DIAN</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado DIAN</TableHead>
                    <TableHead>Estado Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">
                        {inv.numero_factura_dian || "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(inv.fecha_emision), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>{inv.patients?.full_name || "-"}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(inv.total)}</TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(inv.estado)}>{inv.estado}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{inv.payment_status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No se encontraron facturas
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
