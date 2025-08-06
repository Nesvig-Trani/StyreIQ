import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "welcome_emails_responsibilities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"responsibility" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "welcome_emails_policy_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "welcome_emails" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"instructions" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "welcome_emails_id" integer;
  DO $$ BEGIN
   ALTER TABLE "welcome_emails_responsibilities" ADD CONSTRAINT "welcome_emails_responsibilities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."welcome_emails"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "welcome_emails_policy_links" ADD CONSTRAINT "welcome_emails_policy_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."welcome_emails"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "welcome_emails_responsibilities_order_idx" ON "welcome_emails_responsibilities" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "welcome_emails_responsibilities_parent_id_idx" ON "welcome_emails_responsibilities" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "welcome_emails_policy_links_order_idx" ON "welcome_emails_policy_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "welcome_emails_policy_links_parent_id_idx" ON "welcome_emails_policy_links" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "welcome_emails_updated_at_idx" ON "welcome_emails" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "welcome_emails_created_at_idx" ON "welcome_emails" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_welcome_emails_fk" FOREIGN KEY ("welcome_emails_id") REFERENCES "public"."welcome_emails"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_welcome_emails_id_idx" ON "payload_locked_documents_rels" USING btree ("welcome_emails_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "welcome_emails_responsibilities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "welcome_emails_policy_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "welcome_emails" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "welcome_emails_responsibilities" CASCADE;
  DROP TABLE "welcome_emails_policy_links" CASCADE;
  DROP TABLE "welcome_emails" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_welcome_emails_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_welcome_emails_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "welcome_emails_id";`)
}
