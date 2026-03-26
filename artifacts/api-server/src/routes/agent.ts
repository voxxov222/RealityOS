import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, agentSessionsTable, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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

  const { prompt, projectId, context } = parsed.data;

  if (projectId != null) {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, req.user.id)));
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
  }

  const [agentSession] = await db
    .insert(agentSessionsTable)
    .values({
      userId: req.user.id,
      projectId: projectId ?? null,
      prompt,
      status: "running",
    })
    .returning();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.write(`data: ${JSON.stringify({ sessionId: agentSession.id })}\n\n`);

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

  let fullContent = "";

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
        fullContent += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await db
      .update(agentSessionsTable)
      .set({ status: "completed", result: { content: fullContent }, updatedAt: new Date() })
      .where(eq(agentSessionsTable.id, agentSession.id));

    res.write(`data: ${JSON.stringify({ done: true, sessionId: agentSession.id })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Agent run error");

    await db
      .update(agentSessionsTable)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
        updatedAt: new Date(),
      })
      .where(eq(agentSessionsTable.id, agentSession.id));

    res.write(`data: ${JSON.stringify({ error: "Agent failed to respond" })}\n\n`);
    res.end();
  }
});

export default router;
