"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

type ProjectTimelineProps = {
  projectId: number;
  teamMembers: Array<{
    employee_id: number;
    employee: {
      full_name: string;
      seniority?: string | null;
    };
  }>;
  estimatedWeeks?: number;
};

type Phase = {
  name: string;
  duration: number; // weeks
  teamMembers: number;
  color: string;
};

export function ProjectTimeline({
  teamMembers,
  estimatedWeeks = 12,
}: ProjectTimelineProps) {
  // Generate project phases based on team size and estimated duration
  const phases: Phase[] = useMemo(() => {
    const basePhases = [
      { name: "Planning", baseDuration: 2, color: "#3b82f6" },
      { name: "Design", baseDuration: 3, color: "#8b5cf6" },
      { name: "Development", baseDuration: 5, color: "#10b981" },
      { name: "Testing", baseDuration: 1.5, color: "#f59e0b" },
      { name: "Deployment", baseDuration: 0.5, color: "#ef4444" },
    ];

    // Adjust duration based on team size (more people = faster, but with diminishing returns)
    const teamSize = teamMembers.length;
    const speedMultiplier = teamSize > 0 ? Math.max(0.5, 1 - (teamSize - 1) * 0.1) : 1;

    // Calculate total base duration
    const totalBaseDuration = basePhases.reduce((sum, p) => sum + p.baseDuration, 0);

    // Scale to match estimated weeks
    const scaleFactor = estimatedWeeks / totalBaseDuration;

    return basePhases.map((phase) => ({
      ...phase,
      duration: Math.max(0.5, phase.baseDuration * scaleFactor * speedMultiplier),
      teamMembers: Math.max(1, Math.floor(teamSize * (phase.name === "Development" ? 1 : 0.7))),
    }));
  }, [teamMembers.length, estimatedWeeks]);

  const chartData = phases.map((phase, idx) => ({
    phase: phase.name,
    weeks: Math.round(phase.duration * 10) / 10,
    teamSize: phase.teamMembers,
    startWeek: phases.slice(0, idx).reduce((sum, p) => sum + p.duration, 0),
    endWeek:
      phases.slice(0, idx).reduce((sum, p) => sum + p.duration, 0) + phase.duration,
    color: phase.color,
  }));

  const totalWeeks = phases.reduce((sum, p) => sum + p.duration, 0);

  return (
    <Card className="mb-8 border-2">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Project Timeline
        </CardTitle>
        <CardDescription>
          Visual timeline showing project phases and team allocation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{Math.round(totalWeeks)}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Total Weeks
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{phases.length}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              Phases
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Users className="h-3 w-3" />
              Team Size
            </div>
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, Math.ceil(totalWeeks)]} />
              <YAxis dataKey="phase" type="category" width={80} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{data.phase}</p>
                        <p className="text-sm">
                          Duration: {data.weeks} weeks
                        </p>
                        <p className="text-sm">
                          Team: {data.teamSize} member{data.teamSize !== 1 ? "s" : ""}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Weeks {Math.round(data.startWeek)} - {Math.round(data.endWeek)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="weeks" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Phase Details */}
        <div className="space-y-3">
          <h4 className="font-semibold">Phase Breakdown</h4>
          <div className="space-y-2">
            {phases.map((phase, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: phase.color }}
                  />
                  <div>
                    <p className="font-medium">{phase.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {phase.teamMembers} team member{phase.teamMembers !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {Math.round(phase.duration * 10) / 10} weeks
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

