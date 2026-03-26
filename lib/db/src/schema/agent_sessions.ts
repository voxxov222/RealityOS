import { pgTable, serial, varchar, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";
import { projectsTable } from "./projects";

export const agentSessionsTable = pgTable("agent_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
  prompt: text("prompt").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAgentSessionSchema = createInsertSchema(agentSessionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AgentSession = typeof agentSessionsTable.$inferSelect;
export type InsertAgentSession = z.infer<typeof insertAgentSessionSchema>;
