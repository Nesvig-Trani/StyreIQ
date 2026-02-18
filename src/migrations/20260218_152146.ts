import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "public"."social_medias_linked_tools" ALTER COLUMN "value" DROP DEFAULT;
    ALTER TABLE "public"."social_medias_linked_tools" ALTER COLUMN "value" TYPE text;
    
    UPDATE "public"."social_medias_linked_tools"
    SET "value" = CASE
      WHEN "value" = 'Hootsuite' THEN 'hootsuite'
      WHEN "value" = 'Canva' THEN 'other'
      WHEN "value" = 'Sprout' THEN 'sprout_social'
      WHEN "value" = 'Other' THEN 'other'
      ELSE "value"
    END;
    
    DROP TYPE "public"."enum_social_medias_linked_tools";
    CREATE TYPE "public"."enum_social_medias_linked_tools" AS ENUM('hootsuite', 'sprout_social', 'buffer', 'later', 'agorapulse', 'sprinklr', 'meta_business_manager', 'linkedin_business_manager', 'tiktok_business_center', 'x_ads_manager', 'youtube_studio', 'other');
    ALTER TABLE "public"."social_medias_linked_tools" ALTER COLUMN "value" TYPE "public"."enum_social_medias_linked_tools" USING "value"::text::"public"."enum_social_medias_linked_tools";
    
    ALTER TABLE "public"."social_medias" ALTER COLUMN "third_party_management" DROP DEFAULT;
    ALTER TABLE "public"."social_medias" ALTER COLUMN "third_party_management" TYPE text;
    
    UPDATE "public"."social_medias"
    SET "third_party_management" = CASE
      WHEN "third_party_management" = 'yes' THEN 'yes_managed_externally'
      WHEN "third_party_management" = 'no' THEN 'no_managed_internally'
      ELSE "third_party_management"
    END
    WHERE "third_party_management" IS NOT NULL;
    
    DROP TYPE "public"."enum_social_medias_third_party_management";
    CREATE TYPE "public"."enum_social_medias_third_party_management" AS ENUM('no_managed_internally', 'yes_managed_externally');
    ALTER TABLE "public"."social_medias" ALTER COLUMN "third_party_management" TYPE "public"."enum_social_medias_third_party_management" USING "third_party_management"::text::"public"."enum_social_medias_third_party_management";
    
    ALTER TABLE "public"."social_medias" ALTER COLUMN "password_management_practice" DROP DEFAULT;
    ALTER TABLE "public"."social_medias" ALTER COLUMN "password_management_practice" TYPE text;
    
    UPDATE "public"."social_medias"
    SET "password_management_practice" = CASE
      WHEN "password_management_practice" = 'Password Manager' THEN 'password_manager_shared'
      WHEN "password_management_practice" = 'Manual' THEN 'shared_manual'
      WHEN "password_management_practice" = 'Other' THEN 'other'
      ELSE "password_management_practice"
    END
    WHERE "password_management_practice" IS NOT NULL;
    
    DROP TYPE "public"."enum_social_medias_password_management_practice";
    CREATE TYPE "public"."enum_social_medias_password_management_practice" AS ENUM('password_manager_shared', 'shared_manual', 'individual_logins', 'other');
    ALTER TABLE "public"."social_medias" ALTER COLUMN "password_management_practice" TYPE "public"."enum_social_medias_password_management_practice" USING "password_management_practice"::text::"public"."enum_social_medias_password_management_practice";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "public"."social_medias_linked_tools" ALTER COLUMN "value" TYPE text;
    
    UPDATE "public"."social_medias_linked_tools"
    SET "value" = CASE
      WHEN "value" = 'hootsuite' THEN 'Hootsuite'
      WHEN "value" = 'sprout_social' THEN 'Sprout'
      ELSE 'Other'
    END;
    
    DROP TYPE "public"."enum_social_medias_linked_tools";
    CREATE TYPE "public"."enum_social_medias_linked_tools" AS ENUM('Hootsuite', 'Canva', 'Sprout', 'Other');
    ALTER TABLE "public"."social_medias_linked_tools" ALTER COLUMN "value" TYPE "public"."enum_social_medias_linked_tools" USING "value"::text::"public"."enum_social_medias_linked_tools";
    
    ALTER TABLE "public"."social_medias" ALTER COLUMN "third_party_management" TYPE text;
    
    UPDATE "public"."social_medias"
    SET "third_party_management" = CASE
      WHEN "third_party_management" = 'yes_managed_externally' THEN 'yes'
      WHEN "third_party_management" = 'no_managed_internally' THEN 'no'
      ELSE "third_party_management"
    END
    WHERE "third_party_management" IS NOT NULL;
    
    DROP TYPE "public"."enum_social_medias_third_party_management";
    CREATE TYPE "public"."enum_social_medias_third_party_management" AS ENUM('yes', 'no');
    ALTER TABLE "public"."social_medias" ALTER COLUMN "third_party_management" TYPE "public"."enum_social_medias_third_party_management" USING "third_party_management"::text::"public"."enum_social_medias_third_party_management";
    
    ALTER TABLE "public"."social_medias" ALTER COLUMN "password_management_practice" TYPE text;
    
    UPDATE "public"."social_medias"
    SET "password_management_practice" = CASE
      WHEN "password_management_practice" = 'password_manager_shared' THEN 'Password Manager'
      WHEN "password_management_practice" = 'shared_manual' THEN 'Manual'
      ELSE 'Other'
    END
    WHERE "password_management_practice" IS NOT NULL;
    
    DROP TYPE "public"."enum_social_medias_password_management_practice";
    CREATE TYPE "public"."enum_social_medias_password_management_practice" AS ENUM('Password Manager', 'Manual', 'Other');
    ALTER TABLE "public"."social_medias" ALTER COLUMN "password_management_practice" TYPE "public"."enum_social_medias_password_management_practice" USING "password_management_practice"::text::"public"."enum_social_medias_password_management_practice";
  `)
}
