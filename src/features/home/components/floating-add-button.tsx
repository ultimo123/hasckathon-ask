"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "./create-project-modal";
import { motion } from "framer-motion";

export function FloatingAddButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.3,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-16 w-16 rounded-full shadow-2xl hover:shadow-primary/50 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 relative overflow-hidden group"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
            }}
          />
          <Plus className="h-7 w-7 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
          <span className="sr-only">Create new project</span>
        </Button>
      </motion.div>
      <CreateProjectModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
