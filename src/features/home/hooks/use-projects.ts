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
      onSuccess: (data) => {
        toast.success(`Project "${data?.id}" created`);
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        router.push(`/project/${data.id}`);
      },

      onError: (error) => {
        toast.error(`Failed to create workflow ${error.message}`);
      },
    })
  );
};
