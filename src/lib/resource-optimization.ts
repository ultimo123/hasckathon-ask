import prisma from "@/lib/db";

/**
 * Resource Optimization Utilities
 * Analyzes employee allocation across multiple projects
 */

export type ResourceConflict = {
  employeeId: number;
  employeeName: string;
  projectCount: number;
  projects: Array<{
    projectId: number;
    projectName: string;
  }>;
  severity: "high" | "medium" | "low";
  recommendation: string;
};

export type ResourceAllocation = {
  employeeId: number;
  employeeName: string;
  seniority?: string | null;
  totalProjects: number;
  projects: Array<{
    projectId: number;
    projectName: string;
    role?: string;
  }>;
  utilization: number; // 0-100%
};

/**
 * Find employees who are over-allocated across multiple projects
 */
export async function findResourceConflicts(): Promise<ResourceConflict[]> {
  // Get all employees with their project assignments
  const employees = await prisma.employee.findMany({
    include: {
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

  const conflicts: ResourceConflict[] = [];

  for (const employee of employees) {
    const projectCount = employee.projectTeams.length;

    if (projectCount > 1) {
      // Determine severity based on number of projects
      let severity: "high" | "medium" | "low";
      if (projectCount >= 4) {
        severity = "high";
      } else if (projectCount === 3) {
        severity = "medium";
      } else {
        severity = "low";
      }

      const recommendation =
        projectCount >= 4
          ? `Employee is assigned to ${projectCount} projects. Consider reducing to 2-3 projects for better focus.`
          : projectCount === 3
          ? `Employee is assigned to ${projectCount} projects. Monitor workload to ensure quality.`
          : `Employee is assigned to ${projectCount} projects. This is manageable but watch for overload.`;

      conflicts.push({
        employeeId: employee.employee_id,
        employeeName: employee.full_name,
        projectCount,
        projects: employee.projectTeams.map((pt) => ({
          projectId: pt.project.project_id,
          projectName: pt.project.project_name,
        })),
        severity,
        recommendation,
      });
    }
  }

  // Sort by severity (high first)
  return conflicts.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

/**
 * Get resource allocation summary for all employees
 */
export async function getResourceAllocation(): Promise<ResourceAllocation[]> {
  const employees = await prisma.employee.findMany({
    include: {
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

  return employees.map((employee) => {
    const totalProjects = employee.projectTeams.length;
    // Calculate utilization: 1 project = 50%, 2 = 100%, 3+ = 150% (over-utilized)
    const utilization = Math.min(150, totalProjects * 50);

    return {
      employeeId: employee.employee_id,
      employeeName: employee.full_name,
      seniority: employee.seniority,
      totalProjects,
      projects: employee.projectTeams.map((pt) => ({
        projectId: pt.project.project_id,
        projectName: pt.project.project_name,
        role: employee.role || undefined,
      })),
      utilization,
    };
  });
}

/**
 * Get employees who are not assigned to any project
 */
export async function getUnallocatedEmployees() {
  const employees = await prisma.employee.findMany({
    include: {
      projectTeams: true,
    },
  });

  return employees
    .filter((emp) => emp.projectTeams.length === 0)
    .map((emp) => ({
      employeeId: emp.employee_id,
      employeeName: emp.full_name,
      seniority: emp.seniority,
      role: emp.role,
      skills: emp.skills?.map((s: any) => s.skill?.skill_name) || [],
    }));
}

