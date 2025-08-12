import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // First, check if StyreIQ organization already exists
  const existingOrg = await db.execute(sql`
    SELECT "id" FROM "organization" WHERE "name" = 'StyreIQ'
  `)

  if (existingOrg.rows.length > 0) {
    console.log('StyreIQ organization already exists with ID:', existingOrg.rows[0].id)
    return
  }

  // Get the first SuperAdmin user to be the admin of StyreIQ
  const superAdmin = await db.execute(sql`
    SELECT "id" FROM "users" WHERE "role" = 'super_admin' ORDER BY "created_at" ASC LIMIT 1
  `)

  if (superAdmin.rows.length === 0) {
    console.log(
      'No SuperAdmin user found. StyreIQ organization will be created when the first user is created.',
    )
    return
  }

  const adminId = superAdmin.rows[0].id

  // Create the StyreIQ organization
  const result = await db.execute(sql`
    INSERT INTO "organization" (
      "name", 
      "type", 
      "admin_id", 
      "status", 
      "description", 
      "delegated_permissions", 
      "path", 
      "depth",
      "created_at", 
      "updated_at"
    ) VALUES (
      'StyreIQ',
      'corporate_enterprise',
      ${adminId},
      'active',
      'StyreIQ is the parent organization for all governance and compliance management',
      true,
      ${adminId},
      0,
      NOW(),
      NOW()
    ) RETURNING "id"
  `)

  console.log('StyreIQ organization created with ID:', result.rows[0]?.id)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Remove the StyreIQ organization
  await db.execute(sql`
    DELETE FROM "organization" WHERE "name" = 'StyreIQ'
  `)
}
