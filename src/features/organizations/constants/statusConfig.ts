import { CheckCircle, XCircle, Clock } from 'lucide-react'

export const statusConfig = {
  active: { label: 'Active', color: 'bg-green-500', icon: CheckCircle },
  inactive: { label: 'Inactive', color: 'bg-red-500', icon: XCircle },
  pending_review: { label: 'Pending Review', color: 'bg-yellow-500', icon: Clock },
} as const
