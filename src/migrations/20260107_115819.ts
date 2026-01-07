import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_audit_log_action" ADD VALUE '2fa_confirmed';
  ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'shared_password_confirmed';
  ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'user_password_confirmed';
  ALTER TYPE "public"."enum_compliance_tasks_type" ADD VALUE 'CONFIRM_USER_PASSWORD' BEFORE 'POLICY_ACKNOWLEDGMENT';
  ALTER TYPE "public"."enum_compliance_tasks_type" ADD VALUE 'CONFIRM_SHARED_PASSWORD' BEFORE 'POLICY_ACKNOWLEDGMENT';
  ALTER TYPE "public"."enum_compliance_tasks_type" ADD VALUE 'CONFIRM_2FA' BEFORE 'POLICY_ACKNOWLEDGMENT';
  ALTER TABLE "social_medias" ADD COLUMN "is_shared_credential" boolean DEFAULT false;
  ALTER TABLE "tenants" ADD COLUMN "governance_settings_user_password_cadence_days" numeric DEFAULT 180;
  ALTER TABLE "tenants" ADD COLUMN "governance_settings_shared_password_cadence_days" numeric DEFAULT 180;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "is_shared_credential";
  ALTER TABLE "tenants" DROP COLUMN IF EXISTS "governance_settings_user_password_cadence_days";
  ALTER TABLE "tenants" DROP COLUMN IF EXISTS "governance_settings_shared_password_cadence_days";
  ALTER TABLE "public"."audit_log" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_log_action";
  CREATE TYPE "public"."enum_audit_log_action" AS ENUM('create', 'update', 'delete', 'approval', 'flag_resolution', 'policy_acknowledgment', 'user_creation', 'password_recovery', 'password_reset', 'compliance_task_generated', 'task_escalation', 'role_request_approved', 'role_request_rejected', 'task_completed', 'training_completed', 'password_setup_completed', 'roll_call_completed');
  ALTER TABLE "public"."audit_log" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_log_action" USING "action"::"public"."enum_audit_log_action";
  ALTER TABLE "public"."compliance_tasks" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_compliance_tasks_type";
  CREATE TYPE "public"."enum_compliance_tasks_type" AS ENUM('PASSWORD_SETUP', 'POLICY_ACKNOWLEDGMENT', 'TRAINING_COMPLETION', 'USER_ROLL_CALL');
  ALTER TABLE "public"."compliance_tasks" ALTER COLUMN "type" SET DATA TYPE "public"."enum_compliance_tasks_type" USING "type"::"public"."enum_compliance_tasks_type";`)
}
