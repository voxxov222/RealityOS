import { Navbar } from "@/components/layout/Navbar";
import { CommunityGrid } from "@/components/community/CommunityGrid";

export default function Community() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <CommunityGrid />
      </main>
    </div>
  );
}
