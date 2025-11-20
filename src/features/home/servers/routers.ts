import { baseProcedure } from "@/trpc/init";
import { createTRPCRouter } from "@/trpc/init";
import prisma from "@/lib/db";
import { z } from "zod";
import { constructPrompt } from "@/lib/utils";
import { callAI } from "@/lib/ai-service";
import {
  generateAlternativeTeams,
  predictProjectSuccess,
  analyzeSkillGaps,
} from "@/lib/ai-enhanced";

const createProjectSchema = z.object({
  project_name: z.string().min(1, "Project name is required").max(100),
  description: z.string().optional(),
});

export const projectsRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    const projects = await prisma.project.findMany({
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        seniority: true,
        team: {
          include: {
            employee: true,
          },
        },
      },
      orderBy: {
        project_id: "desc",
      },
    });

    return projects.map((project) => {
      // Calculate total developers needed from seniority requirements
      const developersNeeded = project.seniority.reduce(
        (sum, req) => sum + req.required_count,
        0
      );

      // Get max experience years from required skills
      const experienceYears =
        project.skills.length > 0
          ? Math.max(...project.skills.map((s) => s.min_experience_years))
          : 0;

      // Extract skill names
      const skills = project.skills.map((ps) => ps.skill.skill_name);

      // Extract categories from seniority levels
      const categories = project.seniority.map((s) => s.seniority_level);

      return {
        id: project.project_id,
        title: project.project_name,
        description: project.description || "",
        developersNeeded,
        experienceYears,
        skills,
        categories,
      };
    });
  }),
  createProject: baseProcedure
    .input(createProjectSchema)
    .mutation(async ({ input }) => {
      const project = await prisma.project.create({
        data: {
          project_name: input.project_name,
          description: input.description || null,
        },
      });

      // Fire and forget OpenAI call - don't await, run in background
      (async () => {
        try {
          if (!project?.description) {
            console.error(
              "Project description is required for OpenAI matching"
            );
            return;
          }

          const employees = await prisma.employee.findMany({
            include: {
              skills: {
                include: {
                  skill: true,
                },
              },
            },
          });

          if (!employees || employees.length === 0) {
            console.error("No employees found for OpenAI matching");
            return;
          }

          const skills = await prisma.skill.findMany();
          if (!skills || skills.length === 0) {
            console.error("No skills found for OpenAI matching");
            return;
          }

          const prompt = constructPrompt(
            project.description,
            employees,
            skills
          );

          console.log(
            "🚀 Triggering OpenAI call for project:",
            project.project_id
          );

          // Fire and forget AI call (using Groq or OpenAI)
          callAI(prompt, project.project_id).catch((error) => {
            console.error("❌ Error in AI call:", error);
          });
        } catch (error) {
          console.error("Error in createProject background task:", error);
        }
      })();

      // Always return project ID immediately
      return {
        id: project.project_id,
      };
    }),

  deleteProject: baseProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      // Delete the project (cascade will handle related records)
      await prisma.project.delete({
        where: { project_id: input.id },
      });

      return { success: true };
    }),

  getOne: baseProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const project = await prisma.project.findUnique({
        where: { project_id: input.id },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
          seniority: true,
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      // Get projectTeam records separately to ensure we have all team members
      const projectTeam = await prisma.projectTeam.findMany({
        where: {
          project_id: input.id,
        },
        include: {
          employee: {
            include: {
              skills: {
                include: {
                  skill: true,
                },
              },
              languages: {
                include: {
                  language: true,
                },
              },
              location: true,
            },
          },
        },
      });

      return {
        project: {
          id: project.project_id,
          title: project.project_name,
          description: project.description || "",
          skills: project.skills.map((ps) => ({
            id: ps.skill.skill_id,
            name: ps.skill.skill_name,
            minExperienceYears: ps.min_experience_years,
          })),
          seniority: project.seniority.map((s) => ({
            level: s.seniority_level,
            requiredCount: s.required_count,
          })),
        },
        team: projectTeam
          .map((pt) => ({
            project_id: pt.project_id,
            employee_id: pt.employee_id,
            score: (pt as any).score as number | null,
            employee: {
              id: pt.employee.employee_id,
              full_name: pt.employee.full_name,
              role: pt.employee.role,
              seniority: pt.employee.seniority,
              total_experience_years: pt.employee.total_experience_years,
              location: pt.employee.location
                ? {
                    id: pt.employee.location.id,
                    name: pt.employee.location.name,
                  }
                : null,
              skills: pt.employee.skills.map((es) => ({
                skill_id: es.skill.skill_id,
                skill_name: es.skill.skill_name,
                experience_years: es.experience_years,
              })),
              languages: pt.employee.languages.map((el) => ({
                language_id: el.language.language_id,
                language_name: el.language.language_name,
              })),
            },
          }))
          .sort((a, b) => {
            // Sort by score descending (null scores go to the end)
            if (a.score === null && b.score === null) return 0;
            if (a.score === null) return 1;
            if (b.score === null) return -1;
            return b.score - a.score;
          }),
      };
    }),
  matchProjectToUsers: baseProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      // Fire and forget - don't await OpenAI call

      // (async () => {
      console.log(444, input.projectId);
      try {
      } catch (error) {
        // Log error but don't throw - this is fire and forget
        console.error("Error in matchProjectToUsers background task:", error);
      }
      // })();

      // Always return success immediately
      return { success: true };
    }),
  getQualifiedUsers: baseProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      // Get project with required skills and seniority
      const project = await prisma.project.findUnique({
        where: { project_id: input.projectId },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
          seniority: true,
          team: {
            select: {
              employee_id: true,
            },
          },
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      // Get all employees with their skills
      const employees = await prisma.employee.findMany({
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
          location: true,
          languages: {
            include: {
              language: true,
            },
          },
        },
      });

      // Filter employees who are already on the team
      const teamEmployeeIds = new Set(project.team.map((t) => t.employee_id));

      // Match employees to project requirements
      const qualifiedEmployees = employees
        .filter((employee) => !teamEmployeeIds.has(employee.employee_id))
        .map((employee) => {
          let matchScore = 0;
          let matchedSkills = 0;
          let totalRequiredSkills = project.skills.length;

          // Check if employee has required skills with enough experience
          const skillMatches = project.skills.map((projectSkill) => {
            const employeeSkill = employee.skills.find(
              (es) => es.skill_id === projectSkill.skill_id
            );

            if (
              employeeSkill &&
              employeeSkill.experience_years >=
                projectSkill.min_experience_years
            ) {
              matchedSkills++;
              matchScore += 10; // Base score for having the skill
              // Bonus for exceeding minimum experience
              const excessExperience =
                employeeSkill.experience_years -
                projectSkill.min_experience_years;
              matchScore += Math.min(excessExperience, 5); // Max 5 bonus points
              return {
                skillName: projectSkill.skill.skill_name,
                required: projectSkill.min_experience_years,
                has: employeeSkill.experience_years,
                match: true,
              };
            }

            return {
              skillName: projectSkill.skill.skill_name,
              required: projectSkill.min_experience_years,
              has: 0,
              match: false,
            };
          });

          // Check seniority match
          const seniorityMatch = project.seniority.some(
            (req) => req.seniority_level === employee.seniority
          );
          if (seniorityMatch) {
            matchScore += 5;
          }

          // Calculate match percentage
          const skillMatchPercentage =
            totalRequiredSkills > 0
              ? (matchedSkills / totalRequiredSkills) * 100
              : 0;

          return {
            employeeId: employee.employee_id,
            fullName: employee.full_name,
            role: employee.role,
            seniority: employee.seniority,
            totalExperienceYears: employee.total_experience_years,
            location: employee.location?.name,
            languages: employee.languages.map(
              (el) => el.language.language_name
            ),
            skills: employee.skills.map((es) => ({
              name: es.skill.skill_name,
              experienceYears: es.experience_years,
            })),
            matchScore,
            skillMatchPercentage,
            skillMatches,
            seniorityMatch,
            isQualified:
              matchedSkills === totalRequiredSkills && totalRequiredSkills > 0,
          };
        })
        .sort((a, b) => {
          // Sort by qualified first, then by match score
          if (a.isQualified !== b.isQualified) {
            return a.isQualified ? -1 : 1;
          }
          return b.matchScore - a.matchScore;
        });

      return qualifiedEmployees;
    }),

  // Phase 1: Alternative Team Compositions
  getAlternativeTeams: baseProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const project = await prisma.project.findUnique({
        where: { project_id: input.projectId },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      if (!project || !project.description) {
        throw new Error("Project not found or missing description");
      }

      const employees = await prisma.employee.findMany({
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      const skills = await prisma.skill.findMany();

      const alternativeTeams = await generateAlternativeTeams(
        project.description,
        employees,
        skills,
        input.projectId
      );

      // Enrich employee data with names
      const employeeMap = new Map(
        employees.map((emp) => [emp.employee_id, emp.full_name])
      );

      // Add employee names to each team's employees
      const enrichedTeams = alternativeTeams.map((team) => ({
        ...team,
        employees: team.employees.map((emp) => ({
          ...emp,
          employeeName: employeeMap.get(emp.employeeId) || `Employee #${emp.employeeId}`,
        })),
      }));

      return enrichedTeams;
    }),

  // Phase 1: Project Success Prediction
  getProjectPrediction: baseProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const project = await prisma.project.findUnique({
        where: { project_id: input.projectId },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
          seniority: true,
          team: {
            include: {
              employee: {
                include: {
                  skills: {
                    include: {
                      skill: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      const prediction = await predictProjectSuccess(
        project.description || "",
        project.team,
        {
          skills: project.skills.map((ps) => ps.skill.skill_name),
          seniority: project.seniority.map((s) => s.seniority_level),
        }
      );

      return prediction;
    }),

  // Phase 1: Skill Gap Analysis
  getSkillGaps: baseProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const project = await prisma.project.findUnique({
        where: { project_id: input.projectId },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
          team: {
            include: {
              employee: {
                include: {
                  skills: {
                    include: {
                      skill: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      const requiredSkills = project.skills.map((ps) => ({
        skill_name: ps.skill.skill_name,
        min_experience_years: ps.min_experience_years,
      }));

      const teamMembers = project.team.map((pt) => ({
        employee: {
          skills: pt.employee.skills.map((es) => ({
            skill_name: es.skill.skill_name,
            experience_years: es.experience_years,
          })),
        },
      }));

      const gaps = analyzeSkillGaps(requiredSkills, teamMembers);

      return gaps;
    }),

  // Phase 3: Multi-Project Resource Optimization
  getResourceConflicts: baseProcedure.query(async () => {
    const { findResourceConflicts } = await import(
      "@/lib/resource-optimization"
    );
    return await findResourceConflicts();
  }),

  getResourceAllocation: baseProcedure.query(async () => {
    const { getResourceAllocation } = await import(
      "@/lib/resource-optimization"
    );
    return await getResourceAllocation();
  }),

  getUnallocatedEmployees: baseProcedure.query(async () => {
    const { getUnallocatedEmployees } = await import(
      "@/lib/resource-optimization"
    );
    return await getUnallocatedEmployees();
  }),

  // Phase 3: Employee Growth Tracking
  getEmployeeGrowth: baseProcedure
    .input(z.object({ employeeId: z.number().optional() }))
    .query(async ({ input }) => {
      const { calculateEmployeeGrowth, getAllEmployeeGrowth } = await import(
        "@/lib/employee-growth"
      );
      if (input.employeeId) {
        const growth = await calculateEmployeeGrowth(input.employeeId);
        return growth ? [growth] : [];
      }
      return await getAllEmployeeGrowth();
    }),

  // Phase 3: Budget Optimization
  getTeamBudget: baseProcedure
    .input(
      z.object({
        teamMembers: z.array(
          z.object({
            employee: z.object({
              seniority: z.string().nullable().optional(),
            }),
          })
        ),
        projectDurationWeeks: z.number().default(12),
      })
    )
    .query(async ({ input }) => {
      const { calculateTeamCost, calculateROI } = await import(
        "@/lib/budget-optimization"
      );
      const cost = calculateTeamCost(
        input.teamMembers,
        input.projectDurationWeeks
      );
      const roi = calculateROI(cost.totalCost, input.projectDurationWeeks);
      return { cost, roi };
    }),

  // Save team from Interactive Team Builder
  saveProjectTeam: baseProcedure
    .input(
      z.object({
        projectId: z.number(),
        employeeIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      // First, remove all existing team members for this project
      await prisma.projectTeam.deleteMany({
        where: {
          project_id: input.projectId,
        },
      });

      // Validate employee IDs exist
      const validEmployees = await prisma.employee.findMany({
        where: {
          employee_id: {
            in: input.employeeIds,
          },
        },
        select: {
          employee_id: true,
        },
      });

      const validEmployeeIds = validEmployees.map((e) => e.employee_id);

      if (validEmployeeIds.length === 0) {
        throw new Error("No valid employees found");
      }

      // Add new team members
      const result = await prisma.projectTeam.createMany({
        data: validEmployeeIds.map((employeeId) => ({
          project_id: input.projectId,
          employee_id: employeeId,
          score: null, // No AI score for manually selected team
        })),
      });

      return {
        success: true,
        count: result.count,
      };
    }),

  // AI Suggest team members for Interactive Team Builder
  suggestTeamMembers: baseProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const project = await prisma.project.findUnique({
        where: { project_id: input.projectId },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      if (!project || !project.description) {
        throw new Error("Project not found or missing description");
      }

      const employees = await prisma.employee.findMany({
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
          projectTeams: {
            where: {
              project_id: input.projectId,
            },
          },
        },
      });

      // Filter out employees already in the team
      const availableEmployees = employees.filter(
        (emp) => emp.projectTeams.length === 0
      );

      if (availableEmployees.length === 0) {
        return [];
      }

      const skills = await prisma.skill.findMany();

      // Use AI to suggest top employees
      const { generateAlternativeTeams } = await import("@/lib/ai-enhanced");
      const suggestions = await generateAlternativeTeams(
        project.description,
        availableEmployees,
        skills,
        input.projectId
      );

      // Get the "balanced" strategy team (or first available)
      const balancedTeam =
        suggestions.find((t) => t.strategy === "balanced") || suggestions[0];

      if (!balancedTeam || balancedTeam.employees.length === 0) {
        // Fallback: return top qualified employees
        return availableEmployees.slice(0, 5).map((emp) => ({
          employeeId: emp.employee_id,
          fullName: emp.full_name,
          reason: "Top match based on skills",
        }));
      }

      // Map AI suggestions to employee details
      const suggestedEmployeeIds = balancedTeam.employees.map(
        (e) => e.employeeId
      );
      const suggestedEmployees = availableEmployees.filter((emp) =>
        suggestedEmployeeIds.includes(emp.employee_id)
      );

      return suggestedEmployees.map((emp) => {
        const aiMatch = balancedTeam.employees.find(
          (e) => e.employeeId === emp.employee_id
        );
        return {
          employeeId: emp.employee_id,
          fullName: emp.full_name,
          reason:
            aiMatch?.reason || "AI recommended based on project requirements",
          score: aiMatch?.score || 0,
        };
      });
    }),
});
