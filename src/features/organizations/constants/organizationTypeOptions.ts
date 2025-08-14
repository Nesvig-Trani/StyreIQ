import { UnitTypeEnum } from '../schemas'

export const unitTypeOptions = [
  {
    value: UnitTypeEnum.HIGHER_EDUCATION_INSTITUTION,
    label: 'Higher Education Institution',
  },
  { value: UnitTypeEnum.GOVERNMENT_AGENCY, label: 'Government Agency' },
  { value: UnitTypeEnum.HEALTHCARE_SYSTEM, label: 'Healthcare System' },
  { value: UnitTypeEnum.CORPORATE_ENTERPRISE, label: 'Corporate Enterprise' },
  { value: UnitTypeEnum.NONPROFIT_ORGANIZATION, label: 'Nonprofit Organization' },
  { value: UnitTypeEnum.DIVISION, label: 'Division' },
  { value: UnitTypeEnum.SCHOOL_FACULTY, label: 'School/Faculty' },
  { value: UnitTypeEnum.DEPARTMENT, label: 'Department' },
  { value: UnitTypeEnum.OFFICE, label: 'Office' },
  { value: UnitTypeEnum.PROGRAM, label: 'Program' },
  { value: UnitTypeEnum.INITIATIVE, label: 'Initiative' },
  { value: UnitTypeEnum.OTHER, label: 'Other' },
]

export const industryLevelOptions = [
  {
    value: UnitTypeEnum.HIGHER_EDUCATION_INSTITUTION,
    label: 'Higher Education Institution',
  },
  { value: UnitTypeEnum.GOVERNMENT_AGENCY, label: 'Government Agency' },
  { value: UnitTypeEnum.HEALTHCARE_SYSTEM, label: 'Healthcare System' },
  { value: UnitTypeEnum.CORPORATE_ENTERPRISE, label: 'Corporate Enterprise' },
  { value: UnitTypeEnum.NONPROFIT_ORGANIZATION, label: 'Nonprofit Organization' },
  { value: UnitTypeEnum.OTHER, label: 'Other ' },
]

export const unitLevelOptions = [
  { value: UnitTypeEnum.DIVISION, label: 'Division' },
  { value: UnitTypeEnum.SCHOOL_FACULTY, label: 'School/Faculty' },
  { value: UnitTypeEnum.DEPARTMENT, label: 'Department' },
  { value: UnitTypeEnum.OFFICE, label: 'Office' },
  { value: UnitTypeEnum.PROGRAM, label: 'Program' },
  { value: UnitTypeEnum.INITIATIVE, label: 'Initiative' },
  { value: UnitTypeEnum.OTHER, label: 'Other' },
]
