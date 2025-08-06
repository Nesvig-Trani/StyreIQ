import { FlagSourceEnum } from '../schemas'

export const flagSourceLabels: Record<FlagSourceEnum, string> = {
  [FlagSourceEnum.MANUAL_FLAG]: 'Manually entered',
  [FlagSourceEnum.AUTOMATED_SYSTEM]: 'Auto generated',
}
