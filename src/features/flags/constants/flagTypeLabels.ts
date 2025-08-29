import { FlagTypeEnum } from '../schemas'

export const flagTypeLabels: Record<FlagTypeEnum, string> = {
  [FlagTypeEnum.MISSING_2FA]: 'Missing 2FA',
  [FlagTypeEnum.OUTDATED_PASSWORD]: 'Outdated Password',
  [FlagTypeEnum.INCOMPLETE_TRAINING]: 'Incomplete Training',
  [FlagTypeEnum.UNACKNOWLEDGED_POLICIES]: 'Unacknowledged Policies',
  [FlagTypeEnum.INACTIVE_ACCOUNT]: 'Inactive Account',
  [FlagTypeEnum.NO_ASSIGNED_OWNER]: 'No Assigned Owner',
  [FlagTypeEnum.LEGAL_NOT_CONFIRMED]: 'Legal Requirements Not Confirmed',
  [FlagTypeEnum.INCIDENT_OPEN]: 'Incident or Open Alert',
  [FlagTypeEnum.SECURITY_RISK]: 'Security Risk',
  [FlagTypeEnum.INCOMPLETE_OFFBOARDING]: 'Incomplete off boarding',
}
