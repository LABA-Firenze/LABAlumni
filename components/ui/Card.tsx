import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  )
}



