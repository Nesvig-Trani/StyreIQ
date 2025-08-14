'use client'
import React, { useState } from 'react'
import { Label } from '@radix-ui/react-label'
import { DatePicker } from '../ui/datepicker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/'
import { OrganizationAccess } from '@/types/payload-types'
import { Button } from '../ui/button'
import { updateUserAccess } from '@/sdk/users'
import { z } from 'zod'
import { unitAccess, UserAccessTypeEnum } from '@/features/organizations'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface OrganizationAccessFormProps {
  initialAccess: OrganizationAccess[]
}

type OrgAccess = z.infer<typeof unitAccess>

export const UnitAccessForm = ({ initialAccess = [] }: OrganizationAccessFormProps) => {
  const map: OrgAccess[] = initialAccess.map((access) => {
    return {
      id: access.id,
      organization:
        typeof access.organization === 'object' && access.organization?.id
          ? access.organization.id
          : 0,
      organization_name:
        typeof access.organization === 'object' && access.organization?.name
          ? access.organization?.name
          : '',
      end_date: access.end_date || undefined,
      start_date: access.start_date || undefined,
      type: (access.type as UserAccessTypeEnum) || undefined,
    }
  })
  const [accessList, setAccessList] = useState<OrgAccess[]>(map)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleAccessTypeChange = (orgId: number, newType: UserAccessTypeEnum) => {
    const updatedAccess = accessList.map((org) => {
      if (org.id === orgId) {
        const updatedOrg = {
          ...org,
          type: newType,
          ...(newType === UserAccessTypeEnum.Permanent && {
            start_date: undefined,
            end_date: undefined,
          }),
        }
        return updatedOrg
      }
      return org
    })
    setAccessList(updatedAccess)
  }

  const handleDateChange = (orgId: number, field: 'end_date' | 'start_date', date: Date) => {
    setAccessList((prev) => prev.map((org) => (org.id === orgId ? { ...org, [field]: date } : org)))
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateUserAccess({ access: accessList as OrgAccess[] })
      toast.success('Access updated')
      router.push('/dashboard/users')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {accessList.map((orgAccess) => (
          <div key={orgAccess.id} className="space-y-4">
            <h4 className="font-medium text-base">{orgAccess.organization_name}</h4>

            <div className="space-y-2 flex flex-col">
              <Label>Access Type</Label>
              <Select
                value={orgAccess.type || ''}
                onValueChange={(value: UserAccessTypeEnum) =>
                  handleAccessTypeChange(orgAccess.id, value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserAccessTypeEnum.Permanent}>Permanent</SelectItem>
                  <SelectItem value={UserAccessTypeEnum.Temporary}>Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {orgAccess.type === UserAccessTypeEnum.Temporary && (
              <div className="flex gap-4">
                <div className="space-y-2 flex flex-col">
                  <Label>Start Date</Label>
                  <DatePicker
                    required
                    selected={orgAccess.start_date ? new Date(orgAccess.start_date) : new Date()}
                    onSelect={(date) =>
                      handleDateChange(orgAccess.id, 'start_date', date || new Date())
                    }
                  />
                </div>

                <div className="space-y-2 flex flex-col">
                  <Label>End Date</Label>
                  <DatePicker
                    required
                    selected={orgAccess.end_date ? new Date(orgAccess.end_date) : new Date()}
                    onSelect={(date) => {
                      handleDateChange(orgAccess.id, 'end_date', date || new Date())
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <Button disabled={isSubmitting} loading={isSubmitting} loadingText={'Loading ...'}>
        Update Access
      </Button>
    </form>
  )
}
