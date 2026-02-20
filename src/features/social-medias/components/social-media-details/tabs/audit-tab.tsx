import React, { useState } from 'react'
import { Calendar, Clock4Icon, PlusIcon, SquarePenIcon, CheckIcon } from 'lucide-react'

import { Separator } from '@/shared'
import type { AuditLog, SocialMedia } from '@/types/payload-types'
import { InfoCard } from '@/shared/components/ui/info-card'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
interface SocialMediaWithLogs extends SocialMedia {
  auditLogs?: {
    docs: AuditLog[]
  }
}

interface AuditTabProps {
  socialMedia: SocialMediaWithLogs
}

export const AuditTab: React.FC<AuditTabProps> = ({ socialMedia }) => {
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null)

  const effectiveRole = getEffectiveRoleFromUser(
    selectedAudit && typeof selectedAudit.user === 'object' ? selectedAudit.user : null,
  )
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard icon={<Calendar />} title="Audit History">
          <div className="space-y-3">
            {socialMedia?.auditLogs?.docs?.map((audit) => {
              const isCreate = audit.action === 'create'
              const isUpdate = audit.action === 'update'

              return (
                <div
                  key={audit.id}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAudit?.id === audit.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedAudit(audit)}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isCreate ? 'bg-green-100' : isUpdate ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    {isCreate ? (
                      <PlusIcon className="w-3 h-3 text-green-600" />
                    ) : isUpdate ? (
                      <SquarePenIcon className="w-3 h-3 text-blue-600" />
                    ) : (
                      <CheckIcon className="w-3 h-3 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {audit.action}{' '}
                      {new Date(audit.createdAt).toLocaleString('es-CO', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                      })}{' '}
                    </div>
                    <div className="text-xs text-gray-600">
                      by{' '}
                      {typeof audit.user === 'object' && audit.user !== null
                        ? audit.user.name
                        : 'Unknown user'}
                    </div>
                  </div>
                  <Clock4Icon className="w-4 h-4 text-gray-400" />
                </div>
              )
            })}

            {(!socialMedia?.auditLogs?.docs || socialMedia.auditLogs.docs.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-sm">No audit history available</div>
              </div>
            )}
          </div>
        </InfoCard>

        <InfoCard title="Audit Details">
          {selectedAudit ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Action</div>
                <div className="text-sm capitalize">{selectedAudit.action}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Date & Time</div>
                <div className="text-sm">
                  {new Date(selectedAudit.createdAt).toLocaleString('es-CO', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">User</div>
                <div className="text-sm">
                  {typeof selectedAudit.user === 'object'
                    ? selectedAudit.user?.name
                    : 'Unknown user'}
                </div>
              </div>
              <Separator />

              {selectedAudit.action === 'update' && (
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-2">Changes</div>
                  <div className="space-y-2">
                    {Object.keys(selectedAudit.current || {}).map((key) => {
                      const currentValue =
                        selectedAudit.current &&
                        typeof selectedAudit.current === 'object' &&
                        !Array.isArray(selectedAudit.current)
                          ? selectedAudit.current[key as keyof typeof selectedAudit.current]
                          : undefined

                      const prevValue =
                        selectedAudit.prev &&
                        typeof selectedAudit.prev === 'object' &&
                        !Array.isArray(selectedAudit.prev)
                          ? selectedAudit.prev[key as keyof typeof selectedAudit.prev]
                          : undefined

                      if (currentValue !== prevValue && typeof currentValue !== 'object') {
                        return (
                          <div key={key} className="text-xs">
                            <span className="font-medium">{key}:</span>
                            <div className="ml-2">
                              <div className="text-red-700">- {String(prevValue || 'null')}</div>
                              <div className="text-green-700">
                                + {String(currentValue || 'null')}
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Full Record</div>
                <div
                  className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-600 max-h-48 overflow-y-auto"
                  tabIndex={0}
                  aria-label="Full audit record"
                >
                  <pre>
                    {JSON.stringify(
                      {
                        id: selectedAudit.id,
                        action: selectedAudit.action,
                        entity: selectedAudit.entity,
                        createdAt: selectedAudit.createdAt,
                        user:
                          typeof selectedAudit.user === 'object' && selectedAudit.user !== null
                            ? {
                                id: selectedAudit.user.id,
                                name: selectedAudit.user.name,
                                role: effectiveRole,
                              }
                            : {
                                id: 'Not defined',
                                name: 'Not defined',
                                role: 'Not defined',
                              },
                        document: selectedAudit.document,
                        current: selectedAudit.current,
                        prev: selectedAudit.prev,
                        organizations: selectedAudit.organizations,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm">Select an audit entry to view details</div>
            </div>
          )}
        </InfoCard>
      </div>
    </div>
  )
}
