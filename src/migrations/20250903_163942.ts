import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_social_media_posts_media_urls_type" AS ENUM('image', 'video', 'audio', 'document', 'other');
  CREATE TYPE "public"."enum_social_media_posts_platform" AS ENUM('youtube', 'twitter', 'facebook', 'instagram', 'linkedin', 'tiktok', 'other');
  CREATE TABLE IF NOT EXISTS "social_media_posts_media_urls" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"type" "enum_social_media_posts_media_urls_type"
  );
  
  CREATE TABLE IF NOT EXISTS "social_media_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" "enum_social_media_posts_platform" NOT NULL,
  	"social_media_id" integer NOT NULL,
  	"external_id" varchar NOT NULL,
  	"author" varchar NOT NULL,
  	"author_id" varchar,
  	"content" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"engagement_views" numeric DEFAULT 0,
  	"engagement_likes" numeric DEFAULT 0,
  	"engagement_comments" numeric DEFAULT 0,
  	"engagement_shares" numeric DEFAULT 0,
  	"engagement_retweets" numeric DEFAULT 0,
  	"engagement_quotes" numeric DEFAULT 0,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"scraped_at" timestamp(3) with time zone NOT NULL,
  	"is_latest" boolean DEFAULT false,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "social_media_posts_id" integer;
  DO $$ BEGIN
   ALTER TABLE "social_media_posts_media_urls" ADD CONSTRAINT "social_media_posts_media_urls_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."social_media_posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_social_media_id_social_medias_id_fk" FOREIGN KEY ("social_media_id") REFERENCES "public"."social_medias"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "social_media_posts_media_urls_order_idx" ON "social_media_posts_media_urls" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "social_media_posts_media_urls_parent_id_idx" ON "social_media_posts_media_urls" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "social_media_posts_social_media_idx" ON "social_media_posts" USING btree ("social_media_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "social_media_posts_external_id_idx" ON "social_media_posts" USING btree ("external_id");
  CREATE INDEX IF NOT EXISTS "social_media_posts_updated_at_idx" ON "social_media_posts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "social_media_posts_created_at_idx" ON "social_media_posts" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_social_media_posts_fk" FOREIGN KEY ("social_media_posts_id") REFERENCES "public"."social_media_posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_social_media_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("social_media_posts_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "social_media_posts_media_urls" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "social_media_posts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "social_media_posts_media_urls" CASCADE;
  DROP TABLE "social_media_posts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_social_media_posts_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_social_media_posts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "social_media_posts_id";
  DROP TYPE "public"."enum_social_media_posts_media_urls_type";
  DROP TYPE "public"."enum_social_media_posts_platform";`)
}
