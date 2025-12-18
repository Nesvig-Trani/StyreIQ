import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_role_requests_requested_role" AS ENUM('unit_admin', 'social_media_manager', 'central_admin');
  CREATE TYPE "public"."enum_role_requests_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TABLE IF NOT EXISTS "role_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"requested_role" "enum_role_requests_requested_role" NOT NULL,
  	"unit_id_id" integer,
  	"justification" varchar NOT NULL,
  	"status" "enum_role_requests_status" DEFAULT 'pending' NOT NULL,
  	"approved_by_id" integer,
  	"review_notes" varchar,
  	"tenant_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "role_requests_id" integer;
  DO $$ BEGIN
   ALTER TABLE "role_requests" ADD CONSTRAINT "role_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "role_requests" ADD CONSTRAINT "role_requests_unit_id_id_organization_id_fk" FOREIGN KEY ("unit_id_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "role_requests" ADD CONSTRAINT "role_requests_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "role_requests" ADD CONSTRAINT "role_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "role_requests_user_idx" ON "role_requests" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "role_requests_unit_id_idx" ON "role_requests" USING btree ("unit_id_id");
  CREATE INDEX IF NOT EXISTS "role_requests_approved_by_idx" ON "role_requests" USING btree ("approved_by_id");
  CREATE INDEX IF NOT EXISTS "role_requests_tenant_idx" ON "role_requests" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "role_requests_updated_at_idx" ON "role_requests" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "role_requests_created_at_idx" ON "role_requests" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_role_requests_fk" FOREIGN KEY ("role_requests_id") REFERENCES "public"."role_requests"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_role_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("role_requests_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "role_requests" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "role_requests" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_role_requests_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_role_requests_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "role_requests_id";
  DROP TYPE "public"."enum_role_requests_requested_role";
  DROP TYPE "public"."enum_role_requests_status";`)
}
