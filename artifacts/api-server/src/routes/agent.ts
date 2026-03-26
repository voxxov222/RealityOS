import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod";

const router: IRouter = Router();

const runAgentSchema = z.object({
  prompt: z.string().min(1),
  projectId: z.number().int().optional(),
  context: z.string().optional(),
});

const SYSTEM_PROMPT = `You are RealityOS, a powerful AI creative studio agent. You help users build apps, websites, games, 3D scenes, and more — simply from their descriptions.

When given a prompt, you:
1. Understand what the user wants to create
2. Break it down into clear steps
3. Generate the appropriate code, structure, or guidance
4. Explain your work clearly

You are creative, technical, and encouraging. You can build full-stack web apps, games, 3D experiences, landing pages, mobile apps, and more. Always produce working, production-ready output.

Respond with clear markdown formatting including code blocks where appropriate.`;

router.post("/agent/run", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = runAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { prompt, context } = parsed.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const messages: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (context) {
    messages.push({
      role: "user",
      content: `Project context:\n${context}\n\nUser request:\n${prompt}`,
    });
  } else {
    messages.push({ role: "user", content: prompt });
  }

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Agent run error");
    res.write(`data: ${JSON.stringify({ error: "Agent failed to respond" })}\n\n`);
    res.end();
  }
});

export default router;
