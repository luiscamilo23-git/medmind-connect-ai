import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useModerator } from "@/hooks/useModerator";
import { ModeratorLayout } from "@/components/moderator/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  date_of_birth: string | null;
  blood_type: string | null;
  created_at: string;
}

export default function ModeratorPatients() {
  const { logAction } = useModerator();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPatients();
    logAction("VIEW", "patients_list");
  }, []);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, email, phone, date_of_birth, blood_type, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <ModeratorLayout title="Pacientes" icon={<Users className="w-6 h-6 text-orange-500" />}>
      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Todos los Pacientes</span>
            <Badge variant="outline" className="text-orange-400 border-orange-500">
              {filteredPatients.length} registros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o email..."
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
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Fecha Nacimiento</TableHead>
                    <TableHead>Tipo Sangre</TableHead>
                    <TableHead>Registrado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.full_name}</TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{patient.email || "-"}</TableCell>
                      <TableCell>
                        {patient.date_of_birth
                          ? format(new Date(patient.date_of_birth), "dd/MM/yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {patient.blood_type ? (
                          <Badge variant="outline">{patient.blood_type}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(patient.created_at), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPatients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No se encontraron pacientes
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
