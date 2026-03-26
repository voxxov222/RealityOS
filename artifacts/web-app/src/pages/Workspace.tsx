import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { ProjectSidebar } from "@/components/workspace/ProjectSidebar";
import { AgentChat } from "@/components/workspace/AgentChat";
import { useGetCurrentAuthUser, useListProjects } from "@workspace/api-client-react";
import { Loader2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Workspace() {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const [match, params] = useRoute("/workspace/:projectId");
  const projectId = match && params?.projectId ? parseInt(params.projectId, 10) : undefined;

  const { data: projects } = useListProjects();
  const project = projectId != null ? projects?.find((p) => p.id === projectId) : undefined;

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !auth?.user) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/api/login?returnTo=${returnTo}`;
    }
  }, [auth, authLoading]);

  if (authLoading || !auth?.user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <Navbar
        mobileMenuSlot={
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-white">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 glass-panel border-white/10">
              <ProjectSidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        }
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex">
          <ProjectSidebar />
        </div>
        <main className="flex-1 relative bg-gradient-to-br from-black to-zinc-900/50 min-w-0">
          <AgentChat
            projectId={projectId}
            projectName={project?.name}
          />
        </main>
      </div>
    </div>
  );
}
