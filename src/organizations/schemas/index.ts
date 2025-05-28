import { Organization, User } from '@/payload-types'
import { z } from 'zod'
import { paginationSchema } from '@/schemas/pagination'

export const createOrgFormSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['university', 'faculty', 'department', 'office', 'project']),
  parent: z.string().optional(),
  admin: z.string().optional(),
  backupAdmins: z.string().array().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending_review']),
  description: z.string().optional(),
  delegatedPermissions: z.boolean().optional(),
})

export type OrganizationWithChildren = Organization & {
  parentOrg?: number
  children?: OrganizationWithChildren[]
}

export type Tree = {
  id: number | string
  parent: number
  name: string
  depth: number
  children: Tree[]
}

export type CreateOrgFormProps = {
  users: User[]
  organizations: Organization[]
}

export const organizationSearchSchema = paginationSchema.extend({})
