import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tenants_governance_settings_roll_call_frequency" AS ENUM('monthly', 'quarterly', 'semiannual', 'annual');
  CREATE TYPE "public"."enum_tenants_status" AS ENUM('active', 'suspended', 'archived');
  CREATE TYPE "public"."enum_tenants_metadata_timezone" AS ENUM('America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles');
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
  
  CREATE TABLE IF NOT EXISTS "tenants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"domain" varchar NOT NULL,
  	"admin_contact" varchar NOT NULL,
  	"primary_unit_id" integer,
  	"governance_settings_roll_call_frequency" "enum_tenants_governance_settings_roll_call_frequency" DEFAULT 'quarterly',
  	"governance_settings_password_rotation_days" numeric DEFAULT 90,
  	"status" "enum_tenants_status" DEFAULT 'active' NOT NULL,
  	"metadata_timezone" "enum_tenants_metadata_timezone" DEFAULT 'America/New_York',
  	"metadata_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "organization" ALTER COLUMN "admin_id" DROP NOT NULL;
  ALTER TABLE "organization" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "organization" ADD COLUMN "is_primary_unit" boolean DEFAULT false;
  ALTER TABLE "welcome_emails" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "users" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "social_medias" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "policies" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "acknowledgments" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "flags" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "flag_history" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "flag_comments" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "audit_log" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tenants_id" integer;
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
  
  DO $$ BEGIN
   ALTER TABLE "tenants" ADD CONSTRAINT "tenants_primary_unit_id_organization_id_fk" FOREIGN KEY ("primary_unit_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "tenants_governance_settings_policy_reminder_days_order_idx" ON "tenants_governance_settings_policy_reminder_days" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "tenants_governance_settings_policy_reminder_days_parent_id_idx" ON "tenants_governance_settings_policy_reminder_days" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "tenants_governance_settings_training_escalation_days_order_idx" ON "tenants_governance_settings_training_escalation_days" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "tenants_governance_settings_training_escalation_days_parent_id_idx" ON "tenants_governance_settings_training_escalation_days" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "tenants_domain_idx" ON "tenants" USING btree ("domain");
  CREATE INDEX IF NOT EXISTS "tenants_primary_unit_idx" ON "tenants" USING btree ("primary_unit_id");
  CREATE INDEX IF NOT EXISTS "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "tenants_created_at_idx" ON "tenants" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "organization" ADD CONSTRAINT "organization_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "welcome_emails" ADD CONSTRAINT "welcome_emails_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "social_medias" ADD CONSTRAINT "social_medias_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "policies" ADD CONSTRAINT "policies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "acknowledgments" ADD CONSTRAINT "acknowledgments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "flags" ADD CONSTRAINT "flags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "flag_history" ADD CONSTRAINT "flag_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "flag_comments" ADD CONSTRAINT "flag_comments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "organization_tenant_idx" ON "organization" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "welcome_emails_tenant_idx" ON "welcome_emails" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "users_tenant_idx" ON "users" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "social_medias_tenant_idx" ON "social_medias" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "policies_tenant_idx" ON "policies" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "acknowledgments_tenant_idx" ON "acknowledgments" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "flags_tenant_idx" ON "flags" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "flag_history_tenant_idx" ON "flag_history" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "flag_comments_tenant_idx" ON "flag_comments" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "audit_log_tenant_idx" ON "audit_log" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tenants_id_idx" ON "payload_locked_documents_rels" USING btree ("tenants_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tenants_governance_settings_policy_reminder_days" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tenants_governance_settings_training_escalation_days" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tenants" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tenants_governance_settings_policy_reminder_days" CASCADE;
  DROP TABLE "tenants_governance_settings_training_escalation_days" CASCADE;
  DROP TABLE "tenants" CASCADE;
  ALTER TABLE "organization" DROP CONSTRAINT "organization_tenant_id_tenants_id_fk";
  
  ALTER TABLE "welcome_emails" DROP CONSTRAINT "welcome_emails_tenant_id_tenants_id_fk";
  
  ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_tenants_id_fk";
  
  ALTER TABLE "social_medias" DROP CONSTRAINT "social_medias_tenant_id_tenants_id_fk";
  
  ALTER TABLE "policies" DROP CONSTRAINT "policies_tenant_id_tenants_id_fk";
  
  ALTER TABLE "acknowledgments" DROP CONSTRAINT "acknowledgments_tenant_id_tenants_id_fk";
  
  ALTER TABLE "flags" DROP CONSTRAINT "flags_tenant_id_tenants_id_fk";
  
  ALTER TABLE "flag_history" DROP CONSTRAINT "flag_history_tenant_id_tenants_id_fk";
  
  ALTER TABLE "flag_comments" DROP CONSTRAINT "flag_comments_tenant_id_tenants_id_fk";
  
  ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_tenant_id_tenants_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tenants_fk";
  
  DROP INDEX IF EXISTS "organization_tenant_idx";
  DROP INDEX IF EXISTS "welcome_emails_tenant_idx";
  DROP INDEX IF EXISTS "users_tenant_idx";
  DROP INDEX IF EXISTS "social_medias_tenant_idx";
  DROP INDEX IF EXISTS "policies_tenant_idx";
  DROP INDEX IF EXISTS "acknowledgments_tenant_idx";
  DROP INDEX IF EXISTS "flags_tenant_idx";
  DROP INDEX IF EXISTS "flag_history_tenant_idx";
  DROP INDEX IF EXISTS "flag_comments_tenant_idx";
  DROP INDEX IF EXISTS "audit_log_tenant_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_tenants_id_idx";
  ALTER TABLE "organization" ALTER COLUMN "admin_id" SET NOT NULL;
  ALTER TABLE "organization" DROP COLUMN IF EXISTS "tenant_id";
  ALTER TABLE "organization" DROP COLUMN IF EXISTS "is_primary_unit";
  ALTER TABLE "welcome_emails" DROP COLUMN IF EXISTS "tenant_id";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "tenant_id";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "tenant_id";
  ALTER TABLE "policies" DROP COLUMN IF EXISTS "tenant_id";
  ALTER TABLE "acknowledgments" DROP COLUMN IF EXISTS "tenant_id";
  ALTER TABLE "flags" DROP COLUMN IF EXISTS "tenant_id";
  ALTER TABLE "flag_history" DROP COLUMN IF EXISTS "tenant_id";
  ALTER TABLE "flag_comments" DROP COLUMN IF EXISTS "tenant_id";
  ALTER TABLE "audit_log" DROP COLUMN IF EXISTS "tenant_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tenants_id";
  DROP TYPE "public"."enum_tenants_governance_settings_roll_call_frequency";
  DROP TYPE "public"."enum_tenants_status";
  DROP TYPE "public"."enum_tenants_metadata_timezone";`)
}
