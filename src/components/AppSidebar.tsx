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
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: Home,
    color: "text-primary"
  },
  { 
    title: "Pacientes", 
    url: "/patients", 
    icon: Users,
    color: "text-secondary"
  },
];

const modulesItems = [
  { 
    title: "Mi Agente IA", 
    url: "/my-agent", 
    icon: Bot,
    color: "text-purple"
  },
  { 
    title: "VoiceNotes MD", 
    url: "/voicenotes", 
    icon: Brain,
    color: "text-primary"
  },
  { 
    title: "Notas Inteligentes", 
    url: "/smart-notes", 
    icon: BrainCircuit,
    color: "text-purple"
  },
  { 
    title: "SupplyLens", 
    url: "/supplylens", 
    icon: Package,
    color: "text-secondary"
  },
  { 
    title: "SmartScheduler", 
    url: "/scheduler", 
    icon: Calendar,
    color: "text-primary"
  },
];

const analyticsItems = [
  { 
    title: "Análisis Predictivo", 
    url: "/predictive", 
    icon: TrendingUp,
    color: "text-purple"
  },
  { 
    title: "Inteligencia Operativa", 
    url: "/analytics", 
    icon: LineChart,
    color: "text-secondary"
  },
];

const billingItems = [
  { 
    title: "Servicios", 
    url: "/billing/services", 
    icon: Receipt,
    color: "text-secondary"
  },
  { 
    title: "Facturas", 
    url: "/billing/invoices", 
    icon: FileText,
    color: "text-primary"
  },
  { 
    title: "RIPS", 
    url: "/billing/rips", 
    icon: FileText,
    color: "text-purple"
  },
  { 
    title: "Pagos", 
    url: "/billing/payments", 
    icon: Receipt,
    color: "text-secondary"
  },
  { 
    title: "Emisión DIAN", 
    url: "/billing/dian", 
    icon: Send,
    color: "text-primary"
  },
  { 
    title: "Monitoreo DIAN", 
    url: "/billing/monitoring", 
    icon: BarChart3,
    color: "text-purple"
  },
  { 
    title: "Configuración", 
    url: "/billing/settings", 
    icon: Settings,
    color: "text-muted-foreground"
  },
];

const socialItems = [
  { 
    title: "Red Social Médica", 
    url: "/social", 
    icon: Share2,
    color: "text-purple"
  },
  { 
    title: "Programa de Referidos", 
    url: "/referrals", 
    icon: UserCircle,
    color: "text-secondary"
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-2 hover:bg-accent hover-heartbeat-underline"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className={`h-4 w-4 ${item.color}`} />
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
          <SidebarGroupLabel className="text-purple">Módulos de Consulta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modulesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-2 hover:bg-accent hover-heartbeat-underline-purple"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className={`h-4 w-4 ${item.color}`} />
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
          <SidebarGroupLabel className="text-purple">Análisis</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-2 hover:bg-accent hover-heartbeat-underline-teal"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className={`h-4 w-4 ${item.color}`} />
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
          <SidebarGroupLabel className="text-secondary">Facturación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {billingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-2 hover:bg-accent hover-heartbeat-underline-teal"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className={`h-4 w-4 ${item.color}`} />
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
          <SidebarGroupLabel className="text-purple">Comunidad</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {socialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-2 hover:bg-accent hover-heartbeat-underline-purple"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className={`h-4 w-4 ${item.color}`} />
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
