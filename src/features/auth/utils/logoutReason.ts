export const LOGOUT_REASON_PARAM = 'reason'

export const LOGOUT_REASONS = {
  policyRejected: 'policy-rejected',
  inactive: 'inactive',
  noUnitAccess: 'no-unit-access',
} as const

export type LogoutReason = (typeof LOGOUT_REASONS)[keyof typeof LOGOUT_REASONS]

const LOGOUT_REASON_VALUES: readonly string[] = Object.values(LOGOUT_REASONS)

export const isLogoutReason = (value: unknown): value is LogoutReason =>
  typeof value === 'string' && LOGOUT_REASON_VALUES.includes(value)
