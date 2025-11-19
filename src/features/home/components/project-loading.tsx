"use client";

import { Loader2 } from "lucide-react";

export function ProjectLoading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="absolute inset-0 h-16 w-16 border-4 border-primary/20 rounded-full"></div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Finding the Perfect Team</h2>
          <p className="text-muted-foreground">
            Our AI is analyzing candidates and matching them to your project...
          </p>
        </div>
        <div className="flex space-x-2 mt-8">
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}

