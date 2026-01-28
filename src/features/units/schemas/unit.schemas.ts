import { Organization, User } from '@/types/payload-types'
import { z } from 'zod'
import { paginationSchema } from '@/shared/schemas/pagination'
import { statusConfig } from '../constants/statusConfig'
import { typeConfig } from '../constants/typeConfig'
import { UserRolesEnum } from '@/features/users'

export enum UnitTypeEnum {
  HIGHER_EDUCATION_INSTITUTION = 'higher_education_institution',
  GOVERNMENT_AGENCY = 'government_agency',
  HEALTHCARE_SYSTEM = 'healthcare_system',
  CORPORATE_ENTERPRISE = 'corporate_enterprise',
  NONPROFIT_ORGANIZATION = 'nonprofit_organization',
  DIVISION = 'division',
  SCHOOL_FACULTY = 'school_faculty',
  DEPARTMENT = 'department',
  OFFICE = 'office',
  PROGRAM = 'program',
  INITIATIVE = 'initiative',
  OTHER = 'other',
}

const UnitType = z.nativeEnum(UnitTypeEnum)

export const createUnitFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, "Unit name can\'t exceed 100 characters"),
  type: UnitType,
  parent: z.string().optional(),
  admin: z.string().min(1, 'Admin is required'),
  backupAdmins: z.string().array().optional(),
  websiteUrl: z.string().url('Invalid website URL').or(z.literal('')).optional(),
  status: z.enum(['active', 'inactive', 'pending_review']),
  description: z.string().optional(),
  delegatedPermissions: z.boolean().optional(),
  tenant: z.number().nullable().optional(),
})

export const updateUnitFormSchema = createUnitFormSchema.extend({
  id: z.number(),
})

export type UnitWithChildren = Organization & {
  parentOrg?: number
  children?: UnitWithChildren[]
}

export type UnitWithDepth = {
  parentOrg: Organization
  admin: User
  backupAdmins?: User[]
  children?: { docs: Organization[] }
} & Organization

export type Tree = {
  id: number
  parent: number
  name: string
  depth: number
  admin: User
  status: string
  type: string
  children: Tree[]
}

export type CreateUnitFormProps = {
  userRole: UserRolesEnum | null
  users: User[]
  organizations: Organization[]
  defaultParentOrg?: string
  selectedTenantId: number | null
}

export type UpdateUnitFormProps = {
  users: User[]
  data?: UnitWithDepth | null
  organizations: UnitWithDepth[]
  user?: User | null
}

export const unitSearchSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending_review']).optional(),
  type: z.enum(['university', 'faculty', 'department', 'office', 'project']).optional(),
})

export type StatusType = keyof typeof statusConfig
export type UnitType = keyof typeof typeConfig

export interface FlattenedTree extends Tree {
  level: number
  originalData?: UnitWithChildren
}

export interface UnitHierarchyProps {
  organizations: Tree[]
  originalData: UnitWithDepth[]
  users: User[]
  user?: User | null
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
}

export type CreateUnit = z.infer<typeof createUnitFormSchema>
