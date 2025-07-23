import { OrganizationTypeEnum } from '../schemas'

export const organizationTypeLabels: Record<OrganizationTypeEnum, string> = {
  [OrganizationTypeEnum.HIGHER_EDUCATION_INSTITUTION]: 'Higher Education Institution',
  [OrganizationTypeEnum.GOVERNMENT_AGENCY]: 'Government Agency',
  [OrganizationTypeEnum.HEALTHCARE_SYSTEM]: 'Healthcare System',
  [OrganizationTypeEnum.CORPORATE_ENTERPRISE]: 'Corporate Enterprise',
  [OrganizationTypeEnum.NONPROFIT_ORGANIZATION]: 'Nonprofit Organization',
  [OrganizationTypeEnum.OTHER]: 'Other (please specify)',

  [OrganizationTypeEnum.DIVISION]: 'Division',
  [OrganizationTypeEnum.SCHOOL_FACULTY]: 'School/Faculty',
  [OrganizationTypeEnum.DEPARTMENT]: 'Department',
  [OrganizationTypeEnum.OFFICE]: 'Office',
  [OrganizationTypeEnum.PROGRAM]: 'Program',
  [OrganizationTypeEnum.INITIATIVE]: 'Initiative',
}
