import { 
  Brain, 
  Calendar, 
  LineChart, 
  Package, 
  Users,
  TrendingUp,
  Share2,
  BrainCircuit,
  Home,
  UserCircle,
  FileText,
  Receipt,
  Send,
  BarChart3,
  Settings,
  Bot
} from "lucide-react";
import { NavLink } from "@/components/NavLink";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Pacientes", url: "/patients", icon: Users },
];

const modulesItems = [
  { title: "Mi Agente IA", url: "/my-agent", icon: Bot },
  { title: "VoiceNotes MD", url: "/voicenotes", icon: Brain },
  { title: "Notas Inteligentes", url: "/smart-notes", icon: BrainCircuit },
  { title: "SupplyLens", url: "/supplylens", icon: Package },
  { title: "SmartScheduler", url: "/scheduler", icon: Calendar },
];

const analyticsItems = [
  { title: "Análisis Predictivo", url: "/predictive", icon: TrendingUp },
  { title: "Inteligencia Operativa", url: "/analytics", icon: LineChart },
];

const billingItems = [
  { title: "Servicios", url: "/billing/services", icon: Receipt },
  { title: "Facturas", url: "/billing/invoices", icon: FileText },
  { title: "RIPS", url: "/billing/rips", icon: FileText },
  { title: "Pagos", url: "/billing/payments", icon: Receipt },
  { title: "Emisión DIAN", url: "/billing/dian", icon: Send },
  { title: "Monitoreo DIAN", url: "/billing/monitoring", icon: BarChart3 },
  { title: "Configuración", url: "/billing/settings", icon: Settings },
];

const socialItems = [
  { title: "Red Social Médica", url: "/social", icon: Share2 },
  { title: "Programa de Referidos", url: "/referrals", icon: UserCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-xs tracking-wider">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Módulos de Consulta */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-xs tracking-wider">Módulos de Consulta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modulesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-xs tracking-wider">Análisis</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Facturación */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-xs tracking-wider">Facturación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {billingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Social */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-xs tracking-wider">Comunidad</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {socialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
