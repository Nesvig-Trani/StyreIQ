import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`

  DO $$ BEGIN
    ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'flag_resolved';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  DO $$ BEGIN
    ALTER TYPE "public"."enum_compliance_tasks_type" ADD VALUE 'REVIEW_FLAG';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  DO $$ BEGIN
    ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'createRollCallTasks';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  DO $$ BEGIN
    ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'createRollCallTasks';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  ALTER TABLE "flags" ALTER COLUMN "flag_type" SET NOT NULL;
  ALTER TABLE "flags" ALTER COLUMN "detection_date" SET NOT NULL;
  ALTER TABLE "flags" ALTER COLUMN "source" SET NOT NULL;
  ALTER TABLE "flags" ALTER COLUMN "last_activity" SET NOT NULL;
  ALTER TABLE "flags" ALTER COLUMN "description" SET NOT NULL;
  ALTER TABLE "flags" ALTER COLUMN "suggested_action" SET NOT NULL;

  ALTER TABLE "flag_history" ALTER COLUMN "flag_id" SET NOT NULL;
  ALTER TABLE "flag_history" ALTER COLUMN "action" SET NOT NULL;

  ALTER TABLE "flag_comments" ALTER COLUMN "flag_id" SET NOT NULL;
  ALTER TABLE "flag_comments" ALTER COLUMN "user_id" SET NOT NULL;
  ALTER TABLE "flag_comments" ALTER COLUMN "comment" SET NOT NULL;

  ALTER TABLE "flags" ADD COLUMN IF NOT EXISTS "assigned_to_id" integer;
  ALTER TABLE "flags" ADD COLUMN IF NOT EXISTS "due_date" timestamp(3) with time zone;
  ALTER TABLE "flags" ADD COLUMN IF NOT EXISTS "created_by_id" integer;
  ALTER TABLE "compliance_tasks" ADD COLUMN IF NOT EXISTS "related_flag_id" integer;

  DO $$ BEGIN
    ALTER TABLE "flags"
      ADD CONSTRAINT "flags_assigned_to_id_users_id_fk"
      FOREIGN KEY ("assigned_to_id")
      REFERENCES "public"."users"("id")
      ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "flags"
      ADD CONSTRAINT "flags_created_by_id_users_id_fk"
      FOREIGN KEY ("created_by_id")
      REFERENCES "public"."users"("id")
      ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "compliance_tasks"
      ADD CONSTRAINT "compliance_tasks_related_flag_id_flags_id_fk"
      FOREIGN KEY ("related_flag_id")
      REFERENCES "public"."flags"("id")
      ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;

  CREATE INDEX IF NOT EXISTS "flags_assigned_to_idx" ON "flags" ("assigned_to_id");
  CREATE INDEX IF NOT EXISTS "flags_created_by_idx" ON "flags" ("created_by_id");
  CREATE INDEX IF NOT EXISTS "compliance_tasks_related_flag_idx" ON "compliance_tasks" ("related_flag_id");

  ALTER TABLE "flags" ALTER COLUMN "status" DROP DEFAULT;
  ALTER TABLE "flags" ALTER COLUMN "status" SET DATA TYPE text USING "status"::text;

  DROP TYPE "public"."enum_flags_status";
  CREATE TYPE "public"."enum_flags_status" AS ENUM ('pending', 'in_progress', 'resolved');

  ALTER TABLE "flags"
    ALTER COLUMN "status"
    SET DATA TYPE "public"."enum_flags_status"
    USING "status"::"public"."enum_flags_status";

  ALTER TABLE "flags" ALTER COLUMN "status" SET DEFAULT 'pending';
  ALTER TABLE "flags" ALTER COLUMN "status" SET NOT NULL;

  ALTER TABLE "flag_history" ALTER COLUMN "prev_status" SET DATA TYPE text USING "prev_status"::text;
  DROP TYPE "public"."enum_flag_history_prev_status";
  CREATE TYPE "public"."enum_flag_history_prev_status" AS ENUM ('pending', 'in_progress', 'resolved');
  ALTER TABLE "flag_history"
    ALTER COLUMN "prev_status"
    SET DATA TYPE "public"."enum_flag_history_prev_status"
    USING "prev_status"::"public"."enum_flag_history_prev_status";

  ALTER TABLE "flag_history" ALTER COLUMN "new_status" SET DATA TYPE text USING "new_status"::text;
  DROP TYPE "public"."enum_flag_history_new_status";
  CREATE TYPE "public"."enum_flag_history_new_status" AS ENUM ('pending', 'in_progress', 'resolved');
  ALTER TABLE "flag_history"
    ALTER COLUMN "new_status"
    SET DATA TYPE "public"."enum_flag_history_new_status"
    USING "new_status"::"public"."enum_flag_history_new_status";

  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "flags" DROP CONSTRAINT "flags_assigned_to_id_users_id_fk";
  
  ALTER TABLE "flags" DROP CONSTRAINT "flags_created_by_id_users_id_fk";
  
  ALTER TABLE "compliance_tasks" DROP CONSTRAINT "compliance_tasks_related_flag_id_flags_id_fk";
  
  DROP INDEX IF EXISTS "flags_assigned_to_idx";
  DROP INDEX IF EXISTS "flags_created_by_idx";
  DROP INDEX IF EXISTS "compliance_tasks_related_flag_idx";
  ALTER TABLE "flags" ALTER COLUMN "flag_type" DROP NOT NULL;
  ALTER TABLE "flags" ALTER COLUMN "status" DROP DEFAULT;
  ALTER TABLE "flags" ALTER COLUMN "status" DROP NOT NULL;
  ALTER TABLE "flags" ALTER COLUMN "detection_date" DROP NOT NULL;
  ALTER TABLE "flags" ALTER COLUMN "source" DROP NOT NULL;
  ALTER TABLE "flags" ALTER COLUMN "last_activity" DROP NOT NULL;
  ALTER TABLE "flags" ALTER COLUMN "description" DROP NOT NULL;
  ALTER TABLE "flags" ALTER COLUMN "suggested_action" DROP NOT NULL;
  ALTER TABLE "flag_history" ALTER COLUMN "flag_id" DROP NOT NULL;
  ALTER TABLE "flag_history" ALTER COLUMN "action" DROP NOT NULL;
  ALTER TABLE "flag_comments" ALTER COLUMN "flag_id" DROP NOT NULL;
  ALTER TABLE "flag_comments" ALTER COLUMN "user_id" DROP NOT NULL;
  ALTER TABLE "flag_comments" ALTER COLUMN "comment" DROP NOT NULL;
  ALTER TABLE "flags" DROP COLUMN IF EXISTS "assigned_to_id";
  ALTER TABLE "flags" DROP COLUMN IF EXISTS "due_date";
  ALTER TABLE "flags" DROP COLUMN IF EXISTS "created_by_id";
  ALTER TABLE "compliance_tasks" DROP COLUMN IF EXISTS "related_flag_id";
  ALTER TABLE "public"."flags" ALTER COLUMN "status" SET DATA TYPE text;
  DROP TYPE "public"."enum_flags_status";
  CREATE TYPE "public"."enum_flags_status" AS ENUM('resolved', 'pending', 'not_applicable');
  ALTER TABLE "public"."flags" ALTER COLUMN "status" SET DATA TYPE "public"."enum_flags_status" USING "status"::"public"."enum_flags_status";
  ALTER TABLE "public"."flag_history" ALTER COLUMN "prev_status" SET DATA TYPE text;
  DROP TYPE "public"."enum_flag_history_prev_status";
  CREATE TYPE "public"."enum_flag_history_prev_status" AS ENUM('resolved', 'pending', 'not_applicable');
  ALTER TABLE "public"."flag_history" ALTER COLUMN "prev_status" SET DATA TYPE "public"."enum_flag_history_prev_status" USING "prev_status"::"public"."enum_flag_history_prev_status";
  ALTER TABLE "public"."flag_history" ALTER COLUMN "new_status" SET DATA TYPE text;
  DROP TYPE "public"."enum_flag_history_new_status";
  CREATE TYPE "public"."enum_flag_history_new_status" AS ENUM('resolved', 'pending', 'not_applicable');
  ALTER TABLE "public"."flag_history" ALTER COLUMN "new_status" SET DATA TYPE "public"."enum_flag_history_new_status" USING "new_status"::"public"."enum_flag_history_new_status";
  ALTER TABLE "public"."audit_log" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_log_action";
  CREATE TYPE "public"."enum_audit_log_action" AS ENUM('create', 'update', 'delete', 'approval', 'flag_resolution', 'policy_acknowledgment', 'user_creation', 'password_recovery', 'password_reset', 'compliance_task_generated', 'task_escalation', 'role_request_approved', 'role_request_rejected', 'task_completed', 'training_completed', 'password_setup_completed', 'roll_call_completed', '2fa_confirmed', 'shared_password_confirmed', 'user_password_confirmed', 'roll_call_triggered', 'roll_call_auto_generated', 'roll_call_auto_generation_failed', 'roll_call_manually_generated');
  ALTER TABLE "public"."audit_log" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_log_action" USING "action"::"public"."enum_audit_log_action";
  ALTER TABLE "public"."compliance_tasks" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_compliance_tasks_type";
  CREATE TYPE "public"."enum_compliance_tasks_type" AS ENUM('PASSWORD_SETUP', 'CONFIRM_USER_PASSWORD', 'CONFIRM_SHARED_PASSWORD', 'CONFIRM_2FA', 'POLICY_ACKNOWLEDGMENT', 'TRAINING_COMPLETION', 'USER_ROLL_CALL');
  ALTER TABLE "public"."compliance_tasks" ALTER COLUMN "type" SET DATA TYPE "public"."enum_compliance_tasks_type" USING "type"::"public"."enum_compliance_tasks_type";
  ALTER TABLE "public"."payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'flagInactiveAccounts', 'detectRisks', 'sendComplianceReminders', 'createRecurringPasswordTasks');
  ALTER TABLE "public"."payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "public"."payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'flagInactiveAccounts', 'detectRisks', 'sendComplianceReminders', 'createRecurringPasswordTasks');
  ALTER TABLE "public"."payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";`)
}
