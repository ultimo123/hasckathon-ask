-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "employee_id" SERIAL NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255),
    "location_id" INTEGER,
    "seniority" VARCHAR(50),
    "total_experience_years" INTEGER,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "skill_id" SERIAL NOT NULL,
    "skill_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("skill_id")
);

-- CreateTable
CREATE TABLE "EmployeeSkill" (
    "employee_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "experience_years" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmployeeSkill_pkey" PRIMARY KEY ("employee_id","skill_id")
);

-- CreateTable
CREATE TABLE "Language" (
    "language_id" SERIAL NOT NULL,
    "language_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("language_id")
);

-- CreateTable
CREATE TABLE "EmployeeLanguage" (
    "employee_id" INTEGER NOT NULL,
    "language_id" INTEGER NOT NULL,

    CONSTRAINT "EmployeeLanguage_pkey" PRIMARY KEY ("employee_id","language_id")
);

-- CreateTable
CREATE TABLE "Project" (
    "project_id" SERIAL NOT NULL,
    "project_name" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "ProjectSkill" (
    "project_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "min_experience_years" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectSkill_pkey" PRIMARY KEY ("project_id","skill_id")
);

-- CreateTable
CREATE TABLE "ProjectSeniority" (
    "project_id" INTEGER NOT NULL,
    "seniority_level" VARCHAR(50) NOT NULL,
    "required_count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProjectSeniority_pkey" PRIMARY KEY ("project_id","seniority_level")
);

-- CreateTable
CREATE TABLE "ProjectTeam" (
    "project_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,

    CONSTRAINT "ProjectTeam_pkey" PRIMARY KEY ("project_id","employee_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_skill_name_key" ON "Skill"("skill_name");

-- CreateIndex
CREATE INDEX "EmployeeSkill_employee_id_idx" ON "EmployeeSkill"("employee_id");

-- CreateIndex
CREATE INDEX "EmployeeSkill_skill_id_idx" ON "EmployeeSkill"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "Language_language_name_key" ON "Language"("language_name");

-- CreateIndex
CREATE INDEX "EmployeeLanguage_employee_id_idx" ON "EmployeeLanguage"("employee_id");

-- CreateIndex
CREATE INDEX "EmployeeLanguage_language_id_idx" ON "EmployeeLanguage"("language_id");

-- CreateIndex
CREATE INDEX "ProjectSkill_project_id_idx" ON "ProjectSkill"("project_id");

-- CreateIndex
CREATE INDEX "ProjectSkill_skill_id_idx" ON "ProjectSkill"("skill_id");

-- CreateIndex
CREATE INDEX "ProjectSeniority_project_id_idx" ON "ProjectSeniority"("project_id");

-- CreateIndex
CREATE INDEX "ProjectTeam_project_id_idx" ON "ProjectTeam"("project_id");

-- CreateIndex
CREATE INDEX "ProjectTeam_employee_id_idx" ON "ProjectTeam"("employee_id");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkill" ADD CONSTRAINT "EmployeeSkill_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkill" ADD CONSTRAINT "EmployeeSkill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("skill_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLanguage" ADD CONSTRAINT "EmployeeLanguage_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLanguage" ADD CONSTRAINT "EmployeeLanguage_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "Language"("language_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSkill" ADD CONSTRAINT "ProjectSkill_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSkill" ADD CONSTRAINT "ProjectSkill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("skill_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSeniority" ADD CONSTRAINT "ProjectSeniority_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTeam" ADD CONSTRAINT "ProjectTeam_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTeam" ADD CONSTRAINT "ProjectTeam_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;
