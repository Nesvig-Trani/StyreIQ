import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('super_admin', 'unit_admin', 'social_media_manager');
  CREATE TYPE "public"."enum_users_status" AS ENUM('active', 'inactive', 'rejected', 'pending_activation');
  CREATE TYPE "public"."enum_organization_type" AS ENUM('university', 'faculty', 'department', 'office', 'project');
  CREATE TYPE "public"."enum_organization_status" AS ENUM('active', 'inactive', 'pending_review');
  CREATE TYPE "public"."enum_organization_access_type" AS ENUM('temporary', 'permanent');
  CREATE TYPE "public"."enum_social_medias_status" AS ENUM('active', 'inactive', 'in_transition', 'pending_approval');
  CREATE TYPE "public"."enum_audit_log_action" AS ENUM('create', 'update', 'delete', 'approval', 'flag_resolution', 'policy_acknowledgment');
  CREATE TABLE IF NOT EXISTS "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role",
  	"status" "enum_users_status",
  	"admin_policy_agreement" boolean DEFAULT false NOT NULL,
  	"date_of_last_policy_review" timestamp(3) with time zone,
  	"date_of_last_training" timestamp(3) with time zone,
  	"reject_reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"organization_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "organization" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"type" "enum_organization_type" NOT NULL,
  	"parent_org_id" integer,
  	"admin_id" integer NOT NULL,
  	"email" varchar,
  	"phone" varchar,
  	"status" "enum_organization_status",
  	"description" varchar,
  	"delegated_permissions" boolean,
  	"path" varchar,
  	"depth" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "organization_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "organization_access" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer,
  	"user_id" integer,
  	"type" "enum_organization_access_type",
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "social_medias" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"profile_url" varchar NOT NULL,
  	"platform" varchar NOT NULL,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"password_updated_at" timestamp(3) with time zone,
  	"is_enabled_two_factor" boolean,
  	"is_in_use_secure_password" boolean,
  	"is_accepted_policies" boolean,
  	"is_completed_training_accessibility" boolean,
  	"is_completed_training_risk" boolean,
  	"is_completed_training_brand" boolean,
  	"has_knowledge_standards" boolean,
  	"organization_id" integer NOT NULL,
  	"primary_admin_id" integer NOT NULL,
  	"backup_admin_id" integer NOT NULL,
  	"status" "enum_social_medias_status" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "policies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version" numeric DEFAULT 0.1,
  	"text" jsonb,
  	"author_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "acknowledgments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"policy_id" integer,
  	"user_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "audit_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"action" "enum_audit_log_action" NOT NULL,
  	"entity" varchar NOT NULL,
  	"prev" jsonb,
  	"current" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "audit_log_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"organization_id" integer,
  	"users_id" integer,
  	"social_medias_id" integer,
  	"organization_access_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"organization_id" integer,
  	"organization_access_id" integer,
  	"social_medias_id" integer,
  	"policies_id" integer,
  	"acknowledgments_id" integer,
  	"audit_log_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  DO $$ BEGIN
   ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "organization" ADD CONSTRAINT "organization_parent_org_id_organization_id_fk" FOREIGN KEY ("parent_org_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "organization" ADD CONSTRAINT "organization_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "organization_rels" ADD CONSTRAINT "organization_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "organization_rels" ADD CONSTRAINT "organization_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "organization_access" ADD CONSTRAINT "organization_access_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "organization_access" ADD CONSTRAINT "organization_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "social_medias" ADD CONSTRAINT "social_medias_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "social_medias" ADD CONSTRAINT "social_medias_primary_admin_id_users_id_fk" FOREIGN KEY ("primary_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "social_medias" ADD CONSTRAINT "social_medias_backup_admin_id_users_id_fk" FOREIGN KEY ("backup_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "policies" ADD CONSTRAINT "policies_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "acknowledgments" ADD CONSTRAINT "acknowledgments_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "acknowledgments" ADD CONSTRAINT "acknowledgments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "audit_log_rels" ADD CONSTRAINT "audit_log_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."audit_log"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "audit_log_rels" ADD CONSTRAINT "audit_log_rels_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "audit_log_rels" ADD CONSTRAINT "audit_log_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "audit_log_rels" ADD CONSTRAINT "audit_log_rels_social_medias_fk" FOREIGN KEY ("social_medias_id") REFERENCES "public"."social_medias"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "audit_log_rels" ADD CONSTRAINT "audit_log_rels_organization_access_fk" FOREIGN KEY ("organization_access_id") REFERENCES "public"."organization_access"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_organization_access_fk" FOREIGN KEY ("organization_access_id") REFERENCES "public"."organization_access"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_social_medias_fk" FOREIGN KEY ("social_medias_id") REFERENCES "public"."social_medias"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_policies_fk" FOREIGN KEY ("policies_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_acknowledgments_fk" FOREIGN KEY ("acknowledgments_id") REFERENCES "public"."acknowledgments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_log_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."audit_log"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "users_rels_organization_id_idx" ON "users_rels" USING btree ("organization_id");
  CREATE INDEX IF NOT EXISTS "organization_parent_org_idx" ON "organization" USING btree ("parent_org_id");
  CREATE INDEX IF NOT EXISTS "organization_admin_idx" ON "organization" USING btree ("admin_id");
  CREATE INDEX IF NOT EXISTS "organization_updated_at_idx" ON "organization" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "organization_created_at_idx" ON "organization" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "organization_rels_order_idx" ON "organization_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "organization_rels_parent_idx" ON "organization_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "organization_rels_path_idx" ON "organization_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "organization_rels_users_id_idx" ON "organization_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "organization_access_organization_idx" ON "organization_access" USING btree ("organization_id");
  CREATE INDEX IF NOT EXISTS "organization_access_user_idx" ON "organization_access" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "organization_access_updated_at_idx" ON "organization_access" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "organization_access_created_at_idx" ON "organization_access" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "social_medias_organization_idx" ON "social_medias" USING btree ("organization_id");
  CREATE INDEX IF NOT EXISTS "social_medias_primary_admin_idx" ON "social_medias" USING btree ("primary_admin_id");
  CREATE INDEX IF NOT EXISTS "social_medias_backup_admin_idx" ON "social_medias" USING btree ("backup_admin_id");
  CREATE INDEX IF NOT EXISTS "social_medias_updated_at_idx" ON "social_medias" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "social_medias_created_at_idx" ON "social_medias" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "policies_version_idx" ON "policies" USING btree ("version");
  CREATE INDEX IF NOT EXISTS "policies_author_idx" ON "policies" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "policies_updated_at_idx" ON "policies" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "policies_created_at_idx" ON "policies" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "acknowledgments_policy_idx" ON "acknowledgments" USING btree ("policy_id");
  CREATE INDEX IF NOT EXISTS "acknowledgments_user_idx" ON "acknowledgments" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "acknowledgments_updated_at_idx" ON "acknowledgments" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "acknowledgments_created_at_idx" ON "acknowledgments" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "audit_log_user_idx" ON "audit_log" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "audit_log_updated_at_idx" ON "audit_log" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "audit_log_rels_order_idx" ON "audit_log_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "audit_log_rels_parent_idx" ON "audit_log_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "audit_log_rels_path_idx" ON "audit_log_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "audit_log_rels_organization_id_idx" ON "audit_log_rels" USING btree ("organization_id");
  CREATE INDEX IF NOT EXISTS "audit_log_rels_users_id_idx" ON "audit_log_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "audit_log_rels_social_medias_id_idx" ON "audit_log_rels" USING btree ("social_medias_id");
  CREATE INDEX IF NOT EXISTS "audit_log_rels_organization_access_id_idx" ON "audit_log_rels" USING btree ("organization_access_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_organization_id_idx" ON "payload_locked_documents_rels" USING btree ("organization_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_organization_access_id_idx" ON "payload_locked_documents_rels" USING btree ("organization_access_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_social_medias_id_idx" ON "payload_locked_documents_rels" USING btree ("social_medias_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_policies_id_idx" ON "payload_locked_documents_rels" USING btree ("policies_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_acknowledgments_id_idx" ON "payload_locked_documents_rels" USING btree ("acknowledgments_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_audit_log_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_log_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "organization" CASCADE;
  DROP TABLE "organization_rels" CASCADE;
  DROP TABLE "organization_access" CASCADE;
  DROP TABLE "social_medias" CASCADE;
  DROP TABLE "policies" CASCADE;
  DROP TABLE "acknowledgments" CASCADE;
  DROP TABLE "audit_log" CASCADE;
  DROP TABLE "audit_log_rels" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_status";
  DROP TYPE "public"."enum_organization_type";
  DROP TYPE "public"."enum_organization_status";
  DROP TYPE "public"."enum_organization_access_type";
  DROP TYPE "public"."enum_social_medias_status";
  DROP TYPE "public"."enum_audit_log_action";`)
}
