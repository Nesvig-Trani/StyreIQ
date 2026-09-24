import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_flags_account_platform" AS ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'other');
  ALTER TABLE "flags" ADD COLUMN "account_url" varchar;
  ALTER TABLE "flags" ADD COLUMN "account_platform" "enum_flags_account_platform";
  ALTER TABLE "flags" ADD COLUMN "access_issue" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "flags" DROP COLUMN IF EXISTS "account_url";
  ALTER TABLE "flags" DROP COLUMN IF EXISTS "account_platform";
  ALTER TABLE "flags" DROP COLUMN IF EXISTS "access_issue";
  DROP TYPE "public"."enum_flags_account_platform";`)
}
