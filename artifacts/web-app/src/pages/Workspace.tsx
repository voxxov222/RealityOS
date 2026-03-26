import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { ProjectSidebar } from "@/components/workspace/ProjectSidebar";
import { AgentChat } from "@/components/workspace/AgentChat";
import { useGetCurrentAuthUser, useGetProject } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export default function Workspace() {
  const [, setLocation] = useLocation();
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const [match, params] = useRoute("/workspace/:projectId");
  const projectId = match && params?.projectId ? parseInt(params.projectId, 10) : undefined;

  const { data: project } = useGetProject(projectId || 0, {
    query: { enabled: !!projectId }
  });

  useEffect(() => {
    if (!authLoading && !auth?.user) {
      window.location.href = "/api/login";
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
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar />
        <main className="flex-1 relative bg-gradient-to-br from-black to-zinc-900/50">
          <AgentChat 
            projectId={projectId} 
            projectName={project?.name} 
          />
        </main>
      </div>
    </div>
  );
}
