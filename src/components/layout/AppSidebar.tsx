import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Clock,
  BarChart3,
  Search,
  User,
  Settings,
  LogOut,
  Pen,
  ShieldCheck,
  Handshake,
  FileSearch,
  Cloud,
  BookOpen,
  Cpu,
  Radar,
  MessageSquare,
  ScrollText,
  Cog,
  Activity,
} from "lucide-react";
import virtualexisLogo from "@/assets/virtualexis-logo.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessControl } from "@/hooks/useAccessControl";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Triagem", url: "/intake", icon: FileSearch },
  { title: "Casos", url: "/cases", icon: Briefcase },
  { title: "Documentos", url: "/documents", icon: FileText },
  { title: "Timeline", url: "/timeline", icon: Clock },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Busca", url: "/search", icon: Search },
];

const settingsItems = [
  { title: "Parceiros", url: "/partners", icon: Handshake },
  { title: "Estilo de Redação", url: "/writing-style", icon: Pen },
  { title: "Armazenamento Externo", url: "/settings/storage", icon: Cloud },
  { title: "Manual", url: "/manual", icon: BookOpen },
  { title: "Perfil", url: "/profile", icon: User },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const { isSuperAdmin } = useAccessControl();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-5">
          <img src={virtualexisLogo} alt="VirtuaLexis" className="h-8 w-8 shrink-0 object-contain" />
          {!collapsed && (
            <span className="font-display text-lg font-bold text-sidebar-foreground tracking-tight">
              VirtuaLexis
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Conta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  { title: "Painel Admin", url: "/root-admin", icon: ShieldCheck },
                  { title: "Monitoramento", url: "/admin", icon: Activity },
                  { title: "Status das IAs", url: "/admin/ai/status", icon: Cpu },
                  { title: "Radar de IA", url: "/admin/radar", icon: Radar },
                  { title: "Prompts", url: "/admin/prompts", icon: MessageSquare },
                  { title: "Logs de Execução", url: "/admin/ai/logs", icon: ScrollText },
                  { title: "Configurações de IA", url: "/admin/ai/settings", icon: Cog },
                ].map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
