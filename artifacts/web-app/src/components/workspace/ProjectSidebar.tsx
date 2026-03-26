import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Folder, MoreVertical, Pencil, Trash2, Box, Globe, Gamepad2, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ProjectSidebarProps {
  onNavigate?: () => void;
}

export function ProjectSidebar({ onNavigate }: ProjectSidebarProps) {
  const [location] = useLocation();
  const { data: projects, isLoading, refetch } = useListProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    try {
      await createProject.mutateAsync({ data: { name: newProjectName, type: "app" } });
      toast({ title: "Project created" });
      setNewProjectName("");
      setIsCreateOpen(false);
      refetch();
    } catch (e) {
      toast({ title: "Failed to create project", variant: "destructive" });
    }
  };

  const handleRename = async (id: number, originalName: string) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === originalName) {
      setEditingId(null);
      return;
    }
    try {
      await updateProject.mutateAsync({ id, data: { name: trimmed } });
      toast({ title: "Project renamed" });
      setEditingId(null);
      refetch();
    } catch (e) {
      toast({ title: "Failed to rename project", variant: "destructive" });
      setEditingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject.mutateAsync({ id });
      toast({ title: "Project deleted" });
      refetch();
    } catch (e) {
      toast({ title: "Failed to delete project", variant: "destructive" });
    }
  };

  const getProjectIcon = (type: string) => {
    switch (type) {
      case "website": return <Globe className="w-4 h-4 text-primary" />;
      case "game": return <Gamepad2 className="w-4 h-4 text-secondary" />;
      case "3d": return <Box className="w-4 h-4 text-accent" />;
      default: return <Layers className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="w-64 h-[calc(100vh-65px)] flex-shrink-0 glass-panel border-r border-white/10 flex flex-col">
      <div className="p-4 border-b border-white/5">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary glow-border border border-primary/30 transition-all">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Give your new creation a name.
              </DialogDescription>
            </DialogHeader>
            <Input 
              value={newProjectName} 
              onChange={(e) => setNewProjectName(e.target.value)} 
              placeholder="e.g. Neon Racing Game" 
              className="bg-black/50 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary"
            />
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createProject.isPending} className="bg-primary text-black hover:bg-primary/90">
                {createProject.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Your Projects
        </div>
        
        {isLoading ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">Loading...</div>
        ) : projects?.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center flex flex-col items-center gap-2 opacity-50">
            <Folder className="w-8 h-8 mb-1" />
            No projects yet
          </div>
        ) : (
          projects?.map((project) => {
            const isActive = location === `/workspace/${project.id}`;
            return (
              <div key={project.id} className="group relative flex items-center">
                {editingId === project.id ? (
                  <div className="flex w-full items-center gap-2 px-2 py-1">
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 bg-black/50 border-white/20 text-white text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(project.id, project.name);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => handleRename(project.id, project.name)}
                    />
                  </div>
                ) : (
                  <Link href={`/workspace/${project.id}`} onClick={() => onNavigate?.()} className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isActive ? 'bg-primary/15 text-white font-medium shadow-[inset_2px_0_0_0_hsl(var(--primary))]' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}>
                    {getProjectIcon(project.type)}
                    <span className="truncate">{project.name}</span>
                  </Link>
                )}

                {editingId !== project.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute right-1 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="glass-panel border-white/10 min-w-[120px]">
                      <DropdownMenuItem className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer" onClick={() => {
                        setEditName(project.name);
                        setEditingId(project.id);
                      }}>
                        <Pencil className="w-4 h-4 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive cursor-pointer" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
