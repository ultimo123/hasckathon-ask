import prisma from "@/lib/db";

/**
 * Employee Growth Tracking Utilities
 * Tracks skill development and career progression
 */

export type EmployeeGrowth = {
  employeeId: number;
  employeeName: string;
  currentSkills: Array<{
    skillName: string;
    experienceYears: number;
  }>;
  projectHistory: Array<{
    projectId: number;
    projectName: string;
    skillsUsed: string[];
    completedAt?: Date;
  }>;
  skillGrowth: Array<{
    skillName: string;
    initialExperience: number;
    currentExperience: number;
    growth: number;
    projects: number;
  }>;
  careerPath: {
    currentLevel: string;
    nextLevel?: string;
    readinessScore: number; // 0-100
    recommendations: string[];
  };
};

/**
 * Calculate employee growth metrics
 */
export async function calculateEmployeeGrowth(
  employeeId: number
): Promise<EmployeeGrowth | null> {
  const employee = await prisma.employee.findUnique({
    where: { employee_id: employeeId },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
      projectTeams: {
        include: {
          project: {
            select: {
              project_id: true,
              project_name: true,
            },
          },
        },
      },
    },
  });

  if (!employee) {
    return null;
  }

  const currentSkills = employee.skills.map((es) => ({
    skillName: es.skill.skill_name,
    experienceYears: es.experience_years,
  }));

  const projectHistory = employee.projectTeams.map((pt) => ({
    projectId: pt.project.project_id,
    projectName: pt.project.project_name,
    skillsUsed: currentSkills.map((s) => s.skillName), // Simplified - in real app, track actual skills used
    completedAt: undefined, // Would need a project status/completion date field
  }));

  // Calculate skill growth (simplified - assumes experience increases with projects)
  const skillGrowth = currentSkills.map((skill) => {
    const projectsUsingSkill = projectHistory.length; // Simplified
    const growth = Math.min(projectsUsingSkill * 0.5, 5); // Max 5 years growth

    return {
      skillName: skill.skillName,
      initialExperience: Math.max(0, skill.experienceYears - growth),
      currentExperience: skill.experienceYears,
      growth,
      projects: projectsUsingSkill,
    };
  });

  // Career path analysis
  const seniorityLevels = ["Junior", "Mid", "Senior", "Lead", "Principal"];
  const currentLevel = employee.seniority || "Junior";
  const currentIndex = seniorityLevels.indexOf(currentLevel);
  const nextLevel = currentIndex < seniorityLevels.length - 1 ? seniorityLevels[currentIndex + 1] : undefined;

  // Calculate readiness score based on:
  // - Number of projects (more = more experience)
  // - Skill diversity
  // - Total experience years
  const projectCount = projectHistory.length;
  const skillDiversity = currentSkills.length;
  const totalExperience = employee.total_experience_years || 0;

  const readinessScore = Math.min(
    100,
    Math.round(
      (projectCount * 10 + skillDiversity * 5 + totalExperience * 2) / 3
    )
  );

  const recommendations: string[] = [];
  if (readinessScore >= 80 && nextLevel) {
    recommendations.push(`Ready for promotion to ${nextLevel} level`);
  } else if (readinessScore < 50) {
    recommendations.push("Gain more project experience to advance");
    recommendations.push("Develop additional skills in your domain");
  } else {
    recommendations.push("Continue building project experience");
    recommendations.push("Take on more challenging projects");
  }

  return {
    employeeId: employee.employee_id,
    employeeName: employee.full_name,
    currentSkills,
    projectHistory,
    skillGrowth,
    careerPath: {
      currentLevel,
      nextLevel,
      readinessScore,
      recommendations,
    },
  };
}

/**
 * Get all employees with growth metrics
 */
export async function getAllEmployeeGrowth(): Promise<EmployeeGrowth[]> {
  const employees = await prisma.employee.findMany({
    select: {
      employee_id: true,
    },
  });

  const growthData = await Promise.all(
    employees.map((emp) => calculateEmployeeGrowth(emp.employee_id))
  );

  return growthData.filter((g): g is EmployeeGrowth => g !== null);
}

