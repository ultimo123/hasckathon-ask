"use client";

import { useState } from "react";
import { JobListings } from "./job-listings";
import { useSuspenseProjects, useDeleteProject } from "../hooks/use-projects";
import { DeleteProjectDialog } from "./delete-project-dialog";

export function JobListingsClient() {
  const projects = useSuspenseProjects();
  const deleteProject = useDeleteProject();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const handleDeleteClick = (id: number, title: string) => {
    setProjectToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      deleteProject.mutate({ id: projectToDelete.id });
      setProjectToDelete(null);
    }
  };

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

  return (
    <>
      <JobListings
        jobs={projects.data}
        onDelete={handleDeleteClick}
      />
      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        projectTitle={projectToDelete?.title}
      />
    </>
  );
}
