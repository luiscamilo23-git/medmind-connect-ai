import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useModerator } from "@/hooks/useModerator";
import { ModeratorSidebar } from "@/components/moderator/ModeratorSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2, Shield } from "lucide-react";

interface ModeratorLayoutProps {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
}

export function ModeratorLayout({ children, title, icon }: ModeratorLayoutProps) {
  const navigate = useNavigate();
  const { isModerator, isLoading } = useModerator();

  useEffect(() => {
    if (!isLoading && !isModerator) {
      navigate("/dashboard");
    }
  }, [isModerator, isLoading, navigate]);

  if (isLoading) {
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
              {icon || <Shield className="w-6 h-6 text-orange-500" />}
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
          </header>
          <main className="p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
