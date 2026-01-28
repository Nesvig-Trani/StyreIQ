import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "organization" ADD COLUMN "website_url" varchar;
    ALTER TABLE "organization" DROP COLUMN IF EXISTS "email";
    ALTER TABLE "organization" DROP COLUMN IF EXISTS "phone";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "organization" ADD COLUMN "email" varchar;
    ALTER TABLE "organization" ADD COLUMN "phone" varchar;
    ALTER TABLE "organization" DROP COLUMN IF EXISTS "website_url";
  `)
}
