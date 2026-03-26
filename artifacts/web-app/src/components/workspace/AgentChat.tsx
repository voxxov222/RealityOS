import { useState, useRef, useEffect } from "react";
import { useAgentStream } from "@/hooks/use-agent-stream";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Sparkles, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface AgentChatProps {
  projectId?: number;
  projectName?: string;
}

interface Message {
  role: "user" | "agent";
  content: string;
}

export function AgentChat({ projectId, projectName }: AgentChatProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { runAgent, content: streamedContent, isLoading, error } = useAgentStream();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;
    
    const userMessage = prompt;
    setPrompt("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    
    await runAgent({ 
      prompt: userMessage, 
      projectId,
      context: projectName ? `Currently working on project: ${projectName}` : undefined
    });
    
    // Once done streaming, the hook keeps content in state, we need to manually push to history 
    // when stream finishes, but since the hook is simple, we can rely on a local effect.
  };

  // Effect to push streamed content to history when done
  // A bit tricky with simple hooks, so we'll just render streamedContent dynamically for the current agent message
  
  return (
    <div className="flex flex-col h-[calc(100vh-65px)] w-full relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {projectName ? `Building: ${projectName}` : "RealityOS Agent"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Describe your vision. The agent will write the code.</p>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 scroll-smooth"
      >
        {messages.length === 0 && !isLoading && !streamedContent && (
          <div className="h-full flex flex-col items-center justify-center opacity-50 mt-10">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 glow-border">
              <Bot className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold text-white mb-2">Ready to Build</h3>
            <p className="text-muted-foreground max-w-md text-center">
              Enter a detailed prompt below to generate an app, website, 3D scene, or game. 
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-4 max-w-4xl", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1", 
              msg.role === "user" ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"
            )}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div className={cn("px-5 py-4 rounded-2xl", 
              msg.role === "user" 
                ? "bg-secondary/10 border border-secondary/20 text-white" 
                : "glass-panel border-white/10 prose prose-invert max-w-none"
            )}>
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {/* Currently streaming message */}
        {(isLoading || streamedContent) && (
          <div className="flex gap-4 max-w-4xl">
             <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-1 glow-border">
              {isLoading && !streamedContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div className="px-5 py-4 rounded-2xl glass-panel border-primary/20 prose prose-invert max-w-none min-w-[200px]">
              {streamedContent ? (
                <ReactMarkdown>{streamedContent}</ReactMarkdown>
              ) : (
                <div className="flex gap-1 items-center h-6">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm max-w-4xl">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-background via-background/90 to-transparent pt-12">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex bg-card rounded-xl border border-white/10 overflow-hidden shadow-2xl">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Describe the application you want to create..."
              className="min-h-[60px] max-h-[200px] border-0 focus-visible:ring-0 resize-none bg-transparent text-white p-4 text-base"
              disabled={isLoading}
            />
            <div className="p-2 flex items-end">
              <Button 
                size="icon" 
                onClick={handleSubmit} 
                disabled={!prompt.trim() || isLoading}
                className="w-10 h-10 rounded-lg bg-primary hover:bg-primary/80 text-black shadow-[0_0_15px_hsl(var(--primary)_/_0.4)] disabled:opacity-50 disabled:shadow-none transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
