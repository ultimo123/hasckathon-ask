"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calculator, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

type BudgetOptimizationProps = {
  projectId: number;
  teamMembers: Array<{
    employee_id?: number;
    employee: {
      full_name?: string;
      seniority?: string | null;
    };
  }>;
  estimatedWeeks?: number;
  successProbability?: number;
};

export function BudgetOptimization({
  projectId,
  teamMembers,
  estimatedWeeks = 12,
  successProbability = 80,
}: BudgetOptimizationProps) {
  const trpc = useTRPC();

  const { data: budgetData, isLoading } = useQuery(
    trpc.projects.getTeamBudget.queryOptions({
      teamMembers: teamMembers.map((m) => ({
        employee: {
          seniority: m.employee.seniority || null,
        },
      })),
      projectDurationWeeks: estimatedWeeks,
    })
  );

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Budget Optimization</CardTitle>
          <CardDescription>Calculating budget...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!budgetData || teamMembers.length === 0) {
    return null;
  }

  const { cost, roi } = budgetData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getValueColor = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  return (
    <Card className="mb-8 border-2">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          Budget Optimization
        </CardTitle>
        <CardDescription>
          Cost analysis and ROI calculation for team composition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cost Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(cost.totalCost)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Total Project Cost</div>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(cost.monthlyCost)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Monthly Cost</div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(cost.weeklyCost)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Weekly Cost</div>
          </div>
        </div>

        {/* ROI Analysis */}
        <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            ROI Analysis
          </h4>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Value Score</span>
                <Badge
                  variant="default"
                  className={`font-bold bg-gradient-to-r ${getValueColor(roi.valueScore)}`}
                >
                  {roi.valueScore}/100
                </Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                  style={{ width: `${roi.valueScore}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cost per Week</p>
                <p className="text-lg font-semibold">{formatCurrency(roi.costPerWeek)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Success Probability</p>
                <p className="text-lg font-semibold">{successProbability}%</p>
              </div>
            </div>
            <div className="p-3 bg-background/50 rounded border">
              <p className="text-sm">{roi.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Cost Breakdown by Employee */}
        <div>
          <h4 className="font-semibold mb-4">Cost Breakdown</h4>
          <div className="space-y-2">
            {cost.costPerMember.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {teamMembers[idx]?.employee?.full_name || `Team Member ${idx + 1}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estimated salary: {formatCurrency(member.salary)}/year
                    {teamMembers[idx]?.employee?.seniority && ` (${teamMembers[idx]?.employee?.seniority})`}
                  </p>
                </div>
                <Badge variant="outline" className="font-semibold">
                  {formatCurrency(member.projectCost)}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Budget Tips */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                Budget Optimization Tips
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                <li>• Consider mixing senior and junior developers for cost efficiency</li>
                <li>• Balance team size with project timeline requirements</li>
                <li>• Higher success probability may justify higher costs</li>
                <li>• Review alternative team compositions for better ROI</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

