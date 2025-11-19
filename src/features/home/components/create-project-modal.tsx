"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateProjects } from "../hooks/use-projects";

type CreateProjectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateProjectModal({
  open,
  onOpenChange,
}: CreateProjectModalProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createProject = useCreateProjects();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createProject.mutate(
      {
        project_name: title.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          // Reset form and close modal
          setTitle("");
          setDescription("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to get started. You can add skills and
            requirements later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={createProject.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter project description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={createProject.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createProject.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProject.isPending || !title.trim()}
            >
              {createProject.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
