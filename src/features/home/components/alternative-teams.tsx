"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, TrendingUp, Zap, Award, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

type AlternativeTeamsProps = {
  projectId: number;
};

export function AlternativeTeams({ projectId }: AlternativeTeamsProps) {
  const trpc = useTRPC();
  const [selectedStrategy, setSelectedStrategy] = useState<string>("balanced");

  const { data: teams, isLoading } = useQuery(
    trpc.projects.getAlternativeTeams.queryOptions({ projectId })
  );

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Alternative Team Compositions</CardTitle>
          <CardDescription>Loading team options...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!teams || teams.length === 0) {
    return null;
  }

  const strategyIcons = {
    fast: Zap,
    balanced: Scale,
    experienced: Award,
  };

  const strategyColors = {
    fast: "bg-yellow-100",
    balanced: "bg-blue-100",
    experienced: "bg-purple-100",
  };

  return (
    <Card className="mb-8 border-2">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Users className="h-6 w-6" />
          Alternative Team Compositions
        </CardTitle>
        <CardDescription>
          Choose from different team strategies optimized for different goals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={selectedStrategy}
          onValueChange={setSelectedStrategy}
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {teams.map((team) => {
              const Icon = strategyIcons[team.strategy] || Users;
              return (
                <TabsTrigger
                  key={team.strategy}
                  value={team.strategy}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {team.strategyName}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {teams.map((team) => {
            const Icon = strategyIcons[team.strategy] || Users;
            const colorClass =
              strategyColors[team.strategy] || "from-gray-500 to-gray-600";

            return (
              <TabsContent
                key={team.strategy}
                value={team.strategy}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`border-2  ${colorClass}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <Icon className="h-5 w-5" />
                            {team.strategyName}
                          </CardTitle>
                          <CardDescription className="mt-2 text-base">
                            {team.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              Success Probability
                            </span>
                            <Badge
                              variant="default"
                              className="font-bold"
                            >
                              {team.successProbability || 70}%
                            </Badge>
                          </div>
                          <Progress
                            value={team.successProbability || 70}
                            className="h-2"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Est. Completion
                            </span>
                            <Badge
                              variant="outline"
                              className="font-semibold"
                            >
                              {team.estimatedCompletionWeeks || 12} weeks
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Team Members */}
                      {team.employees && team.employees.length > 0 ? (
                        <div>
                          <h4 className="font-semibold mb-3">
                            Team Members ({team.employees.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {team.employees.map((emp, idx) => {
                              const employee = emp as typeof emp & {
                                employeeName?: string;
                              };
                              return (
                                <motion.div
                                  key={emp.employeeId}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                >
                                  <Card className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">
                                          {employee.employeeName ||
                                            `Employee #${emp.employeeId}`}
                                        </p>
                                        {emp.reason && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {emp.reason}
                                          </p>
                                        )}
                                      </div>
                                      <Badge variant="secondary">
                                        {emp.score?.toFixed(1) || 0}%
                                      </Badge>
                                    </div>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No team members suggested yet</p>
                          <p className="text-sm mt-1">
                            AI is analyzing the best team composition...
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
