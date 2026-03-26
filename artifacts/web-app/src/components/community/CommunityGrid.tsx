import { useState } from "react";
import { useListCommunityPosts } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Loader2, Compass, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const TAGS = ["All", "App", "Website", "Game", "3D"];

export function CommunityGrid() {
  const [selectedTag, setSelectedTag] = useState("All");
  
  const { data: posts, isLoading } = useListCommunityPosts({
    tag: selectedTag === "All" ? undefined : selectedTag.toLowerCase(),
    limit: 50
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 glow-text">
          Community Gallery
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore incredible applications, games, and 3D scenes created by the RealityOS community using plain text descriptions.
        </p>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={cn(
                "px-6 py-2 rounded-full font-medium transition-all duration-300",
                selectedTag === tag 
                  ? "bg-primary text-black shadow-[0_0_15px_hsl(var(--primary)_/_0.5)]" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : posts?.length === 0 ? (
        <div className="text-center py-32 glass-panel rounded-3xl max-w-2xl mx-auto border-white/5">
          <Compass className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-2xl font-bold text-white mb-2">No creations found</h3>
          <p className="text-muted-foreground">Be the first to publish a {selectedTag !== "All" ? selectedTag : "project"} to the gallery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts?.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Card className="glass-panel border-white/10 overflow-hidden h-full flex flex-col group hover:border-primary/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,240,255,0.15)] cursor-pointer">
                {/* Thumbnail Area */}
                <div className="relative aspect-video bg-black/50 overflow-hidden">
                  {post.thumbnailUrl ? (
                    <img 
                      src={post.thumbnailUrl} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-white/30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {post.tags?.slice(0, 2).map((t) => (
                      <Badge key={t} className="bg-black/60 backdrop-blur-md text-white border-white/10 font-medium capitalize">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Content Area */}
                <CardContent className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                    {post.description || "A RealityOS creation."}
                  </p>
                </CardContent>

                {/* Footer / Author */}
                <CardFooter className="px-5 py-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-7 h-7 border border-white/10">
                      <AvatarImage src={post.authorImageUrl || undefined} />
                      <AvatarFallback className="bg-primary/20 text-xs text-primary">
                        {post.authorName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-white/80 truncate max-w-[100px]">
                      {post.authorName || "Anonymous"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Heart className="w-4 h-4 hover:text-pink-500 transition-colors" />
                    <span className="text-xs font-medium">{post.likes}</span>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
