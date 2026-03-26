import { useState, useCallback } from "react";

interface RunAgentPayload {
  prompt: string;
  projectId?: number;
  context?: string;
}

export function useAgentStream() {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isDone, setIsDone] = useState(false);

  const runAgent = useCallback(async (payload: RunAgentPayload): Promise<string> => {
    setIsLoading(true);
    setContent("");
    setError(null);
    setIsDone(false);
    setSessionId(null);

    let finalContent = "";

    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to run agent: ${res.statusText}`);
      }
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmedLine.slice(6));

                if (data.sessionId) setSessionId(data.sessionId);
                if (data.content) {
                  finalContent += data.content;
                  setContent((prev) => prev + data.content);
                }
                if (data.error) setError(data.error);
                if (data.done) setIsDone(true);
              } catch (e) {
                console.error("Error parsing SSE chunk:", e);
              }
            }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsDone(true);
    }

    return finalContent;
  }, []);

  const reset = useCallback(() => {
    setContent("");
    setError(null);
    setIsDone(false);
    setSessionId(null);
  }, []);

  return { runAgent, content, isLoading, error, sessionId, isDone, reset };
}
