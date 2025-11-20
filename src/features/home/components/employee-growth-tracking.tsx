"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Award, Target, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function EmployeeGrowthTracking() {
  const trpc = useTRPC();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);

  const { data: allGrowth, isLoading } = useQuery(
    trpc.projects.getEmployeeGrowth.queryOptions({ employeeId: selectedEmployeeId })
  );

  const selectedGrowth = allGrowth?.find((g) => g.employeeId === selectedEmployeeId) || allGrowth?.[0];

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Employee Growth Tracking</CardTitle>
          <CardDescription>Loading growth data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!allGrowth || allGrowth.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Employee Growth Tracking</CardTitle>
          <CardDescription>No employee growth data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Prepare chart data
  const skillGrowthData = selectedGrowth?.skillGrowth.map((sg) => ({
    skill: sg.skillName,
    initial: sg.initialExperience,
    current: sg.currentExperience,
    growth: sg.growth,
  })) || [];

  return (
    <Card className="mb-8 border-2">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Employee Growth Tracking
        </CardTitle>
        <CardDescription>
          Track skill development and career progression over time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employee Selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Select Employee</label>
          <Select
            value={selectedEmployeeId?.toString() || allGrowth[0]?.employeeId.toString()}
            onValueChange={(value) => setSelectedEmployeeId(parseInt(value, 10))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {allGrowth.map((growth) => (
                <SelectItem key={growth.employeeId} value={growth.employeeId.toString()}>
                  {growth.employeeName} - {growth.careerPath.currentLevel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedGrowth && (
          <>
            {/* Career Path */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Career Path
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Level</p>
                  <Badge variant="default" className="mt-1">
                    {selectedGrowth.careerPath.currentLevel}
                  </Badge>
                </div>
                {selectedGrowth.careerPath.nextLevel && (
                  <div>
                    <p className="text-sm text-muted-foreground">Next Level</p>
                    <Badge variant="outline" className="mt-1">
                      {selectedGrowth.careerPath.nextLevel}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Promotion Readiness</span>
                  <Badge
                    variant={
                      selectedGrowth.careerPath.readinessScore >= 80
                        ? "default"
                        : selectedGrowth.careerPath.readinessScore >= 60
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {selectedGrowth.careerPath.readinessScore}%
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${selectedGrowth.careerPath.readinessScore}%` }}
                  />
                </div>
              </div>
              {selectedGrowth.careerPath.recommendations.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Recommendations:</p>
                  <ul className="space-y-1">
                    {selectedGrowth.careerPath.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Skill Growth Chart */}
            {skillGrowthData.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Skill Growth
                </h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="initial" fill="#8884d8" name="Initial Experience" />
                      <Bar dataKey="current" fill="#82ca9d" name="Current Experience" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Project History */}
            {selectedGrowth.projectHistory.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4">Project History</h4>
                <div className="space-y-2">
                  {selectedGrowth.projectHistory.map((project, idx) => (
                    <motion.div
                      key={project.projectId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-3 border rounded-lg"
                    >
                      <div className="font-medium">{project.projectName}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {project.skillsUsed.slice(0, 5).map((skill, skillIdx) => (
                          <Badge key={skillIdx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {project.skillsUsed.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.skillsUsed.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

