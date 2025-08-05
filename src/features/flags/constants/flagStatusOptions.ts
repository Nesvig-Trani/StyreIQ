import { FlagStatusEnum } from '../schemas'

export const flagStatusOptions = [
  { value: FlagStatusEnum.RESOLVED, label: 'Resolved' },
  { value: FlagStatusEnum.PENDING, label: 'Pending' },
  { value: FlagStatusEnum.NOT_APPLICABLE, label: 'Not applicable' },
]
