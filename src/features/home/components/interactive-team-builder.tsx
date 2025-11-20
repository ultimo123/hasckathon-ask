"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, X, GripVertical, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type InteractiveTeamBuilderProps = {
  projectId: number;
  currentTeam: Array<{
    employee_id: number;
    employee: {
      full_name: string;
      role?: string | null;
      seniority?: string | null;
      skills: Array<{ skill_name: string }>;
    };
  }>;
};

export function InteractiveTeamBuilder({
  projectId,
  currentTeam,
}: InteractiveTeamBuilderProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [draggedEmployee, setDraggedEmployee] = useState<number | null>(null);
  const [teamMembers, setTeamMembers] = useState<number[]>(
    currentTeam.map((m) => m.employee_id)
  );

  // Get all employees
  const { data: allEmployees } = useQuery(
    trpc.projects.getQualifiedUsers.queryOptions({ projectId })
  );

  // Get available employees (not in team)
  const availableEmployees = useMemo(() => {
    if (!allEmployees) return [];
    return allEmployees.filter((emp) => !teamMembers.includes(emp.employeeId));
  }, [allEmployees, teamMembers]);

  // Get team member details - merge current team with newly added members
  const teamMemberDetails = useMemo(() => {
    const teamDetails: Array<{
      employeeId: number;
      fullName: string;
      role?: string;
      seniority?: string;
      skills: Array<{ name: string }>;
    }> = [];

    // Start with current team members (already saved to DB)
    const currentTeamMap = new Map(
      currentTeam.map((m) => [
        m.employee_id,
        {
          employeeId: m.employee_id,
          fullName: m.employee.full_name,
          role: m.employee.role || undefined,
          seniority: m.employee.seniority || undefined,
          skills: m.employee.skills.map((s) => ({ name: s.skill_name })),
        },
      ])
    );

    // Add current team members
    teamMembers.forEach((employeeId) => {
      // First check if it's in currentTeam (already saved)
      if (currentTeamMap.has(employeeId)) {
        teamDetails.push(currentTeamMap.get(employeeId)!);
      } else if (allEmployees) {
        // Otherwise, try to find it in allEmployees (newly added, not yet saved)
        const employee = allEmployees.find(
          (emp) => emp.employeeId === employeeId
        );
        if (employee) {
          teamDetails.push({
            employeeId: employee.employeeId,
            fullName: employee.fullName,
            role: employee.role || undefined,
            seniority: employee.seniority || undefined,
            skills: employee.skills.map((s) => ({ name: s.name })),
          });
        }
      }
    });

    return teamDetails;
  }, [allEmployees, teamMembers, currentTeam]);

  const handleDragStart = (employeeId: number) => {
    setDraggedEmployee(employeeId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (target: "team" | "available") => {
    if (draggedEmployee === null) return;

    if (target === "team") {
      // Add to team
      if (!teamMembers.includes(draggedEmployee)) {
        setTeamMembers([...teamMembers, draggedEmployee]);
        toast.success("Employee added to team");
      }
    } else {
      // Remove from team
      setTeamMembers(teamMembers.filter((id) => id !== draggedEmployee));
      toast.success("Employee removed from team");
    }

    setDraggedEmployee(null);
  };

  const handleRemoveFromTeam = async (employeeId: number) => {
    const updatedTeamMembers = teamMembers.filter((id) => id !== employeeId);
    setTeamMembers(updatedTeamMembers);

    // Immediately save to database
    toast.info("Removing team member...");
    try {
      await saveTeamMutation.mutateAsync({
        projectId,
        employeeIds: updatedTeamMembers,
      });
      // Success message is already shown in saveTeamMutation.onSuccess
    } catch (error: any) {
      // Revert on error
      setTeamMembers(teamMembers);
      toast.error(
        `Failed to remove team member: ${error.message || "Unknown error"}`
      );
    }
  };

  const handleAddToTeam = (employeeId: number) => {
    if (!teamMembers.includes(employeeId)) {
      setTeamMembers([...teamMembers, employeeId]);
      toast.success("Employee added to team");
    }
  };

  const aiSuggestQuery = trpc.projects.suggestTeamMembers.queryOptions({
    projectId,
  });
  const {
    data: aiSuggestions,
    isLoading: aiLoading,
    refetch: refetchAI,
  } = useQuery({
    ...aiSuggestQuery,
    enabled: false, // Don't fetch automatically
  });

  const saveTeamMutation = useMutation(
    trpc.projects.saveProjectTeam.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          `Team updated successfully! ${data.count} team member(s) saved.`
        );

        // Invalidate all queries that depend on team data
        queryClient.invalidateQueries(
          trpc.projects.getOne.queryOptions({ id: projectId })
        );
        queryClient.invalidateQueries(
          trpc.projects.getQualifiedUsers.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(
          trpc.projects.getResourceConflicts.queryOptions()
        );
        queryClient.invalidateQueries(
          trpc.projects.getResourceAllocation.queryOptions()
        );
        queryClient.invalidateQueries(
          trpc.projects.getUnallocatedEmployees.queryOptions()
        );
        queryClient.invalidateQueries(
          trpc.projects.getAlternativeTeams.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(
          trpc.projects.getProjectPrediction.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(
          trpc.projects.getSkillGaps.queryOptions({ projectId })
        );

        // Refetch to update the UI immediately
        queryClient.refetchQueries(
          trpc.projects.getOne.queryOptions({ id: projectId })
        );
        queryClient.refetchQueries(
          trpc.projects.getResourceConflicts.queryOptions()
        );
        queryClient.refetchQueries(
          trpc.projects.getResourceAllocation.queryOptions()
        );
        queryClient.refetchQueries(
          trpc.projects.getUnallocatedEmployees.queryOptions()
        );
      },
      onError: (error) => {
        toast.error(`Failed to save team: ${error.message}`);
      },
    })
  );

  const handleAISuggest = async () => {
    toast.info("AI is analyzing and suggesting team members...");
    try {
      const result = await refetchAI();
      if (result.data && result.data.length > 0) {
        // Add suggested employees to team
        const suggestedIds = result.data.map((emp) => emp.employeeId);
        const newTeamMembers = [...new Set([...teamMembers, ...suggestedIds])];
        setTeamMembers(newTeamMembers);
        toast.success(`AI suggested ${result.data.length} team members!`);
      } else {
        toast.warning("No AI suggestions available at this time");
      }
    } catch (error) {
      toast.error("Failed to get AI suggestions");
    }
  };

  const handleSaveTeam = () => {
    if (teamMembers.length === 0) {
      toast.warning("Please select at least one team member");
      return;
    }
    toast.info("Saving team...");
    saveTeamMutation.mutate({
      projectId,
      employeeIds: teamMembers,
    });
  };

  return (
    <Card className="mb-8 border-2">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Users className="h-6 w-6" />
          Interactive Team Builder
        </CardTitle>
        <CardDescription>
          Drag and drop employees to build your ideal team, or use AI
          suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Employees */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Available Employees</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAISuggest}
                disabled={aiLoading}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {aiLoading ? "Analyzing..." : "AI Suggest"}
              </Button>
            </div>
            <div
              className="min-h-[400px] max-h-[600px] overflow-y-auto p-4 border-2 border-dashed rounded-lg bg-muted/30"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop("available")}
            >
              <AnimatePresence mode="popLayout">
                {availableEmployees.map((employee) => (
                  <motion.div
                    key={employee.employeeId}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileDrag={{ scale: 1.05, zIndex: 50 }}
                    draggable
                    onDragStart={() => handleDragStart(employee.employeeId)}
                    className="mb-3 cursor-move"
                  >
                    <Card className="border-2 hover:border-primary transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {employee.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {employee.fullName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {employee.seniority && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {employee.seniority}
                                </Badge>
                              )}
                              {employee.matchScore && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {employee.matchScore}% match
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddToTeam(employee.employeeId)}
                            className="flex-shrink-0"
                          >
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              {availableEmployees.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All employees are in the team</p>
                </div>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                Team Members ({teamMembers.length})
              </h3>
            </div>
            <div
              className="min-h-[400px] max-h-[600px] overflow-y-auto p-4 border-2 border-primary/30 rounded-lg bg-primary/5"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop("team")}
            >
              <AnimatePresence mode="popLayout">
                {teamMemberDetails.map((employee) => (
                  <motion.div
                    key={employee.employeeId}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    whileHover={{ scale: 1.02 }}
                    className="mb-3"
                  >
                    <Card className="border-2 border-primary/50 bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-primary">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {employee.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {employee.fullName}
                            </p>
                            {employee.role && (
                              <p className="text-sm text-muted-foreground truncate">
                                {employee.role}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {employee.seniority && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {employee.seniority}
                                </Badge>
                              )}
                              {employee.skills
                                ?.slice(0, 2)
                                .map((skill, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {skill.name}
                                  </Badge>
                                ))}
                              {employee.skills &&
                                employee.skills.length > 2 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    +{employee.skills.length - 2}
                                  </Badge>
                                )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveFromTeam(employee.employeeId)
                            }
                            className="flex-shrink-0 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              {teamMembers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Drag employees here or click "Add"</p>
                  <p className="text-sm mt-1">to build your team</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        {teamMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-muted rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Team Summary</p>
                <p className="text-sm text-muted-foreground">
                  {teamMembers.length} team member
                  {teamMembers.length !== 1 ? "s" : ""} selected
                </p>
              </div>
              <Button
                onClick={handleSaveTeam}
                disabled={
                  saveTeamMutation.isPending || teamMembers.length === 0
                }
              >
                {saveTeamMutation.isPending ? "Saving..." : "Save Team"}
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
