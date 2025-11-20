/**
 * Budget Optimization Utilities
 * Calculates team costs and ROI
 */

// Mock salary data - in production, this would come from the database
// For now, we'll estimate based on seniority
const SENIORITY_SALARY_MAP: Record<string, number> = {
  Junior: 60000,
  Mid: 90000,
  Senior: 130000,
  Lead: 160000,
  Principal: 200000,
};

const DEFAULT_SALARY = 80000;

/**
 * Estimate employee salary based on seniority
 */
export function estimateEmployeeSalary(seniority?: string | null): number {
  if (!seniority) return DEFAULT_SALARY;
  return SENIORITY_SALARY_MAP[seniority] || DEFAULT_SALARY;
}

/**
 * Calculate team cost
 */
export function calculateTeamCost(
  teamMembers: Array<{
    employee: {
      seniority?: string | null;
    };
  }>,
  projectDurationWeeks: number = 12
): {
  totalCost: number;
  monthlyCost: number;
  weeklyCost: number;
  costPerMember: Array<{
    employeeId: number;
    salary: number;
    projectCost: number;
  }>;
} {
  const costPerMember = teamMembers.map((member, idx) => {
    const salary = estimateEmployeeSalary(member.employee.seniority);
    const monthlySalary = salary / 12;
    const weeklySalary = monthlySalary / 4.33;
    const projectCost = weeklySalary * projectDurationWeeks;

    return {
      employeeId: (member as any).employee_id || idx,
      salary,
      projectCost,
    };
  });

  const totalCost = costPerMember.reduce((sum, m) => sum + m.projectCost, 0);
  const monthlyCost = totalCost / (projectDurationWeeks / 4.33);
  const weeklyCost = totalCost / projectDurationWeeks;

  return {
    totalCost,
    monthlyCost,
    weeklyCost,
    costPerMember,
  };
}

/**
 * Calculate ROI metrics
 */
export function calculateROI(
  teamCost: number,
  estimatedCompletionWeeks: number,
  successProbability: number = 80
): {
  costPerWeek: number;
  valueScore: number; // 0-100, based on cost efficiency and success probability
  recommendation: string;
} {
  const costPerWeek = teamCost / estimatedCompletionWeeks;
  
  // Value score: lower cost + higher success = better value
  // Normalize cost (assume $50k/week is baseline)
  const normalizedCost = Math.min(100, (costPerWeek / 50000) * 100);
  const valueScore = Math.round((successProbability * 0.7) + ((100 - normalizedCost) * 0.3));

  let recommendation = "";
  if (valueScore >= 80) {
    recommendation = "Excellent value - optimal balance of cost and success probability";
  } else if (valueScore >= 60) {
    recommendation = "Good value - reasonable cost with solid success probability";
  } else if (valueScore >= 40) {
    recommendation = "Moderate value - consider optimizing team composition";
  } else {
    recommendation = "Low value - high cost relative to success probability. Consider alternative team.";
  }

  return {
    costPerWeek,
    valueScore,
    recommendation,
  };
}

/**
 * Find budget-friendly team option
 */
export function findBudgetFriendlyOption(
  teamOptions: Array<{
    team: Array<{ employee: { seniority?: string | null } }>;
    estimatedWeeks: number;
    successProbability: number;
  }>
): {
  cheapest: number;
  bestValue: number;
  fastest: number;
} {
  const costs = teamOptions.map((option, idx) => {
    const cost = calculateTeamCost(option.team, option.estimatedWeeks);
    const roi = calculateROI(cost.totalCost, option.estimatedWeeks, option.successProbability);
    return {
      index: idx,
      totalCost: cost.totalCost,
      valueScore: roi.valueScore,
      weeks: option.estimatedWeeks,
    };
  });

  const cheapest = costs.reduce((min, curr) =>
    curr.totalCost < min.totalCost ? curr : min
  ).index;

  const bestValue = costs.reduce((best, curr) =>
    curr.valueScore > best.valueScore ? curr : best
  ).index;

  const fastest = costs.reduce((fast, curr) =>
    curr.weeks < fast.weeks ? curr : fast
  ).index;

  return { cheapest, bestValue, fastest };
}

