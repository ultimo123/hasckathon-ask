"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

type ProjectPredictionProps = {
  projectId: number;
};

export function ProjectPrediction({ projectId }: ProjectPredictionProps) {
  const trpc = useTRPC();

  const { data: prediction, isLoading } = useQuery(
    trpc.projects.getProjectPrediction.queryOptions({ projectId })
  );

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Project Success Prediction</CardTitle>
          <CardDescription>Analyzing project...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!prediction) {
    return null;
  }

  const getSuccessColor = (probability: number) => {
    if (probability >= 80) return "bg-green-500";
    if (probability >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getSuccessLabel = (probability: number) => {
    if (probability >= 80) return "High";
    if (probability >= 60) return "Medium";
    return "Low";
  };

  return (
    <Card className="mb-8 border-2">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Project Success Prediction
        </CardTitle>
        <CardDescription>
          AI-powered analysis of project success probability and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success Probability */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Success Probability</span>
            <Badge
              variant="default"
              className={`font-bold text-lg  ${getSuccessColor(
                prediction.successProbability
              )}`}
            >
              {prediction.successProbability}% -{" "}
              {getSuccessLabel(prediction.successProbability)}
            </Badge>
          </div>
          <Progress
            value={prediction.successProbability}
            className="h-3"
          />
        </div>

        {/* Estimated Completion */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="font-medium">Estimated Completion Time</span>
          <Badge
            variant="outline"
            className="text-lg font-semibold"
          >
            {prediction.estimatedCompletionWeeks} weeks
          </Badge>
        </div>

        {/* Strengths */}
        {prediction.strengths && prediction.strengths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              Team Strengths
            </h4>
            <div className="space-y-2">
              {prediction.strengths.map((strength, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded"
                >
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Risk Factors */}
        {prediction.riskFactors && prediction.riskFactors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Risk Factors
            </h4>
            <div className="space-y-2">
              {prediction.riskFactors.map((risk, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded"
                >
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <span className="text-sm">{risk}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        {prediction.recommendations &&
          prediction.recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Lightbulb className="h-5 w-5" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {prediction.recommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded"
                  >
                    <Lightbulb className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
      </CardContent>
    </Card>
  );
}
