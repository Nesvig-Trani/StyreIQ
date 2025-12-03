import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_compliance_tasks_type" AS ENUM('PASSWORD_SETUP', 'POLICY_ACKNOWLEDGMENT', 'TRAINING_COMPLETION', 'USER_ROLL_CALL');
  CREATE TYPE "public"."enum_compliance_tasks_status" AS ENUM('PENDING', 'COMPLETED', 'OVERDUE', 'ESCALATED');
  ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'compliance_task_generated';
  ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'task_escalation';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'sendComplianceReminders';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'sendComplianceReminders';
  CREATE TABLE IF NOT EXISTS "compliance_tasks_reminders_sent" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"sent_at" timestamp(3) with time zone,
  	"days_since_due" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "compliance_tasks_escalations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"escalated_at" timestamp(3) with time zone,
  	"escalated_to_id" integer,
  	"reason" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "compliance_tasks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_compliance_tasks_type" NOT NULL,
  	"assigned_user_id" integer NOT NULL,
  	"status" "enum_compliance_tasks_status" DEFAULT 'PENDING' NOT NULL,
  	"due_date" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone,
  	"description" varchar,
  	"related_policy_id" integer,
  	"related_training" varchar,
  	"tenant_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "compliance_tasks_id" integer;
  DO $$ BEGIN
   ALTER TABLE "compliance_tasks_reminders_sent" ADD CONSTRAINT "compliance_tasks_reminders_sent_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."compliance_tasks"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "compliance_tasks_escalations" ADD CONSTRAINT "compliance_tasks_escalations_escalated_to_id_users_id_fk" FOREIGN KEY ("escalated_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "compliance_tasks_escalations" ADD CONSTRAINT "compliance_tasks_escalations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."compliance_tasks"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_related_policy_id_policies_id_fk" FOREIGN KEY ("related_policy_id") REFERENCES "public"."policies"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "compliance_tasks_reminders_sent_order_idx" ON "compliance_tasks_reminders_sent" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "compliance_tasks_reminders_sent_parent_id_idx" ON "compliance_tasks_reminders_sent" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "compliance_tasks_escalations_order_idx" ON "compliance_tasks_escalations" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "compliance_tasks_escalations_parent_id_idx" ON "compliance_tasks_escalations" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "compliance_tasks_escalations_escalated_to_idx" ON "compliance_tasks_escalations" USING btree ("escalated_to_id");
  CREATE INDEX IF NOT EXISTS "compliance_tasks_assigned_user_idx" ON "compliance_tasks" USING btree ("assigned_user_id");
  CREATE INDEX IF NOT EXISTS "compliance_tasks_related_policy_idx" ON "compliance_tasks" USING btree ("related_policy_id");
  CREATE INDEX IF NOT EXISTS "compliance_tasks_tenant_idx" ON "compliance_tasks" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "compliance_tasks_updated_at_idx" ON "compliance_tasks" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "compliance_tasks_created_at_idx" ON "compliance_tasks" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_compliance_tasks_fk" FOREIGN KEY ("compliance_tasks_id") REFERENCES "public"."compliance_tasks"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_compliance_tasks_id_idx" ON "payload_locked_documents_rels" USING btree ("compliance_tasks_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "compliance_tasks_reminders_sent" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "compliance_tasks_escalations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "compliance_tasks" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "compliance_tasks_reminders_sent" CASCADE;
  DROP TABLE "compliance_tasks_escalations" CASCADE;
  DROP TABLE "compliance_tasks" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_compliance_tasks_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_compliance_tasks_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "compliance_tasks_id";
  ALTER TABLE "public"."audit_log" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_log_action";
  CREATE TYPE "public"."enum_audit_log_action" AS ENUM('create', 'update', 'delete', 'approval', 'flag_resolution', 'policy_acknowledgment', 'user_creation', 'password_recovery', 'password_reset');
  ALTER TABLE "public"."audit_log" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_log_action" USING "action"::"public"."enum_audit_log_action";
  ALTER TABLE "public"."payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'flagInactiveAccounts', 'detectRisks');
  ALTER TABLE "public"."payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "public"."payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'flagInactiveAccounts', 'detectRisks');
  ALTER TABLE "public"."payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_compliance_tasks_type";
  DROP TYPE "public"."enum_compliance_tasks_status";`)
}
