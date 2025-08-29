import { FlagTypeEnum } from '../schemas'

export const flagTypeOptions = [
  { value: FlagTypeEnum.MISSING_2FA, label: 'Missing 2FA' },
  { value: FlagTypeEnum.OUTDATED_PASSWORD, label: 'Outdated Password' },
  { value: FlagTypeEnum.INCOMPLETE_TRAINING, label: 'Incomplete Training' },
  { value: FlagTypeEnum.UNACKNOWLEDGED_POLICIES, label: 'Unacknowledged Policies' },
  { value: FlagTypeEnum.INACTIVE_ACCOUNT, label: 'Inactive Account' },
  { value: FlagTypeEnum.NO_ASSIGNED_OWNER, label: 'No Assigned Owner' },
  { value: FlagTypeEnum.LEGAL_NOT_CONFIRMED, label: 'Legal Requirements Not Confirmed' },
  { value: FlagTypeEnum.INCIDENT_OPEN, label: 'Incident or Open Alert' },
  { value: FlagTypeEnum.SECURITY_RISK, label: 'Security Risk' },
  { value: FlagTypeEnum.INCOMPLETE_OFFBOARDING, label: 'Incomplete off boarding' },
]
