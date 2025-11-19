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
        <Suspense fallback={<p>Loading...</p>}>
          <JobListingsClient />
        </Suspense>
      </ErrorBoundary>
      <FloatingAddButton />
    </HydrateClient>
  );
}
