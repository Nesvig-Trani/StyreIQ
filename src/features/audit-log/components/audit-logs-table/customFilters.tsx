'use client'

import { AuditLog } from '@/types/payload-types'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

import {
  getOrganizationDocumentOptions,
  getSocialMediaDocumentOptions,
  getUserDocumentOptions,
} from './filterUtils'
import FilterPopover from './filterPopover'

type AuditLogSearchParams = {
  pagination: {
    pageIndex: number
    pageSize: number
  }
  entity: string[]
  action: string[]
  user: string
  createdAt: {
    from: string
    to: string
  }
  userDocumentId?: number | undefined
  organizationDocumentId?: number | undefined
  socialMediaDocumentId?: number | undefined
}

export const CustomFilters = ({
  audilogs,
  searchParams,
}: {
  audilogs: AuditLog[]
  searchParams: AuditLogSearchParams
}) => {
  const router = useRouter()
  const currentSearchParams = useSearchParams()

  const handleParamChange = useCallback(
    (key: string, value?: string) => {
      const params = new URLSearchParams(currentSearchParams.toString())

      const exclusiveKeys = ['userDocumentId', 'organizationDocumentId', 'socialMediaDocumentId']
      if (value) {
        params.set(key, value)
        if (exclusiveKeys.includes(key)) {
          exclusiveKeys.filter((k) => k !== key).forEach((k) => params.delete(k))
        }
      } else {
        params.delete(key)
      }

      if (params.has('pagination')) {
        const parsed = JSON.parse(params.get('pagination')!)
        parsed.pageIndex = 0
        params.set('pagination', JSON.stringify(parsed))
      }

      router.push(`${window.location.pathname}?${params.toString()}`)
    },
    [currentSearchParams, router],
  )

  return (
    <div className="mb-4 flex flex-wrap gap-4">
      <FilterPopover
        label="User Affected Record"
        placeholder="user"
        options={getUserDocumentOptions(audilogs)}
        selectedValue={searchParams.userDocumentId?.toString()}
        onChange={(val) => handleParamChange('userDocumentId', val)}
      />

      <FilterPopover
        label="Unit Affected Record"
        placeholder="organization"
        options={getOrganizationDocumentOptions(audilogs)}
        selectedValue={searchParams.organizationDocumentId?.toString()}
        onChange={(val) => handleParamChange('organizationDocumentId', val)}
      />

      <FilterPopover
        label="Social Media Affected Record"
        placeholder="social media"
        options={getSocialMediaDocumentOptions(audilogs)}
        selectedValue={searchParams.socialMediaDocumentId?.toString()}
        onChange={(val) => handleParamChange('socialMediaDocumentId', val)}
      />
    </div>
  )
}
