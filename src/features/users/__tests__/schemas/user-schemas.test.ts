import { describe, expect, it } from 'vitest'
import {
  createFirstUserFormSchema,
  createUserFormSchema,
  createWelcomeEmailSchema,
  forgotPasswordSchema,
  roleLabelMap,
  statusColorMap,
  statusLabelMap,
  updateUserSchema,
  userSearchSchema,
  UserRolesEnum,
  UserStatusEnum,
} from '../../schemas'

const validUser = {
  name: 'Laura Pineda',
  email: 'laura.pineda@universidad-andina.edu',
  roles: [UserRolesEnum.SocialMediaManager],
  organizations: ['100'],
}

const issueMessages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? []

describe('createUserFormSchema', () => {
  it('should accept a social media manager assigned to a unit', () => {
    expect(createUserFormSchema.safeParse(validUser).success).toBe(true)
  })

  it('should require at least one role', () => {
    const result = createUserFormSchema.safeParse({ ...validUser, roles: [] })
    expect(issueMessages(result)).toContain('At least one role is required')
  })

  it('should require a unit unless the user is a super admin', () => {
    const result = createUserFormSchema.safeParse({ ...validUser, organizations: [] })
    expect(issueMessages(result)).toContain('Unit is required unless the user is Super Admin.')
  })

  it('should allow super admins without units', () => {
    const result = createUserFormSchema.safeParse({
      ...validUser,
      roles: [UserRolesEnum.SuperAdmin],
      organizations: undefined,
    })
    expect(result.success).toBe(true)
  })

  it('should reject combining super admin with other roles', () => {
    const result = createUserFormSchema.safeParse({
      ...validUser,
      roles: [UserRolesEnum.SuperAdmin, UserRolesEnum.UnitAdmin],
    })
    expect(issueMessages(result)).toContain('Super Admin cannot be combined with other roles.')
  })

  it('should reject short passwords but allow omitting the password', () => {
    expect(
      issueMessages(createUserFormSchema.safeParse({ ...validUser, password: 'corta' })),
    ).toContain('Password should have at least 8 characters')
    expect(createUserFormSchema.safeParse({ ...validUser, password: 'ClaveSegura1' }).success).toBe(
      true,
    )
  })

  it('should reject malformed emails', () => {
    expect(createUserFormSchema.safeParse({ ...validUser, email: 'laura' }).success).toBe(false)
  })
})

describe('updateUserSchema', () => {
  it('should require a numeric id', () => {
    expect(updateUserSchema.safeParse({ ...validUser, id: '4' }).success).toBe(false)
    expect(updateUserSchema.safeParse({ ...validUser, id: 4 }).success).toBe(true)
  })

  it('should coerce valid password update timestamps and reject unparseable ones', () => {
    const valid = updateUserSchema.parse({ ...validUser, id: 4, passwordUpdatedAt: '2026-09-01' })
    expect(valid.passwordUpdatedAt).toBeInstanceOf(Date)
    const invalid = updateUserSchema.safeParse({ ...validUser, id: 4, passwordUpdatedAt: 'ayer' })
    expect(invalid.success).toBe(false)
  })
})

describe('createFirstUserFormSchema', () => {
  it('should require a password of at least 8 characters', () => {
    const base = { name: 'Camila Ortega', email: 'camila.ortega@styreiq.com' }
    expect(createFirstUserFormSchema.safeParse({ ...base, password: '1234567' }).success).toBe(
      false,
    )
    expect(createFirstUserFormSchema.safeParse({ ...base, password: '12345678' }).success).toBe(
      true,
    )
  })
})

describe('forgotPasswordSchema', () => {
  it('should validate the email address', () => {
    expect(
      forgotPasswordSchema.safeParse({ email: 'valentina@universidad-andina.edu' }).success,
    ).toBe(true)
    expect(forgotPasswordSchema.safeParse({ email: 'valentina' }).success).toBe(false)
  })
})

describe('userSearchSchema', () => {
  it('should coerce the tenant filter to a string', () => {
    expect(userSearchSchema.parse({ tenant: 10 }).tenant).toBe('10')
  })
})

describe('createWelcomeEmailSchema', () => {
  it('should require valid urls for policy links', () => {
    const result = createWelcomeEmailSchema.safeParse({
      instructions: 'Bienvenida',
      policyLinks: [{ title: 'Política', url: 'no-es-una-url' }],
    })
    expect(result.success).toBe(false)
  })
})

describe('label maps', () => {
  it('should provide a label for every role and status', () => {
    Object.values(UserRolesEnum).forEach((role) => expect(roleLabelMap[role]).toBeTruthy())
    Object.values(UserStatusEnum).forEach((status) => {
      expect(statusLabelMap[status]).toBeTruthy()
      expect(statusColorMap[status]).toBeTruthy()
    })
  })
})
