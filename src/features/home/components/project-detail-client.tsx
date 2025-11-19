"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

type ProjectDetailClientProps = {
  projectId: number;
};

export function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const trpc = useTRPC();
  const router = useRouter();

  const projectQueryOptions = trpc.projects.getOne.queryOptions({
    id: projectId,
  });

  // Initial query
  const project = useSuspenseQuery(projectQueryOptions);

  // Check if team is empty to determine if we should poll
  const teamIsEmpty = useMemo(() => {
    const team = project.data?.team || [];
    return team.length === 0;
  }, [project.data?.team]);

  // Set up polling when team is empty
  useEffect(() => {
    if (!teamIsEmpty) return;

    const interval = setInterval(() => {
      project.refetch();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [teamIsEmpty, project]);

  // With Suspense, we don't need to check isLoading - Suspense handles it
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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </div>

      {/* Project Header */}
      <div className="mb-8">
        {!!projectData.project.title && (
          <h1 className="text-4xl font-bold mb-2">
            {projectData.project.title}
          </h1>
        )}
      </div>

      {/* Project Requirements */}
      <Card className="mb-8">
        <CardHeader>
          {!!projectData.project.description && (
            <p className="text-muted-foreground text-lg">
              {projectData.project.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {projectData.project.skills?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {projectData.project.skills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="secondary"
                  >
                    {skill.name} ({skill.minExperienceYears}+ years)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {projectData.project.seniority.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Seniority Requirements</h3>
              <div className="flex flex-wrap gap-2">
                {projectData.project.seniority.map((req, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                  >
                    {req.level} ({req.requiredCount} needed)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      {teamMembers.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Team Members ({teamMembers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <Card
                key={member.employee_id}
                className="hover:shadow-lg transition-shadow border-blue-500"
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {member.employee.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {member.employee.full_name}
                      </CardTitle>
                      {member.employee.role && (
                        <CardDescription>
                          {member.employee.role}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    {member.employee.seniority && (
                      <Badge variant="outline">
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
                          className="font-bold text-sm"
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
                    <p className="text-sm text-muted-foreground">
                      📍 {member.employee.location.name}
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
                          className="text-xs"
                        >
                          {skill.skill_name} ({skill.experience_years}y)
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {member.employee.languages.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Languages:</p>
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
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        </div>
      )}
    </div>
  );
}
