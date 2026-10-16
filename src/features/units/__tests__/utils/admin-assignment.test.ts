import { describe, expect, it } from 'vitest'
import {
  UNASSIGNED_ADMIN_VALUE,
  toAdminId,
  unassignedAdminOption,
} from '../../constants/adminAssignment'
import { buildAccessibleUnitFilter } from '../../plugins/utils'
import { buildOrganization } from '@/shared/__tests__/fixtures'

describe('toAdminId (clearing the backup/unit admin)', () => {
  it('should map the "not assigned" option to null so the admin can be cleared', () => {
    expect(toAdminId(UNASSIGNED_ADMIN_VALUE)).toBeNull()
    expect(toAdminId(unassignedAdminOption.value)).toBeNull()
  })

  it('should map empty values to null', () => {
    expect(toAdminId(undefined)).toBeNull()
    expect(toAdminId(null)).toBeNull()
    expect(toAdminId('')).toBeNull()
  })

  it('should convert a selected user id to a number', () => {
    expect(toAdminId('42')).toBe(42)
  })
})

describe('buildAccessibleUnitFilter', () => {
  it('should match each accessible unit and its descendants, excluding disabled units', () => {
    const where = buildAccessibleUnitFilter({
      orgs: [buildOrganization({ id: 5 }), buildOrganization({ id: 9 })],
    })
    expect(where).toEqual({
      and: [
        {
          or: [
            { id: { equals: 5 } },
            { path: { contains: 5 } },
            { id: { equals: 9 } },
            { path: { contains: 9 } },
          ],
        },
        { disabled: { not_equals: true } },
      ],
    })
  })
})
