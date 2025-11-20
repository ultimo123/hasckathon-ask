"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Users, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

type JobListing = {
  id: number;
  title: string;
  description: string;
  developersNeeded: number;
  experienceYears: number;
  skills: string[];
  categories: string[];
};

type JobListingsProps = {
  jobs: JobListing[];
  onDelete?: (id: number, title: string) => void;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
    },
  },
} as const;

export function JobListings({ jobs, onDelete }: JobListingsProps) {
  const handleDelete = (e: React.MouseEvent, id: number, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(id, title);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-12 px-4">
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Project Opportunities
            </h1>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover exciting projects and find the perfect team members for
            your next venture
          </p>
        </motion.div>

        {/* Animated Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <Link
                href={`/project/${job.id}`}
                className="block h-full"
              >
                <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-2xl overflow-hidden relative">
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Animated Border Glow */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />

                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300">
                          {job.title}
                        </CardTitle>
                        {job.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {job.categories.map((category, idx) => (
                              <motion.div
                                key={category}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 + idx * 0.05 }}
                              >
                                <Badge
                                  variant="outline"
                                  className="border-primary/30 text-primary/80 hover:bg-primary/10 transition-colors"
                                >
                                  {category}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 relative z-10">
                    <CardDescription className="text-sm leading-relaxed line-clamp-3">
                      {job.description}
                    </CardDescription>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <motion.div
                        className="flex items-center gap-2 text-muted-foreground"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {job.developersNeeded}
                        </span>
                        <span className="text-xs">developers</span>
                      </motion.div>
                      <motion.div
                        className="flex items-center gap-2 text-muted-foreground"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {job.experienceYears}+
                        </span>
                        <span className="text-xs">years</span>
                      </motion.div>
                    </div>

                    {job.skills.length > 0 && (
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                          Required Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 4).map((skill, idx) => (
                            <motion.div
                              key={skill}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 + idx * 0.03 }}
                              whileHover={{ scale: 1.1 }}
                            >
                              <Badge
                                variant="secondary"
                                className="text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                              >
                                {skill}
                              </Badge>
                            </motion.div>
                          ))}
                          {job.skills.length > 4 && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              +{job.skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>

              {onDelete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-3 right-3 z-20"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background/95 backdrop-blur-sm hover:bg-destructive hover:text-white shadow-lg border border-border/50 transition-all duration-200"
                    onClick={(e) => handleDelete(e, job.id, job.title)}
                    title="Delete project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
