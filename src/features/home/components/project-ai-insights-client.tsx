"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AlternativeTeams } from "./alternative-teams";
import { ProjectPrediction } from "./project-prediction";
import { SkillGapAnalysis } from "./skill-gap-analysis";
import { InteractiveTeamBuilder } from "./interactive-team-builder";
import { TeamChemistry } from "./team-chemistry";
import { ProjectTimeline } from "./project-timeline";
import { ResourceOptimization } from "./resource-optimization";
import { EmployeeGrowthTracking } from "./employee-growth-tracking";
import { BudgetOptimization } from "./budget-optimization";

type ProjectAIInsightsClientProps = {
  projectId: number;
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export function ProjectAIInsightsClient({
  projectId,
}: ProjectAIInsightsClientProps) {
  const trpc = useTRPC();
  const router = useRouter();

  const projectQueryOptions = trpc.projects.getOne.queryOptions({
    id: projectId,
  });

  const project = useSuspenseQuery(projectQueryOptions);

  if (project.error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-destructive">Error: {project.error?.message}</p>
      </div>
    );
  }

  const projectData = project.data;
  const teamMembers = projectData?.team || [];

  return (
    <motion.div
      className="min-h-screen  from-background via-background to-muted/20"
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
    >
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          variants={sectionVariants}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push(`/project/${projectId}`)}
                className="gap-2 mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Project Details
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-linear-to-br from-primary/20 to-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold bg-linear-to-br from-primary to-blue-600 bg-clip-text text-transparent">
                    AI Insights & Analytics
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {projectData?.project.title || "Project"} - Powered by AI
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Phase 1: Alternative Team Compositions */}
        {teamMembers.length > 0 && (
          <motion.div
            variants={sectionVariants}
            className="mb-8"
          >
            <AlternativeTeams projectId={projectId} />
          </motion.div>
        )}

        {/* Phase 1: Project Success Prediction */}
        {teamMembers.length > 0 && (
          <motion.div
            variants={sectionVariants}
            className="mb-8"
          >
            <ProjectPrediction projectId={projectId} />
          </motion.div>
        )}

        {/* Phase 1: Skill Gap Analysis */}
        {teamMembers.length > 0 && (
          <motion.div
            variants={sectionVariants}
            className="mb-8"
          >
            <SkillGapAnalysis projectId={projectId} />
          </motion.div>
        )}

        {/* Phase 2: Interactive Team Builder */}
        <motion.div
          variants={sectionVariants}
          className="mb-8"
        >
          <InteractiveTeamBuilder
            projectId={projectId}
            currentTeam={teamMembers}
          />
        </motion.div>

        {/* Phase 2: Team Chemistry Score */}
        {teamMembers.length > 0 && (
          <motion.div
            variants={sectionVariants}
            className="mb-8"
          >
            <TeamChemistry teamMembers={teamMembers} />
          </motion.div>
        )}

        {/* Phase 2: Project Timeline Visualization */}
        {teamMembers.length > 0 && (
          <motion.div
            variants={sectionVariants}
            className="mb-8"
          >
            <ProjectTimeline
              projectId={projectId}
              teamMembers={teamMembers}
              estimatedWeeks={12}
            />
          </motion.div>
        )}

        {/* Phase 3: Budget Optimization */}
        {teamMembers.length > 0 && (
          <motion.div
            variants={sectionVariants}
            className="mb-8"
          >
            <BudgetOptimization
              projectId={projectId}
              teamMembers={teamMembers}
              estimatedWeeks={12}
              successProbability={80}
            />
          </motion.div>
        )}

        {/* Phase 3: Employee Growth Tracking */}
        <motion.div
          variants={sectionVariants}
          className="mb-8"
        >
          <EmployeeGrowthTracking />
        </motion.div>

        {/* Phase 3: Multi-Project Resource Optimization */}
        <motion.div
          variants={sectionVariants}
          className="mb-8"
        >
          <ResourceOptimization />
        </motion.div>

        {/* Empty State */}
        {teamMembers.length === 0 && (
          <motion.div
            variants={sectionVariants}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <div className="p-6 rounded-full bg-muted/50 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Team Members Yet</h2>
              <p className="text-muted-foreground mb-6">
                AI insights will be available once team members are assigned to
                this project. Go back to the project page to see the team
                matching process.
              </p>
              <Button onClick={() => router.push(`/project/${projectId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project Details
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
