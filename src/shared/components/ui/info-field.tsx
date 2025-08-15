import React from 'react'

interface InfoFieldProps {
  label: string
  value: string | React.ReactNode
  className?: string
}

export const InfoField: React.FC<InfoFieldProps> = ({ label, value, className = '' }) => {
  return (
    <div className={className}>
      <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
      <div className="text-sm">{value || 'Not specified'}</div>
    </div>
  )
}
