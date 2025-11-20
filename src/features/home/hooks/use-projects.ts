import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useSuspenseProjects = () => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.projects.getMany.queryOptions());
};

export const useCreateProjects = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const router = useRouter();

  return useMutation(
    trpc.projects.createProject.mutationOptions({
      onSuccess: async (data) => {
        toast.success(`Project "${data?.id}" created`);
        // Invalidate queries first
        await queryClient.invalidateQueries(
          trpc.projects.getMany.queryOptions()
        );
        const projectQueryOptions = trpc.projects.getOne.queryOptions({
          id: data.id,
        });
        await queryClient.invalidateQueries(projectQueryOptions);

        // Remove any cached data for this project to force fresh fetch
        queryClient.removeQueries({ queryKey: projectQueryOptions.queryKey });

        // Prefetch fresh data
        await queryClient.prefetchQuery(projectQueryOptions);

        // Small delay to ensure AI matching has started
        setTimeout(() => {
          router.push(`/project/${data.id}`);
        }, 100);
      },

      onError: (error) => {
        toast.error(`Failed to create workflow ${error.message}`);
      },
    })
  );
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.projects.deleteProject.mutationOptions({
      onSuccess: () => {
        toast.success("Project deleted successfully");
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
      },

      onError: (error) => {
        toast.error(`Failed to delete project: ${error.message}`);
      },
    })
  );
};
