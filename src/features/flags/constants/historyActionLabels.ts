import { FlagHistoryActionsEnum } from '../schemas'

export const historyActionLabels: Record<FlagHistoryActionsEnum, string> = {
  [FlagHistoryActionsEnum.CREATED]: 'Created risk flag',
  [FlagHistoryActionsEnum.STATUS_CHANGED]: 'Changed status to',
  [FlagHistoryActionsEnum.COMMENT]: 'Added observation',
}
