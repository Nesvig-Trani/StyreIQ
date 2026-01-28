import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants" RENAME COLUMN "admin_contact" TO "admin_contact_email";
  `)

  await db.execute(sql`
    ALTER TABLE "tenants" ADD COLUMN "admin_contact_name" varchar;
  `)

  await db.execute(sql`
    UPDATE "tenants" 
    SET "admin_contact_name" = 'Admin Contact' 
    WHERE "admin_contact_name" IS NULL;
  `)

  await db.execute(sql`
    ALTER TABLE "tenants" 
    ALTER COLUMN "admin_contact_name" SET NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants" RENAME COLUMN "admin_contact_email" TO "admin_contact";
  `)

  await db.execute(sql`
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "admin_contact_name";
  `)
}
