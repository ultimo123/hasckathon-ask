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
      console.error("No employees provided to updateProjectTeam");
      return;
    }

    // Extract employee data with IDs and scores from the OpenAI response
    const employeeData = employees
      .map((emp) => ({
        employeeId: emp.employeeId,
        score: typeof emp.score === "number" ? emp.score : null,
      }))
      .filter(
        (emp): emp is { employeeId: number; score: number | null } =>
          typeof emp.employeeId === "number" && emp.employeeId > 0
      );

    if (employeeData.length === 0) {
      console.error("No valid employee IDs found in OpenAI response");
      return;
    }

    console.log(
      `📝 Updating ProjectTeam for project ${projectId} with ${employeeData.length} employees`
    );

    // Create ProjectTeam records with scores (skip duplicates if they already exist)
    const result = await prisma.projectTeam.createMany({
      data: employeeData.map((emp) => ({
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
    }
  }
}
