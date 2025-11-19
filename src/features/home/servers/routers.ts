import { baseProcedure } from "@/trpc/init";
import { createTRPCRouter } from "@/trpc/init";
import prisma from "@/lib/db";
import { z } from "zod";
import { constructPrompt } from "@/lib/utils";
import { callOpenAI } from "@/lib/openai";

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

          // Fire and forget OpenAI call
          callOpenAI(prompt, project.project_id).catch((error) => {
            console.error("❌ Error in OpenAI call:", error);
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
});
