import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 text-center space-y-6 max-w-md">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        <div>
          <p className="text-7xl font-display font-bold text-primary/40 mb-2">404</p>
          <h1 className="text-2xl font-display font-bold text-white mb-3">
            Page Not Found
          </h1>
          <p className="text-muted-foreground">
            This page doesn't exist in this dimension. Head back to RealityOS and keep building.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="rounded-full bg-primary text-black font-bold shadow-[0_0_25px_hsl(var(--primary)_/_0.3)] hover:-translate-y-0.5 transition-all">
            <Link href="/">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/5">
            <Link href="/workspace">
              Open Workspace
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
