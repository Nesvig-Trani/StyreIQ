import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_social_medias_linked_tools" AS ENUM('Hootsuite', 'Canva', 'Sprout', 'Other');
  CREATE TYPE "public"."enum_social_medias_platform" AS ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'other');
  CREATE TYPE "public"."enum_social_medias_third_party_management" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_social_medias_password_management_practice" AS ENUM('Password Manager', 'Manual', 'Other');
  CREATE TYPE "public"."enum_social_medias_verification_status" AS ENUM('verified', 'notVerified', 'pending');
  CREATE TABLE IF NOT EXISTS "social_medias_admin_contact_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "social_medias_linked_tools" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_social_medias_linked_tools",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "social_medias" ALTER COLUMN "platform" TYPE enum_social_medias_platform USING platform::enum_social_medias_platform;
  ALTER TABLE "social_medias" ADD COLUMN "account_handle" varchar;
  ALTER TABLE "social_medias" ADD COLUMN "business_id" varchar;
  ALTER TABLE "social_medias" ADD COLUMN "backup_contact_info" varchar;
  ALTER TABLE "social_medias" ADD COLUMN "third_party_management" "enum_social_medias_third_party_management" DEFAULT 'no';
  ALTER TABLE "social_medias" ADD COLUMN "third_party_provider" varchar;
  ALTER TABLE "social_medias" ADD COLUMN "third_party_contact" varchar;
  ALTER TABLE "social_medias" ADD COLUMN "password_management_practice" "enum_social_medias_password_management_practice";
  ALTER TABLE "social_medias" ADD COLUMN "creation_date" timestamp(3) with time zone DEFAULT NOW();
  ALTER TABLE "social_medias" ADD COLUMN "verification_status" "enum_social_medias_verification_status" DEFAULT 'notVerified';
  ALTER TABLE "social_medias" ADD COLUMN "platform_support_details" varchar;
  ALTER TABLE "social_medias" ADD COLUMN "notes" varchar;
  DO $$ BEGIN
   ALTER TABLE "social_medias_admin_contact_emails" ADD CONSTRAINT "social_medias_admin_contact_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."social_medias"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "social_medias_linked_tools" ADD CONSTRAINT "social_medias_linked_tools_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."social_medias"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "social_medias_admin_contact_emails_order_idx" ON "social_medias_admin_contact_emails" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "social_medias_admin_contact_emails_parent_id_idx" ON "social_medias_admin_contact_emails" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "social_medias_linked_tools_order_idx" ON "social_medias_linked_tools" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "social_medias_linked_tools_parent_idx" ON "social_medias_linked_tools" USING btree ("parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "social_medias_admin_contact_emails" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "social_medias_linked_tools" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "social_medias_admin_contact_emails" CASCADE;
  DROP TABLE "social_medias_linked_tools" CASCADE;
  ALTER TABLE "social_medias" ALTER COLUMN "platform" SET DATA TYPE varchar;
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "account_handle";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "business_id";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "backup_contact_info";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "third_party_management";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "third_party_provider";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "third_party_contact";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "password_management_practice";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "creation_date";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "verification_status";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "platform_support_details";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "notes";
  DROP TYPE "public"."enum_social_medias_linked_tools";
  DROP TYPE "public"."enum_social_medias_platform";
  DROP TYPE "public"."enum_social_medias_third_party_management";
  DROP TYPE "public"."enum_social_medias_password_management_practice";
  DROP TYPE "public"."enum_social_medias_verification_status";`)
}
