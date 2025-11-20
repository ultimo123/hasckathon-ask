import prisma from "@/lib/db";

type EmployeeMatch = {
  employeeId: number;
  score?: number;
  [key: string]: any;
};

/**
 * Updates the ProjectTeam table by adding employees to a project
 * @param projectId - The ID of the project
 * @param employees - Array of employee objects from OpenAI response (should have 'id' field)
 */
export async function updateProjectTeam(
  projectId: number,
  employees: EmployeeMatch[]
): Promise<void> {
  try {
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      console.log(
        "ℹ️ No employees provided to updateProjectTeam - will show 0 team members"
      );
      return;
    }

    // Extract employee data with IDs and scores from the OpenAI response
    const employeeIds = employees
      .map((emp) => emp.employeeId)
      .filter((id): id is number => typeof id === "number" && id > 0);

    if (employeeIds.length === 0) {
      console.log(
        "ℹ️ No valid employee IDs found in AI response - will show 0 team members"
      );
      return;
    }

    // Validate that all employee IDs actually exist in the database
    const existingEmployees = await prisma.employee.findMany({
      where: {
        employee_id: {
          in: employeeIds,
        },
      },
      select: {
        employee_id: true,
      },
    });

    const validEmployeeIds = new Set(
      existingEmployees.map((emp) => emp.employee_id)
    );

    // Filter to only valid employee IDs and map to data structure
    const validEmployeeData = employees
      .filter((emp) => validEmployeeIds.has(emp.employeeId))
      .map((emp) => ({
        employeeId: emp.employeeId,
        score: typeof emp.score === "number" ? emp.score : null,
      }));

    // Log invalid IDs for debugging
    const invalidIds = employeeIds.filter((id) => !validEmployeeIds.has(id));
    if (invalidIds.length > 0) {
      console.warn(
        `⚠️ Found ${
          invalidIds.length
        } invalid employee IDs from AI: ${invalidIds.join(", ")}`
      );
    }

    if (validEmployeeData.length === 0) {
      console.log(
        `ℹ️ No valid employees found for project ${projectId} - will show 0 team members`
      );
      return;
    }

    console.log(
      `📝 Updating ProjectTeam for project ${projectId} with ${validEmployeeData.length} valid employees`
    );

    // Create ProjectTeam records with scores (skip duplicates if they already exist)
    const result = await prisma.projectTeam.createMany({
      data: validEmployeeData.map((emp) => ({
        project_id: projectId,
        employee_id: emp.employeeId,
        score: emp.score,
      })),
      skipDuplicates: true, // Skip if the record already exists
    });

    console.log(
      `✅ Successfully added ${result.count} employees to project ${projectId}`
    );
  } catch (error) {
    console.error("❌ Error updating ProjectTeam:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      // Don't throw - gracefully handle errors so project creation succeeds
    }
  }
}
