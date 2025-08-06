import { OrganizationTypeEnum } from '../schemas'

export const organizationTypeOptions = [
  {
    value: OrganizationTypeEnum.HIGHER_EDUCATION_INSTITUTION,
    label: 'Higher Education Institution',
  },
  { value: OrganizationTypeEnum.GOVERNMENT_AGENCY, label: 'Government Agency' },
  { value: OrganizationTypeEnum.HEALTHCARE_SYSTEM, label: 'Healthcare System' },
  { value: OrganizationTypeEnum.CORPORATE_ENTERPRISE, label: 'Corporate Enterprise' },
  { value: OrganizationTypeEnum.NONPROFIT_ORGANIZATION, label: 'Nonprofit Organization' },
  { value: OrganizationTypeEnum.DIVISION, label: 'Division' },
  { value: OrganizationTypeEnum.SCHOOL_FACULTY, label: 'School/Faculty' },
  { value: OrganizationTypeEnum.DEPARTMENT, label: 'Department' },
  { value: OrganizationTypeEnum.OFFICE, label: 'Office' },
  { value: OrganizationTypeEnum.PROGRAM, label: 'Program' },
  { value: OrganizationTypeEnum.INITIATIVE, label: 'Initiative' },
  { value: OrganizationTypeEnum.OTHER, label: 'Other' },
]

export const industryLevelOptions = [
  {
    value: OrganizationTypeEnum.HIGHER_EDUCATION_INSTITUTION,
    label: 'Higher Education Institution',
  },
  { value: OrganizationTypeEnum.GOVERNMENT_AGENCY, label: 'Government Agency' },
  { value: OrganizationTypeEnum.HEALTHCARE_SYSTEM, label: 'Healthcare System' },
  { value: OrganizationTypeEnum.CORPORATE_ENTERPRISE, label: 'Corporate Enterprise' },
  { value: OrganizationTypeEnum.NONPROFIT_ORGANIZATION, label: 'Nonprofit Organization' },
  { value: OrganizationTypeEnum.OTHER, label: 'Other ' },
]

export const unitLevelOptions = [
  { value: OrganizationTypeEnum.DIVISION, label: 'Division' },
  { value: OrganizationTypeEnum.SCHOOL_FACULTY, label: 'School/Faculty' },
  { value: OrganizationTypeEnum.DEPARTMENT, label: 'Department' },
  { value: OrganizationTypeEnum.OFFICE, label: 'Office' },
  { value: OrganizationTypeEnum.PROGRAM, label: 'Program' },
  { value: OrganizationTypeEnum.INITIATIVE, label: 'Initiative' },
  { value: OrganizationTypeEnum.OTHER, label: 'Other' },
]
