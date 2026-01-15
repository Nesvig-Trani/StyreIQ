'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared'
import { generateRollCallForUser } from '@/sdk/compliance-task'
import { useRouter } from 'next/navigation'

interface GenerateRollCallButtonProps {
  userId: number
  tenantId: number
  userName: string
  variant?: 'default' | 'icon'
}

export function GenerateRollCallButton({
  userId,
  tenantId,
  userName,
  variant = 'default',
}: GenerateRollCallButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGenerateRollCall = async () => {
    try {
      setIsLoading(true)

      await generateRollCallForUser(userId, tenantId)

      toast.success('Roll Call Generated', {
        description: `Roll Call task has been created for ${userName}`,
      })

      router.refresh()
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to generate Roll Call',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <Button
        onClick={handleGenerateRollCall}
        disabled={isLoading}
        variant="outline"
        size="icon"
        title={`Generate Roll Call for ${userName}`}
        aria-label={`Generate Roll Call for ${userName}`}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    )
  }

  return (
    <Button
      onClick={handleGenerateRollCall}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Generating...' : 'Generate Roll Call'}
    </Button>
  )
}
