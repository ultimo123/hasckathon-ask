import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { updateProjectTeam } from "./project-team";

/**
 * AI Service using Vercel AI SDK
 * Supports multiple providers: Groq (free), OpenAI, etc.
 *
 * Note: If you encounter SSL certificate errors on Windows, you can:
 * 1. Run: npm run dev:insecure (development only!)
 * 2. Or add NODE_TLS_REJECT_UNAUTHORIZED=0 to your .env file
 * 3. Or update your Node.js certificates
 */
export async function callAI(prompt: string, projectId: number): Promise<void> {
  console.log("🔵 callAI called with prompt length:", prompt.length);

  try {
    // Check which provider to use (default to Groq - free tier)
    const provider = process.env.AI_PROVIDER || "groq";
    let apiKey: string | undefined;
    let model: any;
    let modelName: string;

    if (provider === "groq") {
      apiKey = process.env.GROQ_API_KEY;
      modelName = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
      // Configure Groq provider - API key is read from GROQ_API_KEY env var automatically
      model = groq(modelName);
    } else if (provider === "openai") {
      apiKey = process.env.OPENAI_API_KEY;
      modelName = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
      // Configure OpenAI provider - API key is read from OPENAI_API_KEY env var automatically
      model = openai(modelName);
    } else {
      console.error("❌ Unsupported provider:", provider);
      console.error("💡 Supported providers: 'groq' (free) or 'openai'");
      return;
    }

    if (!apiKey) {
      console.error(
        `❌ ${provider.toUpperCase()}_API_KEY is not set in environment variables`
      );
      console.error("💡 Get a free API key:");
      if (provider === "groq") {
        console.error("   - Visit https://console.groq.com/keys");
        console.error("   - Sign up for free (no credit card required)");
        console.error("   - Create an API key");
        console.error("   - Add GROQ_API_KEY to your .env file");
      } else {
        console.error("   - Visit https://platform.openai.com/api-keys");
        console.error("   - Add OPENAI_API_KEY to your .env file");
      }
      return;
    }

    console.log(`✅ Using ${provider.toUpperCase()} provider`);
    console.log("📝 Using model:", modelName);

    const { text } = await generateText({
      model,
      system:
        "You are an expert at matching employees to projects based on their skills, experience, and project requirements. Return the response as a JSON array of employee objects, each with an 'employeeId' and 'score' field.",
      prompt,
      temperature: 0.7,
    });

    console.log("✅ AI API call successful!");
    console.log("💬 Response content preview:", text.substring(0, 200));

    // Remove markdown code block markers (```json and ```)
    let content = text.trim();
    content = content.replace(/^```json\s*/i, ""); // Remove opening ```json
    content = content.replace(/^```\s*/i, ""); // Remove opening ``` if no json
    content = content.replace(/\s*```$/i, ""); // Remove closing ```
    content = content.trim();

    // Try to parse JSON, handling incomplete/malformed responses
    let parsedData: any[];
    try {
      parsedData = JSON.parse(content);
    } catch (parseError: any) {
      console.warn(
        "⚠️ JSON parse error, attempting to extract valid JSON objects..."
      );

      // Try to extract complete JSON objects by finding balanced braces
      const jsonObjects: any[] = [];
      let startIdx = content.indexOf("[");
      if (startIdx === -1) {
        startIdx = 0;
      } else {
        startIdx += 1; // Skip the opening bracket
      }

      let i = startIdx;
      while (i < content.length) {
        // Find the start of an object
        if (content[i] === "{") {
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;
          let objStart = i;

          // Find the matching closing brace
          for (let j = i; j < content.length; j++) {
            const char = content[j];

            if (escapeNext) {
              escapeNext = false;
              continue;
            }

            if (char === "\\") {
              escapeNext = true;
              continue;
            }

            if (char === '"' && !escapeNext) {
              inString = !inString;
              continue;
            }

            if (!inString) {
              if (char === "{") {
                braceCount++;
              } else if (char === "}") {
                braceCount--;
                if (braceCount === 0) {
                  // Found complete object
                  try {
                    const objStr = content.substring(objStart, j + 1);
                    const obj = JSON.parse(objStr);
                    if (obj.employeeId && typeof obj.employeeId === "number") {
                      jsonObjects.push(obj);
                    }
                  } catch (e) {
                    // Skip invalid object
                  }
                  i = j + 1;
                  break;
                }
              }
            }
          }
        }
        i++;
      }

      if (jsonObjects.length > 0) {
        console.log(
          `✅ Extracted ${jsonObjects.length} valid employee objects from incomplete JSON`
        );
        parsedData = jsonObjects;
      } else {
        console.error(
          "❌ Could not extract any valid JSON objects from AI response"
        );
        console.error("   Response may be too truncated or malformed");
        throw parseError;
      }
    }

    if (!Array.isArray(parsedData)) {
      console.error("❌ AI response is not an array");
      return;
    }

    console.log(
      `📊 Parsed ${parsedData.length} employee matches from AI response`
    );

    // Update ProjectTeam with matched employees
    await updateProjectTeam(projectId, parsedData);
  } catch (error: any) {
    // Log error but don't throw - this is fire and forget
    console.error("❌ AI API call failed for project:", projectId);

    if (error?.status === 429) {
      console.error(
        "🚫 API Quota Exceeded - Please check your API provider billing and plan"
      );
      console.error(
        "The project was created successfully, but AI matching could not be completed."
      );
      console.error(
        "💡 For Groq: Visit https://console.groq.com/ to check your usage"
      );
    } else if (error?.status === 401) {
      console.error(
        "🔑 API Key Invalid - Please check your API key environment variable"
      );
      console.error("💡 For Groq: Set GROQ_API_KEY in your .env file");
    } else if (error?.status === 500 || error?.status >= 500) {
      console.error(
        "⚠️ API Server Error - The service may be temporarily unavailable"
      );
    } else if (
      error?.message?.includes("decommissioned") ||
      error?.message?.includes("no longer supported")
    ) {
      console.error("⚠️ Model Deprecated - The model has been decommissioned");
      console.error(
        "💡 Solution: Update GROQ_MODEL in your .env file to a current model:"
      );
      console.error("   - llama-3.1-8b-instant (fast, default)");
      console.error("   - llama-3.3-70b-versatile (more powerful)");
      console.error("   - mixtral-8x7b-32768 (longer contexts)");
    } else if (
      error?.message?.includes("JSON") ||
      error?.message?.includes("Unexpected") ||
      error?.message?.includes("parse") ||
      error?.message?.includes("position")
    ) {
      console.error(
        "⚠️ JSON Parsing Error - AI response may be incomplete or malformed"
      );
      console.error("💡 The AI response was truncated or invalid JSON");
      console.error(
        "   This is usually due to response length limits or model issues"
      );
      console.error(
        "   The project was created successfully, but no team members were matched"
      );
      console.error("   You can manually assign team members or try again");
    } else if (
      error?.message?.includes("certificate") ||
      error?.message?.includes("SSL") ||
      error?.message?.includes("unable to get local issuer certificate")
    ) {
      console.error("🔒 SSL Certificate Error - Cannot verify SSL certificate");
      console.error("💡 Quick Fix (Development Only):");
      console.error(
        "   Add this to your .env file: NODE_TLS_REJECT_UNAUTHORIZED=0"
      );
      console.error(
        "   ⚠️  WARNING: This disables SSL verification - ONLY use in development!"
      );
      console.error("");
      console.error("💡 Proper Solutions:");
      console.error(
        "   1. Update Node.js: Download latest from https://nodejs.org/"
      );
      console.error(
        "   2. Update certificates: npm install -g update-ca-certificates (if available)"
      );
      console.error("   3. Check corporate proxy/firewall settings");
      console.error("   4. Install Windows root certificates");
    } else {
      console.error("❌ AI API Error:", error?.message || "Unknown error");
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
