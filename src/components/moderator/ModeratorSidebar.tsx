import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Receipt, 
  DollarSign,
  Package,
  Mic,
  Brain,
  Globe,
  BarChart3,
  TrendingUp,
  Activity,
  MessageSquare,
  Star,
  Settings,
  Shield,
  ClipboardList
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";

const mainItems = [
  { title: "Dashboard Global", url: "/moderator", icon: LayoutDashboard },
];

const clinicalItems = [
  { title: "Pacientes", url: "/moderator/patients", icon: Users },
  { title: "Historias Clínicas", url: "/moderator/records", icon: FileText },
  { title: "Citas", url: "/moderator/appointments", icon: Calendar },
  { title: "VoiceNotes", url: "/moderator/voice-notes", icon: Mic },
  { title: "Notas Inteligentes", url: "/moderator/notes", icon: Brain },
];

const operationalItems = [
  { title: "SupplyLens", url: "/moderator/inventory", icon: Package },
  { title: "SmartScheduler", url: "/moderator/scheduler", icon: Calendar },
];

const analyticsItems = [
  { title: "Analytics", url: "/moderator/analytics", icon: BarChart3 },
  { title: "Análisis Predictivo", url: "/moderator/predictive", icon: TrendingUp },
  { title: "Inteligencia Operativa", url: "/moderator/intelligence", icon: Activity },
];

const billingItems = [
  { title: "Servicios", url: "/moderator/billing/services", icon: Receipt },
  { title: "Facturas", url: "/moderator/billing/invoices", icon: FileText },
  { title: "RIPS", url: "/moderator/billing/rips", icon: ClipboardList },
  { title: "Pagos", url: "/moderator/billing/payments", icon: DollarSign },
  { title: "Monitoreo DIAN", url: "/moderator/billing/dian", icon: Shield },
];

const communityItems = [
  { title: "Red Social", url: "/moderator/social", icon: Globe },
  { title: "Chats", url: "/moderator/chats", icon: MessageSquare },
  { title: "Reseñas", url: "/moderator/reviews", icon: Star },
];

const systemItems = [
  { title: "Usuarios & Roles", url: "/moderator/users", icon: Users },
  { title: "Configuración", url: "/moderator/settings", icon: Settings },
  { title: "Logs de Auditoría", url: "/moderator/audit-logs", icon: ClipboardList },
];

export function ModeratorSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-orange-500/20 bg-orange-950/5">
      <SidebarContent>
        {/* Header with Moderator Badge */}
        <div className="p-4 border-b border-orange-500/20">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-orange-500" />
            {!isCollapsed && (
              <div>
                <span className="font-bold text-orange-500">MODERATOR</span>
                <Badge variant="outline" className="ml-2 text-xs border-orange-500 text-orange-500">
                  MODO ADMIN
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Warning Banner */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 p-2 bg-orange-500/10 border border-orange-500/30 rounded-md">
            <p className="text-xs text-orange-400">
              ⚠️ Acciones auditadas. Información sensible.
            </p>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-orange-400">Principal</SidebarGroupLabel>
          <SidebarMenu>
            {mainItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <NavLink to={item.url} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-orange-400">Clínico</SidebarGroupLabel>
          <SidebarMenu>
            {clinicalItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <NavLink to={item.url} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-orange-400">Operativo</SidebarGroupLabel>
          <SidebarMenu>
            {operationalItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <NavLink to={item.url} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-orange-400">Analytics</SidebarGroupLabel>
          <SidebarMenu>
            {analyticsItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <NavLink to={item.url} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-orange-400">Facturación</SidebarGroupLabel>
          <SidebarMenu>
            {billingItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <NavLink to={item.url} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-orange-400">Comunidad</SidebarGroupLabel>
          <SidebarMenu>
            {communityItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <NavLink to={item.url} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-orange-400">Sistema</SidebarGroupLabel>
          <SidebarMenu>
            {systemItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <NavLink to={item.url} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
