import { ThirdPartyManagementEnum } from '../schemas'

export const thirdPartyManagementOptions = [
  {
    label: 'No – Managed internally',
    value: ThirdPartyManagementEnum.ManagedInternally,
  },
  {
    label: 'Yes – Managed by external agency/vendor',
    value: ThirdPartyManagementEnum.ManagedExternally,
  },
]
