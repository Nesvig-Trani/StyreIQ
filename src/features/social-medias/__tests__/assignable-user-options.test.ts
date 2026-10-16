import { describe, expect, it } from 'vitest'
import { UserRolesEnum } from '@/shared/constants/user-roles'
import { buildUser } from '@/shared/__tests__/fixtures'
import { getAssignableUserOptions } from '../utils/assignable-user-options'

const users = [
  buildUser({ id: 1, name: 'Daniela Cárdenas', roles: ['unit_admin'] }),
  buildUser({
    id: 2,
    name: 'Sebastián Peña',
    roles: ['unit_admin', 'social_media_manager'],
    status: 'pending_activation',
  }),
  buildUser({ id: 3, name: 'Laura Vélez', roles: ['social_media_manager'] }),
]

describe('getAssignableUserOptions', () => {
  it('should list only users holding the requested role, with string ids', () => {
    expect(getAssignableUserOptions(users, UserRolesEnum.UnitAdmin)).toEqual([
      { value: '1', label: 'Daniela Cárdenas' },
      { value: '2', label: 'Sebastián Peña (Pending)' },
    ])
  })

  it('should flag users who have not activated their account', () => {
    const options = getAssignableUserOptions(users, UserRolesEnum.SocialMediaManager)
    expect(options.map((o) => o.label)).toEqual(['Sebastián Peña (Pending)', 'Laura Vélez'])
  })

  it('should return nothing when nobody holds the role', () => {
    expect(getAssignableUserOptions(users, UserRolesEnum.CentralAdmin)).toEqual([])
  })
})
