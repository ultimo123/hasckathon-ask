"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, BookOpen, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

type SkillGapAnalysisProps = {
  projectId: number;
};

export function SkillGapAnalysis({ projectId }: SkillGapAnalysisProps) {
  const trpc = useTRPC();

  const { data: gaps, isLoading } = useQuery(
    trpc.projects.getSkillGaps.queryOptions({ projectId })
  );

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Skill Gap Analysis</CardTitle>
          <CardDescription>Analyzing team skills...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!gaps) {
    return null;
  }

  const hasGaps = gaps.missingSkills.length > 0 || gaps.weakSkills.length > 0;

  return (
    <Card className="mb-8 border-2">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Skill Gap Analysis
        </CardTitle>
        <CardDescription>
          Identify missing skills and get learning recommendations for your team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {gaps.missingSkills.length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Missing Skills</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {gaps.weakSkills.length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Weak Skills</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {gaps.coveredSkills.length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Covered Skills</div>
          </div>
        </div>

        {!hasGaps && gaps.coveredSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">All Required Skills Covered!</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              Your team has all the necessary skills with sufficient experience.
            </p>
          </motion.div>
        )}

        {/* Missing Skills */}
        {gaps.missingSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Missing Skills
            </h4>
            <div className="space-y-3">
              {gaps.missingSkills.map((skill, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-300">
                        {skill.skill}
                      </div>
                      <Badge variant="outline" className="mt-1 border-red-300 text-red-700 dark:text-red-400">
                        Requires {skill.minExperience} years
                      </Badge>
                    </div>
                    <TrendingDown className="h-5 w-5 text-red-500 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    {skill.recommendation}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Weak Skills */}
        {gaps.weakSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-5 w-5" />
              Skills Needing Improvement
            </h4>
            <div className="space-y-3">
              {gaps.weakSkills.map((skill, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-orange-700 dark:text-orange-300">
                        {skill.skill}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="border-orange-300 text-orange-700 dark:text-orange-400">
                          Current: {skill.currentMaxExperience} years
                        </Badge>
                        <Badge variant="outline" className="border-orange-300 text-orange-700 dark:text-orange-400">
                          Required: {skill.required} years
                        </Badge>
                      </div>
                    </div>
                    <TrendingDown className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                    {skill.recommendation}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Covered Skills */}
        {gaps.coveredSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              Covered Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {gaps.coveredSkills.map((skill, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.03 }}
                >
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  >
                    {skill.skill} ({skill.maxExperience}y)
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

