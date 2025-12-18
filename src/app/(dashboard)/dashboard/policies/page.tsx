import PolicyHistory from '@/features/policies/components/policy-history'
import { emptyLexicalState } from '@/features/policies/constants/emptyLexicalState'
import { getLastPolicyVersion, getPolicies } from '@/features/policies/plugins/queries'
import LexicalEditor from '@/shared/components/rich-text-editor'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { getPayloadContext } from '@/shared/utils/getPayloadContext'
import { getServerTenantContext } from '../../server-tenant-context'
import { Globe } from 'lucide-react'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { UserRolesEnum } from '@/features/users'

export default async function PoliciesPage() {
  const { user } = await getAuthUser()
  const { payload } = await getPayloadContext()
  const tenantContext = await getServerTenantContext(user, payload)
  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin

  const isViewingAllTenants = tenantContext.isViewingAllTenants

  const lastPolicy = isViewingAllTenants ? null : await getLastPolicyVersion()
  const policies = await getPolicies()
  const initialState = JSON.stringify(lastPolicy?.text ?? emptyLexicalState)

  return (
    <Card>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">Governance Policy Editor</h2>
                {!isViewingAllTenants && lastPolicy && (
                  <Badge variant="secondary" className="text-xs">
                    Current Version {lastPolicy.version}
                  </Badge>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  {isViewingAllTenants
                    ? 'Select a tenant to manage policies'
                    : isSuperAdmin
                      ? 'Keep your rules in one place.'
                      : 'Check current policies and rules.'}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isViewingAllTenants
                    ? 'Policies are tenant-specific. Please select a tenant from the selector to view or edit their governance policies.'
                    : isSuperAdmin
                      ? 'Upload and share policies, guidelines, and compliance documents so every unit has the same source of truth. When a new policy is added or updated, users are prompted to attest they&apos;ve read and acknowledged it.'
                      : 'Here you can view current policies, guidelines, and compliance documents. Only Super Admins can edit and update these policies.'}
                </p>
              </div>
            </div>

            {!isViewingAllTenants && (
              <div className="w-full sm:w-auto">
                <PolicyHistory policies={policies.docs} />
              </div>
            )}
          </div>
        </div>

        {isViewingAllTenants ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <Globe className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Viewing All Tenants</h3>
              <p className="text-sm text-gray-600">
                To create or edit policies, please select a specific tenant.
              </p>
            </div>
          </div>
        ) : (
          <LexicalEditor
            initialState={initialState}
            isSuperAdmin={isSuperAdmin}
            selectedTenantId={tenantContext.tenantIdForFilter}
          />
        )}
      </CardContent>
    </Card>
  )
}
