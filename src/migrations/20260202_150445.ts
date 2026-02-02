import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "social_medias" ALTER COLUMN "backup_admin_id" DROP NOT NULL;
;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "social_medias" ALTER COLUMN "backup_admin_id" SET NOT NULL;
;`)
}
