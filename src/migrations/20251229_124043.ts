import { MigrateUpArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN

      IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'central_admin'
          AND enumtypid = 'public.enum_role_requests_requested_role'::regtype
      ) THEN
        ALTER TYPE "public"."enum_role_requests_requested_role" ADD VALUE 'central_admin';
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'task_completed'
          AND enumtypid = 'public.enum_audit_log_action'::regtype
      ) THEN
        ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'task_completed';
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'training_completed'
          AND enumtypid = 'public.enum_audit_log_action'::regtype
      ) THEN
        ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'training_completed';
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'password_setup_completed'
          AND enumtypid = 'public.enum_audit_log_action'::regtype
      ) THEN
        ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'password_setup_completed';
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'roll_call_completed'
          AND enumtypid = 'public.enum_audit_log_action'::regtype
      ) THEN
        ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'roll_call_completed';
      END IF;
    END$$;

    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "is_completed_training_compliance" boolean,
      ADD COLUMN IF NOT EXISTS "is_completed_training_governance" boolean;
  `)
}

export async function down(): Promise<void> {
  throw new Error('This migration cannot be reverted safely')
}
