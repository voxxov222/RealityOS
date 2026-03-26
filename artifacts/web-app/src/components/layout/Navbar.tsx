import { Link } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, LayoutDashboard, Compass, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { data: authEnvelope, isLoading } = useGetCurrentAuthUser();
  const user = authEnvelope?.user;

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b-white/10 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-wider text-white group-hover:text-primary transition-colors">
            Reality<span className="text-primary">OS</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/community" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-2">
            <Compass className="w-4 h-4" /> Community
          </Link>
          {user && (
            <Link href="/workspace" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Workspace
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-white/10 hover:border-primary transition-colors">
                  <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-panel" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/5">
                <Link href="/workspace" className="w-full flex items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Workspace
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => window.location.href = "/api/logout"}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="rounded-full bg-white text-black hover:bg-gray-200 font-semibold px-6 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-all"
          >
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
}
