import { HydrateClient } from "@/trpc/server";
import { prefetchProject } from "@/features/home/servers/prefetch";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ProjectAIInsightsClient } from "@/features/home/components/project-ai-insights-client";
import { ProjectLoading } from "@/features/home/components/project-loading";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectAIInsightsPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = parseInt(id, 10);

  if (isNaN(projectId)) {
    return <div>Invalid project ID</div>;
  }

  prefetchProject(projectId);

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<p>Error loading AI insights</p>}>
        <Suspense fallback={<ProjectLoading />}>
          <ProjectAIInsightsClient projectId={projectId} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}

