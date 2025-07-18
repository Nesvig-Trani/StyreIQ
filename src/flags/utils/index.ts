import { FlagStatusEnum } from '../schemas'

export const getStatusColor = (status: FlagStatusEnum) => {
  switch (status) {
    case FlagStatusEnum.PENDING:
      return 'destructive'
    case FlagStatusEnum.RESOLVED:
      return 'default'
    case FlagStatusEnum.NOT_APPLICABLE:
      return 'secondary'
    default:
      return 'outline'
  }
}

export const isActivityStale = (dateString: string) => {
  const activityDate = new Date(dateString)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return activityDate < thirtyDaysAgo
}
