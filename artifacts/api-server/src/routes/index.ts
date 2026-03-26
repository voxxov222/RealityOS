import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import projectsRouter from "./projects";
import communityRouter from "./community";
import agentRouter from "./agent";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(projectsRouter);
router.use(communityRouter);
router.use(agentRouter);
router.use(openaiRouter);

export default router;
