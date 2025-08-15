import React from 'react'

interface InfoCardProps {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
  className?: string
}

export const InfoCard: React.FC<InfoCardProps> = ({ icon, title, children, className = '' }) => {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-bold text-black">{title}</h4>
      </div>
      {children}
    </div>
  )
}
