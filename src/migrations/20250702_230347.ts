import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "social_medias" ADD COLUMN "deactivation_reason" varchar;
  CREATE UNIQUE INDEX IF NOT EXISTS "social_medias_profile_url_idx" ON "social_medias" USING btree ("profile_url");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "social_medias_profile_url_idx";
  ALTER TABLE "social_medias" DROP COLUMN IF EXISTS "deactivation_reason";`)
}
