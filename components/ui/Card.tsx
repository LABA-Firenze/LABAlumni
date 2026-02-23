import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
  variant?: 'default' | 'glass' | 'elevated' | 'interactive'
}

export function Card({ children, className = '', padding = true, variant = 'default' }: CardProps) {
  const base = 'rounded-2xl transition-all duration-200'
  const variants = {
    default: 'bg-white border border-gray-100 shadow-sm hover:shadow-md',
    glass: 'bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/50',
    elevated: 'bg-white shadow-md shadow-gray-200/80 border border-gray-100',
    interactive: 'bg-white shadow-sm hover:shadow-lg hover:border-primary-100 border border-gray-100',
  }
  return (
    <div className={`${base} ${variants[variant]} ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  )
}



