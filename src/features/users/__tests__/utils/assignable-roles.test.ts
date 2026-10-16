import { describe, expect, it } from 'vitest'
import { UserRolesEnum } from '@/shared/constants/user-roles'
import { getAssignableRoles } from '../../utils/assignableRoles'

const { SuperAdmin, CentralAdmin, UnitAdmin, SocialMediaManager } = UserRolesEnum

describe('getAssignableRoles', () => {
  it('should let a super admin assign every role', () => {
    expect(getAssignableRoles(SuperAdmin)).toEqual([
      SuperAdmin,
      CentralAdmin,
      UnitAdmin,
      SocialMediaManager,
    ])
  })

  it('should not let a central admin create super admins', () => {
    expect(getAssignableRoles(CentralAdmin)).toEqual([CentralAdmin, UnitAdmin, SocialMediaManager])
  })

  it('should limit a unit admin to unit admin and manager', () => {
    expect(getAssignableRoles(UnitAdmin)).toEqual([UnitAdmin, SocialMediaManager])
  })

  it('should limit a social media manager to their own role', () => {
    expect(getAssignableRoles(SocialMediaManager)).toEqual([SocialMediaManager])
  })

  it('should assign nothing when there is no role', () => {
    expect(getAssignableRoles(null)).toEqual([])
    expect(getAssignableRoles(undefined)).toEqual([])
  })
})
