import { platformLabelMap } from '@/features/social-medias/schemas'
import type { Flag } from '@/types/payload-types'
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

export const getFlagAffectedName = (flag: Flag): string => {
  const entity = flag.affectedEntity?.value
  if (entity && typeof entity === 'object' && 'name' in entity) return entity.name ?? ''

  if (!flag.accountUrl) return ''
  return flag.accountPlatform
    ? `${flag.accountUrl} (${platformLabelMap[flag.accountPlatform]})`
    : flag.accountUrl
}

export const isActivityStale = (dateString: string) => {
  const activityDate = new Date(dateString)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return activityDate < thirtyDaysAgo
}
