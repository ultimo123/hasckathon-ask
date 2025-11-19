import { prefetch, trpc } from "@/trpc/server";

// Prefetch all projects
export const prefetchProjects = () => {
  return prefetch(trpc.projects.getMany.queryOptions());
};

// Prefetch a single project
export const prefetchProject = (id: number) => {
  return prefetch(trpc.projects.getOne.queryOptions({ id }));
};

// Prefetch qualified users for a project
export const prefetchQualifiedUsers = (projectId: number) => {
  return prefetch(trpc.projects.getQualifiedUsers.queryOptions({ projectId }));
};
