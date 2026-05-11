'use client'

import React, { useId, useLayoutEffect, useRef, useState } from 'react'
import { Calendar, Clock4Icon, PlusIcon, SquarePenIcon, CheckIcon } from 'lucide-react'

import { Separator } from '@/shared'
import type { AuditLog, SocialMedia } from '@/types/payload-types'
import { InfoCard } from '@/shared/components/ui/info-card'
import { useDocumentEscapeCapture } from '@/shared/hooks/useDocumentEscapeCapture'
import { focusableHeadingClassName } from '@/shared/utils/a11y-styles'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

interface SocialMediaWithLogs extends SocialMedia {
  auditLogs?: {
    docs: AuditLog[]
  }
}

interface AuditTabProps {
  socialMedia: SocialMediaWithLogs
}

const formatAuditDate = (createdAt: string) =>
  new Date(createdAt).toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

function auditUserName(audit: AuditLog): string {
  return typeof audit.user === 'object' && audit.user !== null ? audit.user.name : 'Unknown user'
}

function auditSummaryLine(audit: AuditLog): string {
  return `${audit.action} — ${formatAuditDate(audit.createdAt)} — ${auditUserName(audit)}`
}

function auditRowAriaLabel(audit: AuditLog): string {
  return `${audit.action}, ${formatAuditDate(audit.createdAt)}, by ${auditUserName(audit)}`
}

export const AuditTab: React.FC<AuditTabProps> = ({ socialMedia }) => {
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null)
  const detailHeadingId = useId()
  const lastRowRef = useRef<HTMLButtonElement | null>(null)
  const detailHeadingRef = useRef<HTMLHeadingElement>(null)

  const effectiveRole = getEffectiveRoleFromUser(
    selectedAudit && typeof selectedAudit.user === 'object' ? selectedAudit.user : null,
  )

  const pickAudit = (audit: AuditLog, row: HTMLButtonElement) => {
    lastRowRef.current = row
    const sameRow = selectedAudit?.id === audit.id
    setSelectedAudit(audit)
    if (sameRow) queueMicrotask(() => detailHeadingRef.current?.focus())
  }

  const selectedAuditId = selectedAudit?.id
  useLayoutEffect(() => {
    if (selectedAuditId == null) return
    detailHeadingRef.current?.focus()
  }, [selectedAuditId])

  useDocumentEscapeCapture(!!selectedAudit, {
    onEscape: () => setSelectedAudit(null),
    returnFocusRef: lastRowRef,
  })

  const auditAnnouncement = selectedAudit
    ? `Selected audit: ${auditSummaryLine(selectedAudit)}`
    : ''

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <InfoCard icon={<Calendar />} title="Audit History">
          <div className="space-y-3">
            {socialMedia?.auditLogs?.docs?.map((audit) => {
              const isCreate = audit.action === 'create'
              const isUpdate = audit.action === 'update'
              const isSelected = selectedAudit?.id === audit.id

              return (
                <button
                  key={audit.id}
                  type="button"
                  className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                    isSelected
                      ? 'border border-blue-200 bg-blue-50'
                      : 'cursor-pointer bg-gray-50 hover:bg-gray-100'
                  } outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                  aria-pressed={isSelected ? true : undefined}
                  aria-label={auditRowAriaLabel(audit)}
                  onClick={(e) => pickAudit(audit, e.currentTarget)}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                      isCreate ? 'bg-green-100' : isUpdate ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    {isCreate ? (
                      <PlusIcon className="h-3 w-3 text-green-600" aria-hidden="true" />
                    ) : isUpdate ? (
                      <SquarePenIcon className="h-3 w-3 text-blue-600" aria-hidden="true" />
                    ) : (
                      <CheckIcon className="h-3 w-3 text-gray-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      {audit.action} {formatAuditDate(audit.createdAt)}{' '}
                    </div>
                    <div className="text-xs text-gray-600">by {auditUserName(audit)}</div>
                  </div>
                  <Clock4Icon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                </button>
              )
            })}

            {(!socialMedia?.auditLogs?.docs || socialMedia.auditLogs.docs.length === 0) && (
              <div className="py-8 text-center text-gray-500">
                <div className="text-sm">No audit history available</div>
              </div>
            )}
          </div>
        </InfoCard>

        <div
          className="rounded-lg border bg-white p-4 shadow-sm"
          role="region"
          aria-labelledby={detailHeadingId}
        >
          <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {auditAnnouncement}
          </span>
          <h2
            ref={detailHeadingRef}
            id={detailHeadingId}
            tabIndex={-1}
            className={`mb-3 font-bold text-black ${focusableHeadingClassName}`}
          >
            {selectedAudit ? auditSummaryLine(selectedAudit) : 'Audit Details'}
          </h2>

          {selectedAudit ? (
            <div className="space-y-4">
              <div>
                <div className="mb-1 text-sm font-medium text-gray-600">Action</div>
                <div className="text-sm capitalize">{selectedAudit.action}</div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-gray-600">Date & Time</div>
                <div className="text-sm">{formatAuditDate(selectedAudit.createdAt)}</div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium text-gray-600">User</div>
                <div className="text-sm">
                  {typeof selectedAudit.user === 'object'
                    ? selectedAudit.user?.name
                    : 'Unknown user'}
                </div>
              </div>
              <Separator />

              {selectedAudit.action === 'update' && (
                <div>
                  <div className="mb-2 text-sm font-medium text-gray-600">Changes</div>
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
                <div className="mb-1 text-sm font-medium text-gray-600">Full Record</div>
                <div
                  className="max-h-48 overflow-y-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-600"
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
            <div className="py-8 text-center text-gray-500">
              <div className="text-sm">Select an audit entry to view details</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
