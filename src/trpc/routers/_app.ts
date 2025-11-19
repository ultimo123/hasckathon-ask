import { projectsRouter } from "@/features/home/servers/routers";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;
