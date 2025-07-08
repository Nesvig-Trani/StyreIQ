import { FlagTypeEnum } from '../schemas'

export const flagTypeLabels: Record<FlagTypeEnum, string> = {
  [FlagTypeEnum.NO_PRIMARY_ADMIN]: 'No Primary Administrator',
  [FlagTypeEnum.INCOMPLETE_TRAINING]: 'Incomplete Training',
}
