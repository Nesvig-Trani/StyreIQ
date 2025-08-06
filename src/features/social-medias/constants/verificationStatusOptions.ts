import { VerificationStatusEnum } from '../schemas'

export const verificationStatusOptions = [
  { label: 'Verified', value: VerificationStatusEnum.Verified },
  { label: 'Not Verified', value: VerificationStatusEnum.NotVerified },
  { label: 'Pending', value: VerificationStatusEnum.Pending },
]
