import { PasswordManagementPracticeEnum } from '../schemas'

export const passwordManagementPracticeOptions = [
  {
    label: 'Password Manager (shared via approved tool)',
    value: PasswordManagementPracticeEnum.PasswordManager,
  },
  {
    label: 'Shared/Manual (no password manager)',
    value: PasswordManagementPracticeEnum.SharedManual,
  },
  {
    label: 'Individual logins only (no shared password)',
    value: PasswordManagementPracticeEnum.IndividualLogins,
  },
  {
    label: 'Other',
    value: PasswordManagementPracticeEnum.Other,
  },
]
