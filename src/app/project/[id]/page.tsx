import { HydrateClient } from "@/trpc/server";
import { prefetchProject } from "@/features/home/servers/prefetch";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ProjectDetailClient } from "@/features/home/components/project-detail-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = parseInt(id, 10);

  if (isNaN(projectId)) {
    return <div>Invalid project ID</div>;
  }

  prefetchProject(projectId);

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<p>Error loading project</p>}>
        <Suspense fallback={<p>Loading...</p>}>
          <ProjectDetailClient projectId={projectId} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
