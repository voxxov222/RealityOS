import { useEffect } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignIn() {
  const { data: auth, isLoading } = useGetCurrentAuthUser();

  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  const rawReturnTo = params.get("returnTo") || "/workspace";
  const safeReturnTo = (() => {
    if (
      rawReturnTo.startsWith("//") ||
      rawReturnTo.startsWith("http://") ||
      rawReturnTo.startsWith("https://") ||
      rawReturnTo.startsWith("javascript:") ||
      !rawReturnTo.startsWith("/")
    ) {
      return "/workspace";
    }
    return rawReturnTo;
  })();

  useEffect(() => {
    if (!isLoading && auth?.user) {
      window.location.href = safeReturnTo;
    }
  }, [auth, isLoading, safeReturnTo]);

  const handleSignIn = () => {
    const encodedReturn = encodeURIComponent(safeReturnTo);
    window.location.href = `/api/login?returnTo=${encodedReturn}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel border border-white/10 rounded-3xl p-8 md:p-10 text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Welcome to RealityOS
            </h1>
            <p className="text-muted-foreground">
              Sign in to start building apps, websites, games, and 3D experiences with AI.
            </p>
          </div>

          <Button
            onClick={handleSignIn}
            className="w-full h-12 rounded-full bg-primary text-black font-bold text-base shadow-[0_0_25px_hsl(var(--primary)_/_0.4)] hover:shadow-[0_0_35px_hsl(var(--primary)_/_0.6)] hover:-translate-y-0.5 transition-all duration-300"
          >
            Continue with Replit <ArrowRight className="ml-2 w-4 h-4" />
          </Button>

          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our terms of service and privacy policy.
            New users are automatically signed up.
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          <a href="/" className="hover:text-white transition-colors">
            ← Back to home
          </a>
        </p>
      </div>
    </div>
  );
}
