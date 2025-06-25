import PolicyHistory from '@/policies/components/policy-history'
import { emptyLexicalState } from '@/policies/constants/emptyLexicalState'
import { getLastPolicyVersion, getPolicies } from '@/policies/queries'
import LexicalEditor from '@/shared/components/rich-text-editor'

export default async function PoliciesPage() {
  const lastPolicy = await getLastPolicyVersion()
  const policies = await getPolicies()
  const initialState = JSON.stringify(lastPolicy?.text ?? emptyLexicalState)
  return (
    <div>
      <div className="flex justify-between align-center gap-2 mb-4">
        <div className="flex gap-2">
          <p className="!my-0">Current Version</p>
          <b>V{lastPolicy?.version || 0}</b>
        </div>
        <PolicyHistory policies={policies.docs} />
      </div>
      <LexicalEditor initialState={initialState} />
    </div>
  )
}
