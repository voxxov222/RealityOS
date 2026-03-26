import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityPostsTable, projectsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const createPostSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.number().int().optional(),
  thumbnailUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

router.get("/community", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;
  const tag = req.query.tag as string | undefined;

  const query = db
    .select()
    .from(communityPostsTable)
    .orderBy(desc(communityPostsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const posts = tag
    ? await query.where(sql`${communityPostsTable.tags} @> ARRAY[${tag}]::text[]`)
    : await query;

  res.json(posts);
});

router.post("/community", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const user = req.user;

  if (parsed.data.projectId != null) {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, parsed.data.projectId), eq(projectsTable.userId, user.id)));
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
  }

  const authorName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Anonymous";

  const [post] = await db
    .insert(communityPostsTable)
    .values({
      ...parsed.data,
      userId: user.id,
      authorName,
      authorImageUrl: user.profileImageUrl ?? null,
    })
    .returning();
  res.status(201).json(post);
});

router.get("/community/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [post] = await db
    .select()
    .from(communityPostsTable)
    .where(eq(communityPostsTable.id, id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(post);
});

export default router;
