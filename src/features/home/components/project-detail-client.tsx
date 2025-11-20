"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Award, MapPin, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

type ProjectDetailClientProps = {
  projectId: number;
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const projectQueryOptions = trpc.projects.getOne.queryOptions({
    id: projectId,
  });

  // Initial query
  const project = useSuspenseQuery(projectQueryOptions);

  // Check if team is empty to determine if we should poll
  const teamIsEmpty = useMemo(() => {
    const team = project.data?.team || [];
    const isEmpty = team.length === 0;
    console.log("🔍 Team status:", {
      isEmpty,
      teamLength: team.length,
      projectId,
    });
    return isEmpty;
  }, [project.data?.team, projectId]);

  // Refetch on mount to ensure fresh data (especially after redirect from create)
  useEffect(() => {
    // Invalidate and refetch immediately on mount to get latest data
    const refetchProject = async () => {
      await queryClient.invalidateQueries({
        queryKey: projectQueryOptions.queryKey,
      });
      await queryClient.refetchQueries({
        queryKey: projectQueryOptions.queryKey,
      });
    };
    refetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // Only on projectId change (mount or navigation)

  // Set up polling when team is empty
  useEffect(() => {
    if (!teamIsEmpty) {
      console.log("✅ Team has members, stopping polling");
      return;
    }

    console.log("🔄 Starting polling for project", projectId);
    const interval = setInterval(() => {
      console.log("🔄 Polling: Refetching project data...");
      // Force refetch and invalidate cache
      queryClient.invalidateQueries({
        queryKey: projectQueryOptions.queryKey,
      });
      project
        .refetch({
          cancelRefetch: false, // Don't cancel if already refetching
        })
        .then((result) => {
          console.log("📊 Poll result:", {
            teamLength: result.data?.team?.length || 0,
            hasData: !!result.data,
            status: result.status,
          });
        })
        .catch((error) => {
          console.error("❌ Poll error:", error);
        });
    }, 5000); // Poll every 5 seconds

    return () => {
      console.log("🛑 Stopping polling");
      clearInterval(interval);
    };
  }, [teamIsEmpty, project, projectId, queryClient, projectQueryOptions]);

  const projectData = project.data;
  // Only show AI-selected team members (those with scores from AI matching)
  // Filter out manually added members (score === null) to show only AI-selected ones
  const teamMembers = useMemo(() => {
    const team = projectData?.team || [];
    const filtered = team.filter(
      (member) => member.score !== null && member.score !== undefined
    );
    console.log("🔍 Filtering team members:", {
      totalTeamLength: team.length,
      filteredLength: filtered.length,
      scores: team.map((m) => m.score),
      projectId,
      queryStatus: project.status,
    });
    return filtered;
  }, [projectData?.team, projectId, project.status]);

  // Debug logging - must be before any early returns
  useEffect(() => {
    console.log("📋 Project data updated:", {
      projectId,
      hasProjectData: !!projectData,
      teamMembersCount: teamMembers.length,
      teamMembers: teamMembers.slice(0, 3).map((m) => ({
        employeeId: m.employee_id,
        name: m.employee?.full_name,
        score: m.score,
      })),
      allTeamScores:
        projectData?.team?.map((m) => ({
          id: m.employee_id,
          score: m.score,
        })) || [],
    });
  }, [projectData, teamMembers, projectId]);

  console.log("🔍 Team members:", teamMembers, teamMembers.length > 0);

  // With Suspense, we don't need to check isLoading - Suspense handles it
  if (project.error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-destructive">Error: {project.error?.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="gap-2 hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </motion.div>

        {/* Project Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {!!projectData.project.title && (
            <h1 className="text-5xl font-bold mb-4 from-foreground to-foreground/70 bg-clip-text  text-black">
              {projectData.project.title}
            </h1>
          )}
        </motion.div>

        {/* Project Requirements */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="mb-8 border-2 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              {!!projectData.project.description && (
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {projectData.project.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {projectData.project.skills?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {projectData.project.skills.map((skill, idx) => (
                      <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <Badge
                          variant="secondary"
                          className="text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {skill.name} ({skill.minExperienceYears}+ years)
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {projectData.project.seniority.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Seniority Requirements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {projectData.project.seniority.map((req, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + idx * 0.05 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <Badge
                          variant="outline"
                          className="text-sm border-primary/30 hover:bg-primary/10 transition-colors"
                        >
                          {req.level} ({req.requiredCount} needed)
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-2 border-primary/30  from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Powered Insights
                  </h3>
                  <p className="text-muted-foreground">
                    Explore alternative team compositions, success predictions,
                    skill gap analysis, team chemistry scores, and project
                    timeline visualization.
                  </p>
                </div>
                <Button
                  onClick={() =>
                    router.push(`/project/${projectId}/ai-insights`)
                  }
                  size="lg"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  View AI Insights
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {teamMembers.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl font-bold mb-6 flex items-center gap-3"
            >
              <Users className="h-8 w-8 text-primary" />
              Team Members
              <Badge
                variant="secondary"
                className="ml-2"
              >
                {teamMembers.length}
              </Badge>
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member, idx) => (
                <motion.div
                  key={member.employee_id}
                  variants={fadeInUp}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full border-2 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-xl bg-linear-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden relative group">
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <CardHeader className="relative z-10">
                      <div className="flex items-start gap-3">
                        <Avatar className="ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                          <AvatarFallback className=" from-primary/20 to-primary/10 text-primary font-bold">
                            {member.employee.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {member.employee.full_name}
                          </CardTitle>
                          {member.employee.role && (
                            <CardDescription className="mt-1">
                              {member.employee.role}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 relative z-10">
                      <div className="flex items-center gap-2 text-sm">
                        {member.employee.seniority && (
                          <Badge
                            variant="outline"
                            className="border-primary/30"
                          >
                            {member.employee.seniority}
                          </Badge>
                        )}
                        {member.employee.total_experience_years && (
                          <span className="text-muted-foreground">
                            {member.employee.total_experience_years} years exp.
                          </span>
                        )}
                      </div>

                      {/* Score Progress Bar */}
                      {member.score !== null && member.score !== undefined && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              Match Score
                            </span>
                            <Badge
                              variant="default"
                              className="font-bold text-sm from-primary to-primary/80"
                            >
                              {member.score.toFixed(1)}
                            </Badge>
                          </div>
                          <Progress
                            value={Math.min(Math.max(member.score, 0), 100)}
                            className="h-2.5"
                          />
                        </div>
                      )}

                      {member.employee.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {member.employee.location.name}
                        </p>
                      )}

                      <Separator />

                      <div>
                        <p className="text-sm font-semibold mb-2">Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {member.employee.skills.map((skill) => (
                            <Badge
                              key={skill.skill_id}
                              variant="secondary"
                              className="text-xs hover:bg-primary/10 transition-colors"
                            >
                              {skill.skill_name} ({skill.experience_years}y)
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {member.employee.languages.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold mb-1">
                            Languages:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {member.employee.languages.map((lang) => (
                              <Badge
                                key={lang.language_id}
                                variant="outline"
                                className="text-xs"
                              >
                                {lang.language_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="border-dashed border-2 border-primary/30 bg-linear-to-br  from-muted/50 to-muted/20">
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full"
                  />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Matching employees to project...
                    </h3>
                    <p className="text-muted-foreground">
                      Our AI is analyzing profiles and finding the best team
                      members. This may take a few moments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
