import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useModerator } from "@/hooks/useModerator";
import { ModeratorLayout } from "@/components/moderator/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Search, Loader2, ShieldCheck, ShieldAlert, ExternalLink, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  full_name: string;
  specialty: string | null;
  city: string | null;
  license_number: string | null;
  rethus_verified: boolean;
  created_at: string;
  roles: string[];
}

export default function ModeratorUsers() {
  const { logAction } = useModerator();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "rethus">("rethus");
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    logAction("VIEW", "users_roles");
  }, []);

  const loadUsers = async () => {
    try {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, specialty, city, license_number, rethus_verified, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        license_number: (profile as any).license_number ?? null,
        rethus_verified: (profile as any).rethus_verified ?? false,
        roles: (roles || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role)
      }));

      setUsers(usersWithRoles);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.roles.some(r => r.toLowerCase().includes(search.toLowerCase()))
  );

  const pendingRethus = users.filter(u =>
    !u.rethus_verified && u.license_number && u.roles.includes("doctor")
  );

  const verifyRethus = async (userId: string, doctorName: string) => {
    setVerifying(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ rethus_verified: true })
      .eq("id", userId);
    if (error) {
      toast.error("Error al verificar RETHUS");
    } else {
      toast.success(`RETHUS de ${doctorName} verificado`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, rethus_verified: true } : u));
      logAction("UPDATE", "rethus_verification", { doctor_id: userId });
    }
    setVerifying(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'moderator': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'doctor': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'patient': return 'bg-primary/20 text-primary border-primary';
      case 'staff': return 'bg-primary/10 text-primary/80 border-primary/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  return (
    <ModeratorLayout title="Usuarios & Roles" icon={<Users className="w-6 h-6 text-orange-500" />}>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          size="sm"
          variant={activeTab === "rethus" ? "default" : "outline"}
          className="gap-2"
          onClick={() => setActiveTab("rethus")}
        >
          <ShieldAlert className="w-4 h-4" />
          Verificar RETHUS
          {pendingRethus.length > 0 && (
            <Badge className="ml-1 bg-red-500 text-white text-xs">{pendingRethus.length}</Badge>
          )}
        </Button>
        <Button
          size="sm"
          variant={activeTab === "all" ? "default" : "outline"}
          className="gap-2"
          onClick={() => setActiveTab("all")}
        >
          <Users className="w-4 h-4" />
          Todos los usuarios
        </Button>
      </div>

      {/* Tab: Verificación RETHUS */}
      {activeTab === "rethus" && (
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-500" />
                <span>Verificación RETHUS Pendiente</span>
              </div>
              <Badge variant="outline" className="text-orange-400 border-orange-500">
                {pendingRethus.length} pendientes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : pendingRethus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
                <p className="font-medium">Todos los médicos están verificados</p>
                <p className="text-sm text-muted-foreground">No hay RETHUS pendientes de revisión</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Verifica cada número RETHUS en{" "}
                  <a
                    href="https://rethus.minsalud.gov.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 inline-flex items-center gap-1"
                  >
                    rethus.minsalud.gov.co <ExternalLink className="w-3 h-3" />
                  </a>
                  {" "}y haz clic en "Verificar" una vez confirmado.
                </p>
                <div className="rounded-md border border-orange-500/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Médico</TableHead>
                        <TableHead>Especialidad</TableHead>
                        <TableHead>RETHUS</TableHead>
                        <TableHead>Días en plataforma</TableHead>
                        <TableHead>Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRethus.map((user) => {
                        const daysOld = Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000);
                        const daysLeft = Math.max(0, 30 - daysOld);
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.full_name}</TableCell>
                            <TableCell className="text-muted-foreground">{user.specialty || "-"}</TableCell>
                            <TableCell>
                              <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                                {user.license_number}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{daysOld} días</span>
                                {daysLeft <= 5 && (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                    {daysLeft}d restantes
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                className="gap-1.5 bg-green-600 hover:bg-green-700"
                                onClick={() => verifyRethus(user.id, user.full_name)}
                                disabled={verifying === user.id}
                              >
                                {verifying === user.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ShieldCheck className="w-3 h-3" />
                                )}
                                Verificar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Todos los usuarios */}
      {activeTab === "all" && (
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Todos los Usuarios</span>
              <Badge variant="outline" className="text-orange-400 border-orange-500">
                {filteredUsers.length} usuarios
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o rol..."
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
                      <TableHead>Especialidad</TableHead>
                      <TableHead>RETHUS</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Registrado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.specialty || "-"}</TableCell>
                        <TableCell>
                          {user.license_number ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs">{user.license_number}</span>
                              {user.rethus_verified ? (
                                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <Badge key={role} className={getRoleColor(role)}>{role}</Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">Sin rol</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(user.created_at), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No se encontraron usuarios
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </ModeratorLayout>
  );
}
