import { JSON_HEADERS } from '@/shared/constants'
import { env } from '@/config/env'
import { User } from '@/types/payload-types'

export const fetchFilteredUsers = async (parentOrgId: string, parentOrgName?: string) => {
  try {
    const params = new URLSearchParams()
    if (parentOrgId) {
      params.append('parentOrgId', parentOrgId)
    }
    if (parentOrgName) {
      params.append('parentOrgName', parentOrgName)
    }

    const response = await fetch(
      `${env.NEXT_PUBLIC_BASE_URL}/api/organization/filtered-users?${params}`,
      {
        method: 'GET',
        headers: JSON_HEADERS,
        credentials: 'include',
      },
    )
    if (response.ok) {
      const data = await response.json()
      return (data.docs as User[]) || []
    } else {
      console.error('Failed to fetch filtered users')
      return [] as User[]
    }
  } catch (error) {
    console.error('Error fetching filtered users:', error)
    throw new Error('Error fetching filtered users')
  }
}
