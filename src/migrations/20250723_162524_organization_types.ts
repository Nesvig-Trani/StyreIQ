import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "public"."organization" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_organization_type";
  CREATE TYPE "public"."enum_organization_type" AS ENUM('higher_education_institution', 'government_agency', 'healthcare_system', 'corporate_enterprise', 'nonprofit_organization', 'division', 'school_faculty', 'department', 'office', 'program', 'initiative', 'other');
  ALTER TABLE "public"."organization" ALTER COLUMN "type" SET DATA TYPE "public"."enum_organization_type" USING "type"::"public"."enum_organization_type";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "public"."organization" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_organization_type";
  CREATE TYPE "public"."enum_organization_type" AS ENUM('university', 'faculty', 'department', 'office', 'project');
  ALTER TABLE "public"."organization" ALTER COLUMN "type" SET DATA TYPE "public"."enum_organization_type" USING "type"::"public"."enum_organization_type";`)
}
