"use client";

import { JobListings } from "./job-listings";
import { useSuspenseProjects } from "../hooks/use-projects";

export function JobListingsClient() {
  const projects = useSuspenseProjects();

  console.log(projects.data);

  if (projects.isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Job Openings</h1>
          <p className="text-muted-foreground">
            Find the perfect opportunity for your team
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (projects.error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Job Openings</h1>
          <p className="text-muted-foreground">
            Find the perfect opportunity for your team
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">
            Error loading jobs: {projects.error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!projects.data || projects.data.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Job Openings</h1>
          <p className="text-muted-foreground">
            Find the perfect opportunity for your team
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No jobs available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return <JobListings jobs={projects.data} />;
}
