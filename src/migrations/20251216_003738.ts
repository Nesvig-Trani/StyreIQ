import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_users_active_role" AS ENUM(
      'super_admin', 
      'central_admin', 
      'unit_admin', 
      'social_media_manager'
    );
    
    ALTER TYPE "public"."enum_users_role" RENAME TO "enum_users_roles";
    
    CREATE TABLE IF NOT EXISTS "users_roles" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_users_roles",
      "id" serial PRIMARY KEY NOT NULL
    );
    
    ALTER TABLE "users" ADD COLUMN "active_role" "enum_users_active_role";
    
    INSERT INTO "users_roles" ("parent_id", "order", "value")
    SELECT 
      id,
      1 as "order",
      "role"::text::"enum_users_roles" as "value"
    FROM "users"
    WHERE "role" IS NOT NULL;
    
    UPDATE "users"
    SET "active_role" = "role"::text::"enum_users_active_role"
    WHERE "role" IS NOT NULL;
    
    DO $$ BEGIN
      ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" 
        FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") 
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    
    CREATE INDEX IF NOT EXISTS "users_roles_order_idx" 
      ON "users_roles" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "users_roles_parent_idx" 
      ON "users_roles" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "users_active_role_idx" 
      ON "users" USING btree ("active_role");
    
    ALTER TABLE "users" DROP COLUMN IF EXISTS "role";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_users_roles" RENAME TO "enum_users_role";
    
    ALTER TABLE "users" ADD COLUMN "role" "enum_users_role";
    
    UPDATE "users"
    SET "role" = (
      SELECT "value"::text::"enum_users_role"
      FROM "users_roles"
      WHERE "users_roles"."parent_id" = "users"."id"
      ORDER BY "order" ASC
      LIMIT 1
    )
    WHERE EXISTS (
      SELECT 1 FROM "users_roles" WHERE "users_roles"."parent_id" = "users"."id"
    );
    
    DROP TABLE "users_roles" CASCADE;
    
    ALTER TABLE "users" DROP COLUMN IF EXISTS "active_role";
    
    DROP TYPE "public"."enum_users_active_role";
  `)
}
