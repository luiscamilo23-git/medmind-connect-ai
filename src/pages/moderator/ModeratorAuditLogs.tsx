import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useModerator } from "@/hooks/useModerator";
import { ModeratorSidebar } from "@/components/moderator/ModeratorSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Shield, Search, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AuditLog {
  id: string;
  moderator_id: string;
  action: string;
  module: string;
  record_id: string | null;
  record_table: string | null;
  details: unknown;
  ip_address: string | null;
  created_at: string;
}

export default function ModeratorAuditLogs() {
  const navigate = useNavigate();
  const { isModerator, isLoading: roleLoading, logAction } = useModerator();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!roleLoading && !isModerator) {
      navigate("/dashboard");
      return;
    }

    if (isModerator) {
      loadLogs();
      logAction("VIEW", "audit_logs");
    }
  }, [isModerator, roleLoading, navigate]);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('moderator_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.module.toLowerCase().includes(search.toLowerCase()) ||
    (log.record_table && log.record_table.toLowerCase().includes(search.toLowerCase()))
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case 'VIEW': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'DELETE': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'UPDATE': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!isModerator) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ModeratorSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-orange-500/20 bg-orange-950/5 px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold">Logs de Auditoría</h1>
            </div>
          </header>

          <main className="p-6 space-y-6">
            <Card className="border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Registro de Acciones</span>
                  <Badge variant="outline" className="text-orange-400 border-orange-500">
                    {filteredLogs.length} registros
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por acción, módulo o tabla..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <div className="rounded-md border border-orange-500/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha/Hora</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Módulo</TableHead>
                        <TableHead>Tabla</TableHead>
                        <TableHead>ID Registro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.created_at), "dd MMM yyyy HH:mm:ss", { locale: es })}
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionColor(log.action)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{log.module}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.record_table || "-"}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {log.record_id ? log.record_id.slice(0, 8) + "..." : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No se encontraron registros
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
