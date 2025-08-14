import { UnitTypeEnum } from '../schemas'

export const unitTypeLabels: Record<UnitTypeEnum, string> = {
  [UnitTypeEnum.HIGHER_EDUCATION_INSTITUTION]: 'Higher Education Institution',
  [UnitTypeEnum.GOVERNMENT_AGENCY]: 'Government Agency',
  [UnitTypeEnum.HEALTHCARE_SYSTEM]: 'Healthcare System',
  [UnitTypeEnum.CORPORATE_ENTERPRISE]: 'Corporate Enterprise',
  [UnitTypeEnum.NONPROFIT_ORGANIZATION]: 'Nonprofit Organization',
  [UnitTypeEnum.OTHER]: 'Other (please specify)',

  [UnitTypeEnum.DIVISION]: 'Division',
  [UnitTypeEnum.SCHOOL_FACULTY]: 'School/Faculty',
  [UnitTypeEnum.DEPARTMENT]: 'Department',
  [UnitTypeEnum.OFFICE]: 'Office',
  [UnitTypeEnum.PROGRAM]: 'Program',
  [UnitTypeEnum.INITIATIVE]: 'Initiative',
}
