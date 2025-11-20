"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export function ResourceOptimization() {
  const trpc = useTRPC();

  const { data: conflicts, isLoading: conflictsLoading } = useQuery(
    trpc.projects.getResourceConflicts.queryOptions()
  );

  const { data: allocation, isLoading: allocationLoading } = useQuery(
    trpc.projects.getResourceAllocation.queryOptions()
  );

  const { data: unallocated, isLoading: unallocatedLoading } = useQuery(
    trpc.projects.getUnallocatedEmployees.queryOptions()
  );

  if (conflictsLoading || allocationLoading || unallocatedLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Resource Optimization</CardTitle>
          <CardDescription>Loading resource data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const highConflicts = conflicts?.filter((c) => c.severity === "high") || [];
  const mediumConflicts = conflicts?.filter((c) => c.severity === "medium") || [];

  return (
    <Card className="mb-8 border-2">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Multi-Project Resource Optimization
        </CardTitle>
        <CardDescription>
          Company-wide resource allocation analysis and conflict detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {highConflicts.length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">High Priority Conflicts</div>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {mediumConflicts.length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Medium Priority Conflicts</div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {unallocated?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Unallocated Employees</div>
          </div>
        </div>

        {/* Resource Conflicts */}
        {conflicts && conflicts.length > 0 ? (
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Resource Conflicts
            </h4>
            <div className="space-y-3">
              {conflicts.slice(0, 10).map((conflict, idx) => (
                <motion.div
                  key={conflict.employeeId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold">{conflict.employeeName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            conflict.severity === "high"
                              ? "destructive"
                              : conflict.severity === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {conflict.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Assigned to {conflict.projectCount} projects
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Projects:</p>
                    <div className="flex flex-wrap gap-2">
                      {conflict.projects.map((project) => (
                        <Link
                          key={project.projectId}
                          href={`/project/${project.projectId}`}
                        >
                          <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                            {project.projectName}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {conflict.recommendation}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 text-center"
          >
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <p className="font-semibold text-green-700 dark:text-green-300">
              No Resource Conflicts Found
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              All employees are optimally allocated across projects
            </p>
          </motion.div>
        )}

        {/* Unallocated Employees */}
        {unallocated && unallocated.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Unallocated Employees ({unallocated.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unallocated.slice(0, 6).map((emp, idx) => (
                <motion.div
                  key={emp.employeeId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 border rounded-lg bg-muted/30"
                >
                  <div className="font-medium">{emp.employeeName}</div>
                  {emp.seniority && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {emp.seniority}
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

