import { HydrateClient } from "@/trpc/server";
import { prefetchProjects } from "@/features/home/servers/prefetch";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { JobListingsClient } from "@/features/home/components/job-listings-client";
import { FloatingAddButton } from "@/features/home/components/floating-add-button";

export default async function Home() {
  prefetchProjects();

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<p>Error loading jobs</p>}>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            </div>
          }
        >
          <JobListingsClient />
        </Suspense>
      </ErrorBoundary>
      <FloatingAddButton />
    </HydrateClient>
  );
}
