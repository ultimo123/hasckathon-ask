"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { calculateTeamChemistry } from "@/lib/ai-enhanced";

type TeamChemistryProps = {
  teamMembers: Array<{
    employee: {
      seniority?: string | null;
      skills: Array<{ skill_name: string; experience_years: number }>;
      location?: { name: string } | null;
      languages: Array<{ language_name: string }>;
    };
  }>;
};

export function TeamChemistry({ teamMembers }: TeamChemistryProps) {
  const chemistry = useMemo(
    () => calculateTeamChemistry(teamMembers),
    [teamMembers]
  );

  if (teamMembers.length === 0) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  return (
    <Card className="mb-8 border-2">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Users className="h-6 w-6" />
          Team Chemistry Score
        </CardTitle>
        <CardDescription>
          Analyze team compatibility and collaboration potential
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Overall Chemistry</span>
            <Badge
              variant="default"
              className={`font-bold text-lg bg-gradient-to-r ${getScoreColor(
                chemistry.overallScore
              )}`}
            >
              {chemistry.overallScore}% - {getScoreLabel(chemistry.overallScore)}
            </Badge>
          </div>
          <Progress
            value={chemistry.overallScore}
            className="h-3"
          />
        </div>

        {/* Factor Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 border rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Seniority Balance</span>
              <Badge variant="outline">{chemistry.factors.seniorityBalance.score}%</Badge>
            </div>
            <Progress value={chemistry.factors.seniorityBalance.score} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {chemistry.factors.seniorityBalance.note}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 border rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Skill Diversity</span>
              <Badge variant="outline">{chemistry.factors.skillDiversity.score}%</Badge>
            </div>
            <Progress value={chemistry.factors.skillDiversity.score} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {chemistry.factors.skillDiversity.note}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 border rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Location Compatibility</span>
              <Badge variant="outline">{chemistry.factors.locationCompatibility.score}%</Badge>
            </div>
            <Progress value={chemistry.factors.locationCompatibility.score} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {chemistry.factors.locationCompatibility.note}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 border rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Language Overlap</span>
              <Badge variant="outline">{chemistry.factors.languageOverlap.score}%</Badge>
            </div>
            <Progress value={chemistry.factors.languageOverlap.score} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {chemistry.factors.languageOverlap.note}
            </p>
          </motion.div>
        </div>

        {/* Recommendations */}
        {chemistry.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <TrendingUp className="h-5 w-5" />
              Recommendations
            </h4>
            <ul className="space-y-2">
              {chemistry.recommendations.map((rec, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400"
                >
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

