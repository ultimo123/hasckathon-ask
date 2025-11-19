import { Employee, Skill } from "@/generated/prisma";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function constructPrompt(
  projectDescription: string,
  profiles: Employee[],
  skills: Skill[]
) {
  let prompt = ``;

  if (skills.length > 0) {
    prompt += `
      # The available skills are: ${skills
        .map((skill) => skill.skill_name)
        .join(", ")}
    `;
  }

  if (projectDescription) {
    prompt += `
      # The project description is: ${projectDescription} .
    `;
  }

  if (profiles.length > 0) {
    prompt += `
      # The profiles are: ${createJsonProfile(profiles)}
    `;
  }

  prompt += `Rank and suggest the best fit profiles for the project. Assign a score/percentage for each profile match. In the response include employeeId, employeeName and score/percentage and make sure its a json array of objects. Response should include only the json array of objects nothing else, in order to be able to parse it.`;
  console.log(111, "prompt ready");
  return prompt;
}

function createJsonProfile(employees: Employee[]) {
  const profiles = employees.map((employee) => {
    const skills =
      (employee as any).skills
        ?.map((s: any) => s?.skill?.skill_name)
        ?.filter((skillName: string | undefined) => skillName)
        ?.join(", ") || "";

    return {
      id: employee.employee_id,
      fullname: employee.full_name,
      skills,
      role: employee.role || null,
      seniority: employee.seniority || null,
      total_experience_years: employee.total_experience_years || null,
    };
  });

  return JSON.stringify(profiles, null, 2);
}
