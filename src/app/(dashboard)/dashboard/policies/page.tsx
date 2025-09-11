import PolicyHistory from '@/features/policies/components/policy-history'
import { emptyLexicalState } from '@/features/policies/constants/emptyLexicalState'
import { getLastPolicyVersion, getPolicies } from '@/features/policies/plugins/queries'
import LexicalEditor from '@/shared/components/rich-text-editor'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'

export default async function PoliciesPage() {
  const lastPolicy = await getLastPolicyVersion()
  const policies = await getPolicies()
  const initialState = JSON.stringify(lastPolicy?.text ?? emptyLexicalState)

  const { user } = await getAuthUser()
  const isSuperAdmin = user?.role === 'super_admin'

  return (
    <Card>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">Governance Policy Editor</h2>
                <Badge variant="secondary" className="text-xs">
                  Current Version {lastPolicy?.version || 0}
                </Badge>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  {isSuperAdmin
                    ? 'Keep your rules in one place.'
                    : 'Check current policies and rules.'}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isSuperAdmin
                    ? 'Upload and share policies, guidelines, and compliance documents so every unit has the same source of truth. When a new policy is added or updated, users are prompted to attest they&apos;ve read and acknowledged it.'
                    : 'Here you can view current policies, guidelines, and compliance documents. Only Super Admins can edit and update these policies.'}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <PolicyHistory policies={policies.docs} />
            </div>
          </div>
        </div>
        <LexicalEditor initialState={initialState} isSuperAdmin={isSuperAdmin} />
      </CardContent>
    </Card>
  )
}
