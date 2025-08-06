import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "social_medias_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  DO $$ BEGIN
   ALTER TABLE "social_medias_rels" ADD CONSTRAINT "social_medias_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."social_medias"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "social_medias_rels" ADD CONSTRAINT "social_medias_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "social_medias_rels_order_idx" ON "social_medias_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "social_medias_rels_parent_idx" ON "social_medias_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "social_medias_rels_path_idx" ON "social_medias_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "social_medias_rels_users_id_idx" ON "social_medias_rels" USING btree ("users_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "social_medias_rels" CASCADE;`)
}
