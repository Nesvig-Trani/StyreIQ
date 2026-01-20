import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tenants_enabled_trainings_assigned_roles" AS ENUM('social_media_manager', 'unit_admin', 'central_admin');
  CREATE TYPE "public"."enum_tenants_enabled_trainings_training_id" AS ENUM('training-governance', 'training-risk', 'training-leadership');
  CREATE TABLE IF NOT EXISTS "tenants_enabled_trainings_assigned_roles" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_tenants_enabled_trainings_assigned_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "tenants_enabled_trainings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"training_id" "enum_tenants_enabled_trainings_training_id" NOT NULL
  );
  
  ALTER TABLE "flags" ALTER COLUMN "flag_type" DROP NOT NULL;
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
  ALTER TABLE "users" ADD COLUMN "is_completed_training_leadership" boolean;
  DO $$ BEGIN
   ALTER TABLE "tenants_enabled_trainings_assigned_roles" ADD CONSTRAINT "tenants_enabled_trainings_assigned_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tenants_enabled_trainings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "tenants_enabled_trainings" ADD CONSTRAINT "tenants_enabled_trainings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "tenants_enabled_trainings_assigned_roles_order_idx" ON "tenants_enabled_trainings_assigned_roles" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "tenants_enabled_trainings_assigned_roles_parent_idx" ON "tenants_enabled_trainings_assigned_roles" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "tenants_enabled_trainings_order_idx" ON "tenants_enabled_trainings" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "tenants_enabled_trainings_parent_id_idx" ON "tenants_enabled_trainings" USING btree ("_parent_id");
  ALTER TABLE "public"."flags" ALTER COLUMN "status" SET DATA TYPE text;
  
  ALTER TABLE "public"."flag_history" ALTER COLUMN "prev_status" SET DATA TYPE text;
  DROP TYPE "public"."enum_flag_history_prev_status";
  CREATE TYPE "public"."enum_flag_history_prev_status" AS ENUM('resolved', 'pending', 'not_applicable', 'in_progress');
  ALTER TABLE "public"."flag_history" ALTER COLUMN "prev_status" SET DATA TYPE "public"."enum_flag_history_prev_status" USING "prev_status"::"public"."enum_flag_history_prev_status";
  ALTER TABLE "public"."flag_history" ALTER COLUMN "new_status" SET DATA TYPE text;
  DROP TYPE "public"."enum_flag_history_new_status";
  CREATE TYPE "public"."enum_flag_history_new_status" AS ENUM('resolved', 'pending', 'not_applicable', 'in_progress');
  ALTER TABLE "public"."flag_history" ALTER COLUMN "new_status" SET DATA TYPE "public"."enum_flag_history_new_status" USING "new_status"::"public"."enum_flag_history_new_status";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tenants_enabled_trainings_assigned_roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tenants_enabled_trainings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tenants_enabled_trainings_assigned_roles" CASCADE;
  DROP TABLE "tenants_enabled_trainings" CASCADE;
  ALTER TABLE "flags" ALTER COLUMN "flag_type" SET NOT NULL;
  ALTER TABLE "flags" ALTER COLUMN "status" SET NOT NULL;
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
  ALTER TABLE "users" DROP COLUMN IF EXISTS "is_completed_training_leadership";
  ALTER TABLE "public"."flags" ALTER COLUMN "status" SET DATA TYPE text;

  ALTER TABLE "public"."flag_history" ALTER COLUMN "prev_status" SET DATA TYPE text;
  DROP TYPE "public"."enum_flag_history_prev_status";
  CREATE TYPE "public"."enum_flag_history_prev_status" AS ENUM('pending', 'in_progress', 'resolved');
  ALTER TABLE "public"."flag_history" ALTER COLUMN "prev_status" SET DATA TYPE "public"."enum_flag_history_prev_status" USING "prev_status"::"public"."enum_flag_history_prev_status";
  ALTER TABLE "public"."flag_history" ALTER COLUMN "new_status" SET DATA TYPE text;
  DROP TYPE "public"."enum_flag_history_new_status";
  CREATE TYPE "public"."enum_flag_history_new_status" AS ENUM('pending', 'in_progress', 'resolved');
  ALTER TABLE "public"."flag_history" ALTER COLUMN "new_status" SET DATA TYPE "public"."enum_flag_history_new_status" USING "new_status"::"public"."enum_flag_history_new_status";
  DROP TYPE "public"."enum_tenants_enabled_trainings_assigned_roles";
  DROP TYPE "public"."enum_tenants_enabled_trainings_training_id";`)
}
