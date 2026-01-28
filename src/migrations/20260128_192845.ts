import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants" 
    ADD COLUMN IF NOT EXISTS "governance_settings_password_confirmation_cadence_days" numeric DEFAULT 180;
    
    UPDATE "tenants"
    SET "governance_settings_password_confirmation_cadence_days" = 
      COALESCE("governance_settings_user_password_cadence_days", 180)
    WHERE "governance_settings_password_confirmation_cadence_days" IS NULL;
    
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "governance_settings_user_password_cadence_days";
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "governance_settings_shared_password_cadence_days";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants" 
    ADD COLUMN IF NOT EXISTS "governance_settings_user_password_cadence_days" numeric DEFAULT 180;
    
    ALTER TABLE "tenants" 
    ADD COLUMN IF NOT EXISTS "governance_settings_shared_password_cadence_days" numeric DEFAULT 180;
    
    UPDATE "tenants"
    SET "governance_settings_user_password_cadence_days" = "governance_settings_password_confirmation_cadence_days",
        "governance_settings_shared_password_cadence_days" = "governance_settings_password_confirmation_cadence_days"
    WHERE "governance_settings_password_confirmation_cadence_days" IS NOT NULL;
    
    ALTER TABLE "tenants" DROP COLUMN IF EXISTS "governance_settings_password_confirmation_cadence_days";
  `)
}
