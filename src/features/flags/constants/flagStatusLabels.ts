import { FlagStatusEnum } from '../schemas'

export const flagStatusLabels: Record<FlagStatusEnum, string> = {
  [FlagStatusEnum.RESOLVED]: 'Resolved',
  [FlagStatusEnum.PENDING]: 'Pending',
  [FlagStatusEnum.NOT_APPLICABLE]: 'Not applicable',
  [FlagStatusEnum.IN_PROGRESS]: 'In progress',
}
