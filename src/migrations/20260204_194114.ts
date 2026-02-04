import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'reminder_sent';
  
  CREATE TABLE IF NOT EXISTS "tenants_governance_settings_reminder_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" numeric NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "tenants_governance_settings_escalation_days" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" numeric NOT NULL
  );
  
  ALTER TABLE "tenants_governance_settings_policy_reminder_days" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tenants_governance_settings_training_escalation_days" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tenants_governance_settings_policy_reminder_days" CASCADE;
  DROP TABLE "tenants_governance_settings_training_escalation_days" CASCADE;
  
  ALTER TABLE "flags" ADD COLUMN "related_compliance_task_id" integer;
  ALTER TABLE "tenants" ADD COLUMN "governance_settings_password_update_cadence_days" numeric DEFAULT 180;
  
  DO $$ BEGIN
   ALTER TABLE "tenants_governance_settings_reminder_schedule" ADD CONSTRAINT "tenants_governance_settings_reminder_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "tenants_governance_settings_escalation_days" ADD CONSTRAINT "tenants_governance_settings_escalation_days_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "tenants_governance_settings_reminder_schedule_order_idx" ON "tenants_governance_settings_reminder_schedule" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "tenants_governance_settings_reminder_schedule_parent_id_idx" ON "tenants_governance_settings_reminder_schedule" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "tenants_governance_settings_escalation_days_order_idx" ON "tenants_governance_settings_escalation_days" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "tenants_governance_settings_escalation_days_parent_id_idx" ON "tenants_governance_settings_escalation_days" USING btree ("_parent_id");
  
  DO $$ BEGIN
   ALTER TABLE "flags" ADD CONSTRAINT "flags_related_compliance_task_id_compliance_tasks_id_fk" FOREIGN KEY ("related_compliance_task_id") REFERENCES "public"."compliance_tasks"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "flags_related_compliance_task_idx" ON "flags" USING btree ("related_compliance_task_id");
  
  ALTER TABLE "tenants" DROP COLUMN IF EXISTS "governance_settings_password_rotation_days";
  ALTER TABLE "tenants" DROP COLUMN IF EXISTS "governance_settings_password_confirmation_cadence_days";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "tenants_governance_settings_policy_reminder_days" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" numeric NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "tenants_governance_settings_training_escalation_days" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" numeric NOT NULL
  );
  
  ALTER TABLE "tenants_governance_settings_reminder_schedule" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tenants_governance_settings_escalation_days" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tenants_governance_settings_reminder_schedule" CASCADE;
  DROP TABLE "tenants_governance_settings_escalation_days" CASCADE;
  
  ALTER TABLE "flags" DROP CONSTRAINT "flags_related_compliance_task_id_compliance_tasks_id_fk";
  DROP INDEX IF EXISTS "flags_related_compliance_task_idx";
  
  ALTER TABLE "tenants" ADD COLUMN "governance_settings_password_rotation_days" numeric DEFAULT 90;
  ALTER TABLE "tenants" ADD COLUMN "governance_settings_password_confirmation_cadence_days" numeric DEFAULT 180;
  
  DO $$ BEGIN
   ALTER TABLE "tenants_governance_settings_policy_reminder_days" ADD CONSTRAINT "tenants_governance_settings_policy_reminder_days_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "tenants_governance_settings_training_escalation_days" ADD CONSTRAINT "tenants_governance_settings_training_escalation_days_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "tenants_governance_settings_policy_reminder_days_order_idx" ON "tenants_governance_settings_policy_reminder_days" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "tenants_governance_settings_policy_reminder_days_parent_id_idx" ON "tenants_governance_settings_policy_reminder_days" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "tenants_governance_settings_training_escalation_days_order_idx" ON "tenants_governance_settings_training_escalation_days" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "tenants_governance_settings_training_escalation_days_parent_id_idx" ON "tenants_governance_settings_training_escalation_days" USING btree ("_parent_id");
  
  ALTER TABLE "flags" DROP COLUMN IF EXISTS "related_compliance_task_id";
  ALTER TABLE "tenants" DROP COLUMN IF EXISTS "governance_settings_password_update_cadence_days";
  
  ALTER TABLE "public"."audit_log" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_log_action";
  CREATE TYPE "public"."enum_audit_log_action" AS ENUM('create', 'update', 'delete', 'approval', 'flag_resolution', 'policy_acknowledgment', 'user_creation', 'password_recovery', 'password_reset', 'compliance_task_generated', 'task_escalation', 'role_request_approved', 'role_request_rejected', 'task_completed', 'training_completed', 'password_setup_completed', 'roll_call_completed', '2fa_confirmed', 'shared_password_confirmed', 'user_password_confirmed', 'roll_call_triggered', 'roll_call_auto_generated', 'roll_call_auto_generation_failed', 'roll_call_manually_generated', 'flag_resolved', 'training_task_generated_for_new_roles');
  ALTER TABLE "public"."audit_log" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_log_action" USING "action"::"public"."enum_audit_log_action";
  `)
}
