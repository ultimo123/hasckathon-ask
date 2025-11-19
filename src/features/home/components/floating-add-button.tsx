"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "./create-project-modal";

export function FloatingAddButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Create new project</span>
      </Button>
      <CreateProjectModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

