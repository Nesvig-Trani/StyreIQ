import React from 'react'

interface InfoFieldProps {
  label: string
  value: string | React.ReactNode | null
  className?: string
}

export const InfoField: React.FC<InfoFieldProps> = ({ label, value, className = '' }) => {
  const renderValue = () => {
    if (!value) return 'Not specified'

    if (React.isValidElement(value)) {
      return value
    }

    const stringValue = String(value)

    return (
      <span className="truncate block max-w-full" title={stringValue}>
        {stringValue}
      </span>
    )
  }

  return (
    <div className={className}>
      <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
      <div className="text-sm min-w-0">{renderValue()}</div>
    </div>
  )
}
