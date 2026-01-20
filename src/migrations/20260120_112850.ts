import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'training_task_generated_for_new_roles';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "public"."audit_log" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_log_action";
  CREATE TYPE "public"."enum_audit_log_action" AS ENUM('create', 'update', 'delete', 'approval', 'flag_resolution', 'policy_acknowledgment', 'user_creation', 'password_recovery', 'password_reset', 'compliance_task_generated', 'task_escalation', 'role_request_approved', 'role_request_rejected', 'task_completed', 'training_completed', 'password_setup_completed', 'roll_call_completed', '2fa_confirmed', 'shared_password_confirmed', 'user_password_confirmed', 'roll_call_triggered', 'roll_call_auto_generated', 'roll_call_auto_generation_failed', 'roll_call_manually_generated', 'flag_resolved');
  ALTER TABLE "public"."audit_log" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_log_action" USING "action"::"public"."enum_audit_log_action";`)
}
