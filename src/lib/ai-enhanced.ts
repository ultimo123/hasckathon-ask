import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";

/**
 * Enhanced AI Service for Hackathon Features
 * Supports multiple team compositions, success prediction, and skill gap analysis
 */

type TeamStrategy = "fast" | "balanced" | "experienced";

type AlternativeTeam = {
  strategy: TeamStrategy;
  strategyName: string;
  description: string;
  employees: Array<{
    employeeId: number;
    score: number;
    reason?: string;
  }>;
  estimatedCompletionWeeks?: number;
  successProbability?: number;
};

type ProjectPrediction = {
  successProbability: number; // 0-100
  estimatedCompletionWeeks: number;
  riskFactors: string[];
  strengths: string[];
  recommendations: string[];
};

/**
 * Get AI provider and model
 */
function getAIModel() {
  const provider = process.env.AI_PROVIDER || "groq";
  let apiKey: string | undefined;
  let model: any;
  let modelName: string;

  if (provider === "groq") {
    apiKey = process.env.GROQ_API_KEY;
    modelName = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    model = groq(modelName);
  } else if (provider === "openai") {
    apiKey = process.env.OPENAI_API_KEY;
    modelName = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
    model = openai(modelName);
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  if (!apiKey) {
    throw new Error(`${provider.toUpperCase()}_API_KEY is not set`);
  }

  return { model, modelName, provider };
}

/**
 * Generate alternative team compositions with different strategies
 */
export async function generateAlternativeTeams(
  projectDescription: string,
  employees: any[],
  skills: any[],
  projectId: number
): Promise<AlternativeTeam[]> {
  try {
    const { model } = getAIModel();

    const employeeProfiles = employees.map((emp) => ({
      id: emp.employee_id,
      name: emp.full_name,
      skills:
        emp.skills?.map((s: any) => s?.skill?.skill_name).join(", ") || "",
      seniority: emp.seniority || "Mid",
      experienceYears: emp.total_experience_years || 0,
    }));

    const prompt = `You are an expert at building project teams. For this project:

Project Description: ${projectDescription}

Available Employees:
${JSON.stringify(employeeProfiles, null, 2)}

Available Skills: ${skills.map((s) => s.skill_name).join(", ")}

Generate THREE different team compositions with different strategies:

1. "fast" strategy: Prioritize speed and agility (more junior developers, faster delivery)
2. "balanced" strategy: Mix of experience levels for optimal balance
3. "experienced" strategy: Senior-heavy team for high quality and reliability

For each strategy, return:
- strategy: "fast" | "balanced" | "experienced"
- strategyName: Human-readable name
- description: Brief explanation of why this team composition
- employees: Array of {employeeId, score (0-100), reason}
- estimatedCompletionWeeks: Rough estimate
- successProbability: 0-100

Return ONLY a JSON array with 3 objects, one for each strategy. Format:
[
  {
    "strategy": "fast",
    "strategyName": "Fast Delivery Team",
    "description": "...",
    "employees": [...],
    "estimatedCompletionWeeks": 8,
    "successProbability": 75
  },
  ...
]`;

    const { text } = await generateText({
      model,
      system:
        "You are an expert at building project teams. Return only valid JSON arrays, no markdown.",
      prompt,
      temperature: 0.8,
    });

    // Parse response
    let content = text.trim();
    content = content.replace(/^```json\s*/i, "");
    content = content.replace(/^```\s*/i, "");
    content = content.replace(/\s*```$/i, "");
    content = content.trim();

    let parsed: AlternativeTeam[];
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Fallback: extract JSON objects
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse alternative teams response");
      }
    }

    // Validate and ensure we have 3 strategies
    const strategies: AlternativeTeam[] = [];
    const seen = new Set<TeamStrategy>();

    for (const team of parsed) {
      if (
        team.strategy &&
        ["fast", "balanced", "experienced"].includes(team.strategy)
      ) {
        if (!seen.has(team.strategy)) {
          strategies.push({
            strategy: team.strategy,
            strategyName: team.strategyName || `${team.strategy} team`,
            description: team.description || "",
            employees: team.employees || [],
            estimatedCompletionWeeks: team.estimatedCompletionWeeks || 12,
            successProbability: team.successProbability || 70,
          });
          seen.add(team.strategy);
        }
      }
    }

    // Ensure we have all 3 strategies (fill missing ones with default)
    const required: TeamStrategy[] = ["fast", "balanced", "experienced"];
    for (const req of required) {
      if (!seen.has(req)) {
        strategies.push({
          strategy: req,
          strategyName: `${req.charAt(0).toUpperCase() + req.slice(1)} Team`,
          description: `A ${req} team composition`,
          employees: [],
          estimatedCompletionWeeks: 12,
          successProbability: 70,
        });
      }
    }

    return strategies.slice(0, 3);
  } catch (error) {
    console.error("❌ Error generating alternative teams:", error);
    // Return default teams
    return [
      {
        strategy: "fast",
        strategyName: "Fast Delivery Team",
        description: "Optimized for speed with agile developers",
        employees: [],
        estimatedCompletionWeeks: 8,
        successProbability: 70,
      },
      {
        strategy: "balanced",
        strategyName: "Balanced Team",
        description: "Mix of experience levels for optimal results",
        employees: [],
        estimatedCompletionWeeks: 10,
        successProbability: 80,
      },
      {
        strategy: "experienced",
        strategyName: "Experienced Team",
        description: "Senior-heavy team for high quality",
        employees: [],
        estimatedCompletionWeeks: 12,
        successProbability: 85,
      },
    ];
  }
}

/**
 * Predict project success based on team composition and requirements
 */
export async function predictProjectSuccess(
  projectDescription: string,
  teamMembers: any[],
  projectRequirements: {
    skills: string[];
    seniority: string[];
  }
): Promise<ProjectPrediction> {
  try {
    const { model } = getAIModel();

    const teamSummary = teamMembers.map((m) => ({
      name: m.employee?.full_name || "Unknown",
      skills:
        m.employee?.skills?.map((s: any) => s.skill_name).join(", ") || "",
      seniority: m.employee?.seniority || "Mid",
      experienceYears: m.employee?.total_experience_years || 0,
      matchScore: m.score || 0,
    }));

    const prompt = `Analyze this project and team composition:

Project: ${projectDescription}
Required Skills: ${projectRequirements.skills.join(", ")}
Required Seniority: ${projectRequirements.seniority.join(", ")}

Current Team:
${JSON.stringify(teamSummary, null, 2)}

Provide a project success prediction with:
- successProbability: 0-100 (how likely to succeed)
- estimatedCompletionWeeks: rough estimate
- riskFactors: array of potential risks (max 5)
- strengths: array of team strengths (max 5)
- recommendations: array of actionable recommendations (max 5)

Return ONLY valid JSON:
{
  "successProbability": 85,
  "estimatedCompletionWeeks": 10,
  "riskFactors": [...],
  "strengths": [...],
  "recommendations": [...]
}`;

    const { text } = await generateText({
      model,
      system:
        "You are a project management expert. Return only valid JSON, no markdown.",
      prompt,
      temperature: 0.7,
    });

    let content = text.trim();
    content = content.replace(/^```json\s*/i, "");
    content = content.replace(/^```\s*/i, "");
    content = content.replace(/\s*```$/i, "");
    content = content.trim();

    let parsed: ProjectPrediction;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse prediction");
      }
    }

    return {
      successProbability: Math.max(
        0,
        Math.min(100, parsed.successProbability || 70)
      ),
      estimatedCompletionWeeks: parsed.estimatedCompletionWeeks || 12,
      riskFactors: Array.isArray(parsed.riskFactors)
        ? parsed.riskFactors.slice(0, 5)
        : [],
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.slice(0, 5)
        : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.slice(0, 5)
        : [],
    };
  } catch (error) {
    console.error("❌ Error predicting project success:", error);
    // Return default prediction
    return {
      successProbability: 70,
      estimatedCompletionWeeks: 12,
      riskFactors: ["Unable to analyze - AI service unavailable"],
      strengths: ["Team composition available"],
      recommendations: ["Review team composition manually"],
    };
  }
}

/**
 * Analyze skill gaps in the current team
 */
export function analyzeSkillGaps(
  requiredSkills: Array<{ skill_name: string; min_experience_years: number }>,
  teamMembers: Array<{
    employee: {
      skills: Array<{
        skill_name: string;
        experience_years: number;
      }>;
    };
  }>
): {
  missingSkills: Array<{
    skill: string;
    minExperience: number;
    recommendation: string;
  }>;
  weakSkills: Array<{
    skill: string;
    currentMaxExperience: number;
    required: number;
    recommendation: string;
  }>;
  coveredSkills: Array<{ skill: string; maxExperience: number }>;
} {
  const missingSkills: Array<{
    skill: string;
    minExperience: number;
    recommendation: string;
  }> = [];
  const weakSkills: Array<{
    skill: string;
    currentMaxExperience: number;
    required: number;
    recommendation: string;
  }> = [];
  const coveredSkills: Array<{ skill: string; maxExperience: number }> = [];

  // Collect all team skills with max experience
  const teamSkillMap = new Map<string, number>();
  for (const member of teamMembers) {
    for (const skill of member.employee.skills || []) {
      const current = teamSkillMap.get(skill.skill_name) || 0;
      teamSkillMap.set(
        skill.skill_name,
        Math.max(current, skill.experience_years)
      );
    }
  }

  // Analyze each required skill
  for (const required of requiredSkills) {
    const teamExperience = teamSkillMap.get(required.skill_name) || 0;

    if (teamExperience === 0) {
      // Skill is completely missing
      missingSkills.push({
        skill: required.skill_name,
        minExperience: required.min_experience_years,
        recommendation: `Add a team member with ${required.min_experience_years}+ years of ${required.skill_name} experience, or provide training to existing team members.`,
      });
    } else if (teamExperience < required.min_experience_years) {
      // Skill exists but experience is insufficient
      weakSkills.push({
        skill: required.skill_name,
        currentMaxExperience: teamExperience,
        required: required.min_experience_years,
        recommendation: `Current team has ${teamExperience} years of ${required.skill_name} experience, but ${required.min_experience_years} years are required. Consider adding a more experienced developer or upskilling.`,
      });
    } else {
      // Skill is covered
      coveredSkills.push({
        skill: required.skill_name,
        maxExperience: teamExperience,
      });
    }
  }

  return { missingSkills, weakSkills, coveredSkills };
}

/**
 * Calculate team chemistry score based on compatibility factors
 */
export function calculateTeamChemistry(
  teamMembers: Array<{
    employee: {
      seniority?: string | null;
      skills: Array<{ skill_name: string; experience_years: number }>;
      location?: { name: string } | null;
      languages: Array<{ language_name: string }>;
    };
  }>
): {
  overallScore: number; // 0-100
  factors: {
    seniorityBalance: { score: number; note: string };
    skillDiversity: { score: number; note: string };
    locationCompatibility: { score: number; note: string };
    languageOverlap: { score: number; note: string };
  };
  recommendations: string[];
} {
  if (teamMembers.length === 0) {
    return {
      overallScore: 0,
      factors: {
        seniorityBalance: { score: 0, note: "No team members" },
        skillDiversity: { score: 0, note: "No team members" },
        locationCompatibility: { score: 0, note: "No team members" },
        languageOverlap: { score: 0, note: "No team members" },
      },
      recommendations: [],
    };
  }

  // Seniority Balance
  const seniorityCounts: Record<string, number> = {};
  teamMembers.forEach((m) => {
    const seniority = m.employee.seniority || "Unknown";
    seniorityCounts[seniority] = (seniorityCounts[seniority] || 0) + 1;
  });
  const seniorityLevels = Object.keys(seniorityCounts).length;
  const seniorityBalanceScore = Math.min(100, seniorityLevels * 25); // More diversity = better
  const seniorityNote =
    seniorityLevels >= 2
      ? "Good mix of experience levels"
      : "Consider adding more diverse seniority levels";

  // Skill Diversity
  const allSkills = new Set<string>();
  teamMembers.forEach((m) => {
    m.employee.skills.forEach((s) => allSkills.add(s.skill_name));
  });
  const skillDiversityScore = Math.min(
    100,
    (allSkills.size / teamMembers.length) * 30
  );
  const skillNote =
    allSkills.size > teamMembers.length
      ? "Good skill diversity"
      : "Some team members may have overlapping skills";

  // Location Compatibility
  const locations = new Set<string>();
  teamMembers.forEach((m) => {
    if (m.employee.location) {
      locations.add(m.employee.location.name);
    }
  });
  const locationScore =
    locations.size === 1 ? 100 : Math.max(50, 100 - (locations.size - 1) * 20);
  const locationNote =
    locations.size === 1
      ? "All team members in same location"
      : `${locations.size} different locations - may need coordination`;

  // Language Overlap
  const allLanguages = new Set<string>();
  teamMembers.forEach((m) => {
    m.employee.languages.forEach((l) => allLanguages.add(l.language_name));
  });
  const commonLanguages = Array.from(allLanguages).filter((lang) =>
    teamMembers.every((m) =>
      m.employee.languages.some((l) => l.language_name === lang)
    )
  );
  const languageScore = commonLanguages.length > 0 ? 100 : 70;
  const languageNote =
    commonLanguages.length > 0
      ? `Common language: ${commonLanguages.join(", ")}`
      : "No common language - may need translation support";

  // Overall score (weighted average)
  const overallScore = Math.round(
    seniorityBalanceScore * 0.3 +
      skillDiversityScore * 0.3 +
      locationScore * 0.2 +
      languageScore * 0.2
  );

  // Recommendations
  const recommendations: string[] = [];
  if (seniorityLevels < 2) {
    recommendations.push(
      "Add team members with different seniority levels for better balance"
    );
  }
  if (allSkills.size <= teamMembers.length) {
    recommendations.push(
      "Consider adding team members with complementary skills"
    );
  }
  if (locations.size > 1) {
    recommendations.push("Ensure timezone coordination for distributed team");
  }
  if (commonLanguages.length === 0) {
    recommendations.push(
      "Establish a common communication language for the team"
    );
  }

  return {
    overallScore,
    factors: {
      seniorityBalance: { score: seniorityBalanceScore, note: seniorityNote },
      skillDiversity: { score: skillDiversityScore, note: skillNote },
      locationCompatibility: { score: locationScore, note: locationNote },
      languageOverlap: { score: languageScore, note: languageNote },
    },
    recommendations,
  };
}
