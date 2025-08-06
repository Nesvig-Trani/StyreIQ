import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'user_creation';
  ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'password_recovery';
  ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'password_reset';
  ALTER TABLE "audit_log" ADD COLUMN "metadata" jsonb;
  ALTER TABLE "public"."social_medias" ALTER COLUMN "platform" SET DATA TYPE text;
  DROP TYPE "public"."enum_social_medias_platform";
  CREATE TYPE "public"."enum_social_medias_platform" AS ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'other');
  ALTER TABLE "public"."social_medias" ALTER COLUMN "platform" SET DATA TYPE "public"."enum_social_medias_platform" USING "platform"::"public"."enum_social_medias_platform";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "audit_log" DROP COLUMN IF EXISTS "metadata";
  ALTER TABLE "public"."social_medias" ALTER COLUMN "platform" SET DATA TYPE text;
  DROP TYPE "public"."enum_social_medias_platform";
  CREATE TYPE "public"."enum_social_medias_platform" AS ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'Other');
  ALTER TABLE "public"."social_medias" ALTER COLUMN "platform" SET DATA TYPE "public"."enum_social_medias_platform" USING "platform"::"public"."enum_social_medias_platform";
  ALTER TABLE "public"."audit_log" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_log_action";
  CREATE TYPE "public"."enum_audit_log_action" AS ENUM('create', 'update', 'delete', 'approval', 'flag_resolution', 'policy_acknowledgment');
  ALTER TABLE "public"."audit_log" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_log_action" USING "action"::"public"."enum_audit_log_action";`)
}
