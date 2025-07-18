import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_flags_status" AS ENUM('resolved', 'pending', 'not_applicable');
  CREATE TYPE "public"."enum_flags_source" AS ENUM('automated', 'manual');
  CREATE TYPE "public"."enum_flag_history_action" AS ENUM('created', 'status_changed', 'comment');
  CREATE TYPE "public"."enum_flag_history_prev_status" AS ENUM('resolved', 'pending', 'not_applicable');
  CREATE TYPE "public"."enum_flag_history_new_status" AS ENUM('resolved', 'pending', 'not_applicable');
  CREATE TABLE IF NOT EXISTS "flags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"flag_type" varchar,
  	"organization_id" integer,
  	"status" "enum_flags_status",
  	"detection_date" timestamp(3) with time zone,
  	"source" "enum_flags_source",
  	"last_activity" timestamp(3) with time zone,
  	"description" varchar,
  	"suggested_action" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "flags_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"social_medias_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "flag_history" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"flag_id" integer,
  	"user_id" integer,
  	"action" "enum_flag_history_action",
  	"prev_status" "enum_flag_history_prev_status",
  	"new_status" "enum_flag_history_new_status",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "flag_comments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"flag_id" integer,
  	"user_id" integer,
  	"comment" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "flags_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "flag_history_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "flag_comments_id" integer;
  DO $$ BEGIN
   ALTER TABLE "flags" ADD CONSTRAINT "flags_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "flags_rels" ADD CONSTRAINT "flags_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."flags"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "flags_rels" ADD CONSTRAINT "flags_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "flags_rels" ADD CONSTRAINT "flags_rels_social_medias_fk" FOREIGN KEY ("social_medias_id") REFERENCES "public"."social_medias"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "flag_history" ADD CONSTRAINT "flag_history_flag_id_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."flags"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "flag_history" ADD CONSTRAINT "flag_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "flag_comments" ADD CONSTRAINT "flag_comments_flag_id_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."flags"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "flag_comments" ADD CONSTRAINT "flag_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "flags_organization_idx" ON "flags" USING btree ("organization_id");
  CREATE INDEX IF NOT EXISTS "flags_updated_at_idx" ON "flags" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "flags_created_at_idx" ON "flags" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "flags_rels_order_idx" ON "flags_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "flags_rels_parent_idx" ON "flags_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "flags_rels_path_idx" ON "flags_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "flags_rels_users_id_idx" ON "flags_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "flags_rels_social_medias_id_idx" ON "flags_rels" USING btree ("social_medias_id");
  CREATE INDEX IF NOT EXISTS "flag_history_flag_idx" ON "flag_history" USING btree ("flag_id");
  CREATE INDEX IF NOT EXISTS "flag_history_user_idx" ON "flag_history" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "flag_history_updated_at_idx" ON "flag_history" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "flag_history_created_at_idx" ON "flag_history" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "flag_comments_flag_idx" ON "flag_comments" USING btree ("flag_id");
  CREATE INDEX IF NOT EXISTS "flag_comments_user_idx" ON "flag_comments" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "flag_comments_updated_at_idx" ON "flag_comments" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "flag_comments_created_at_idx" ON "flag_comments" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_flags_fk" FOREIGN KEY ("flags_id") REFERENCES "public"."flags"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_flag_history_fk" FOREIGN KEY ("flag_history_id") REFERENCES "public"."flag_history"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_flag_comments_fk" FOREIGN KEY ("flag_comments_id") REFERENCES "public"."flag_comments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_flags_id_idx" ON "payload_locked_documents_rels" USING btree ("flags_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_flag_history_id_idx" ON "payload_locked_documents_rels" USING btree ("flag_history_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_flag_comments_id_idx" ON "payload_locked_documents_rels" USING btree ("flag_comments_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "flags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "flags_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "flag_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "flag_comments" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "flags" CASCADE;
  DROP TABLE "flags_rels" CASCADE;
  DROP TABLE "flag_history" CASCADE;
  DROP TABLE "flag_comments" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_flags_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_flag_history_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_flag_comments_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_flags_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_flag_history_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_flag_comments_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "flags_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "flag_history_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "flag_comments_id";
  DROP TYPE "public"."enum_flags_status";
  DROP TYPE "public"."enum_flags_source";
  DROP TYPE "public"."enum_flag_history_action";
  DROP TYPE "public"."enum_flag_history_prev_status";
  DROP TYPE "public"."enum_flag_history_new_status";`)
}
