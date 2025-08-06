import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "flags" DROP CONSTRAINT "flags_organization_id_organization_id_fk";
  
  DROP INDEX IF EXISTS "flags_organization_idx";
  ALTER TABLE "users" ADD COLUMN "is_enabled_two_factor" boolean;
  ALTER TABLE "users" ADD COLUMN "is_in_use_secure_password" boolean;
  ALTER TABLE "users" ADD COLUMN "is_completed_training_accessibility" boolean;
  ALTER TABLE "users" ADD COLUMN "is_completed_training_risk" boolean;
  ALTER TABLE "users" ADD COLUMN "is_completed_training_brand" boolean;
  ALTER TABLE "users" ADD COLUMN "has_knowledge_standards" boolean;
  ALTER TABLE "users" ADD COLUMN "password_updated_at" timestamp(3) with time zone;
  ALTER TABLE "flags_rels" ADD COLUMN "organization_id" integer;
  DO $$ BEGIN
   ALTER TABLE "flags_rels" ADD CONSTRAINT "flags_rels_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "flags_rels_organization_id_idx" ON "flags_rels" USING btree ("organization_id");
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "password_updated_at";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "is_enabled_two_factor";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "is_in_use_secure_password";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "is_accepted_policies";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "is_completed_training_accessibility";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "is_completed_training_risk";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "is_completed_training_brand";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "has_knowledge_standards";
  ALTER TABLE "flags" DROP COLUMN IF EXISTS "organization_id";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "flags_rels" DROP CONSTRAINT "flags_rels_organization_fk";
  
  DROP INDEX IF EXISTS "flags_rels_organization_id_idx";
  ALTER TABLE "social_medias" ADD COLUMN "password_updated_at" timestamp(3) with time zone;
  ALTER TABLE "social_medias" ADD COLUMN "is_enabled_two_factor" boolean;
  ALTER TABLE "social_medias" ADD COLUMN "is_in_use_secure_password" boolean;
  ALTER TABLE "social_medias" ADD COLUMN "is_accepted_policies" boolean;
  ALTER TABLE "social_medias" ADD COLUMN "is_completed_training_accessibility" boolean;
  ALTER TABLE "social_medias" ADD COLUMN "is_completed_training_risk" boolean;
  ALTER TABLE "social_medias" ADD COLUMN "is_completed_training_brand" boolean;
  ALTER TABLE "social_medias" ADD COLUMN "has_knowledge_standards" boolean;
  ALTER TABLE "flags" ADD COLUMN "organization_id" integer;
  DO $$ BEGIN
   ALTER TABLE "flags" ADD CONSTRAINT "flags_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "flags_organization_idx" ON "flags" USING btree ("organization_id");
  ALTER TABLE "users" DROP COLUMN IF EXISTS "is_enabled_two_factor";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "is_in_use_secure_password";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "is_completed_training_accessibility";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "is_completed_training_risk";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "is_completed_training_brand";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "has_knowledge_standards";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "password_updated_at";
  ALTER TABLE "flags_rels" DROP COLUMN IF EXISTS "organization_id";`)
}
