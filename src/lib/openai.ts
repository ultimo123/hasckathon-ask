import OpenAI from "openai";
import { updateProjectTeam } from "./project-team";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set in environment variables");
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey,
    });
  }
  return openaiClient;
}

export async function callOpenAI(
  prompt: string,
  projectId: number
): Promise<void> {
  console.log("🔵 callOpenAI called with prompt length:", prompt.length);

  try {
    const client = getOpenAIClient();
    if (!client) {
      console.error("❌ OpenAI client not available - skipping API call");
      console.error("Check if OPENAI_API_KEY is set in environment variables");
      return;
    }

    console.log("✅ OpenAI client created, making API call...");
    // Default to gpt-3.5-turbo which is cheaper and has better quota availability
    const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
    console.log("📝 Using model:", model);

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert at matching employees to projects based on their skills, experience, and project requirements.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    console.log("✅ OpenAI API call successful!");
    console.log("📊 Response:", {
      model: response.model,
      usage: response.usage,
      choicesCount: response.choices.length,
    });

    if (response.choices[0]?.message?.content) {
      console.log(
        "💬 Response content preview:",
        response.choices[0].message.content
      );

      // Remove markdown code block markers (```json and ```)
      let content = response.choices[0].message.content.trim();
      content = content.replace(/^```json\s*/i, ""); // Remove opening ```json
      content = content.replace(/^```\s*/i, ""); // Remove opening ``` if no json
      content = content.replace(/\s*```$/i, ""); // Remove closing ```
      content = content.trim();

      const parsedData = JSON.parse(content);
      console.log(111, "Parsed JSON", parsedData);

      // Update ProjectTeam with matched employees
      await updateProjectTeam(projectId, parsedData);
    }
  } catch (error: any) {
    // Log error but don't throw - this is fire and forget
    console.error("❌ OpenAI API call failed for project:", projectId);

    if (error?.status === 429) {
      console.error(
        "🚫 OpenAI Quota Exceeded - Please check your OpenAI billing and plan"
      );
      console.error(
        "The project was created successfully, but AI matching could not be completed."
      );
      console.error(
        "You can manually assign team members or update your OpenAI quota."
      );
    } else if (error?.status === 401) {
      console.error(
        "🔑 OpenAI API Key Invalid - Please check your OPENAI_API_KEY environment variable"
      );
    } else if (error?.status === 500 || error?.status >= 500) {
      console.error(
        "⚠️ OpenAI Server Error - The service may be temporarily unavailable"
      );
    } else {
      console.error("❌ OpenAI API Error:", error?.message || "Unknown error");
    }

    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        status: (error as any)?.status,
        code: (error as any)?.code,
      });
    }

    // Don't throw - let the project creation succeed even if AI matching fails
  }
}
