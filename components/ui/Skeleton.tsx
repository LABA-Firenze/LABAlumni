import { ReactNode } from 'react'

interface SkeletonProps {
  className?: string
  children?: ReactNode
}

/** Base skeleton block - animate-pulse gray placeholder */
export function Skeleton({ className = '', children }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`}>
      {children}
    </div>
  )
}

/** Avatar skeleton (circular) */
export function SkeletonAvatar({ className = '' }: { className?: string }) {
  return <Skeleton className={`rounded-full ${className}`} />
}

/** Text line skeleton */
export function SkeletonText({ className = '', width = 'w-full' }: { className?: string; width?: string }) {
  return <Skeleton className={`h-4 ${width} ${className}`} />
}

/** Card skeleton - placeholder for Card component */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <SkeletonAvatar className="w-12 h-12 shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonText width="w-1/3" />
          <SkeletonText width="w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        {[...Array(lines)].map((_, i) => (
          <SkeletonText key={i} width={i === lines - 1 ? 'w-2/3' : 'w-full'} />
        ))}
      </div>
      <div className="mt-4 h-32 rounded-lg bg-gray-200 animate-pulse" />
    </div>
  )
}

/** Profile sidebar skeleton */
export function SkeletonProfileSidebar() {
  return (
    <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-6">
      <div className="text-center mb-4">
        <SkeletonAvatar className="w-20 h-20 mx-auto mb-3" />
        <SkeletonText width="w-24" className="h-5 mx-auto mb-2" />
        <SkeletonText width="w-32" className="h-4 mx-auto block" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Portfolio grid item skeleton */
export function SkeletonPortfolioItem() {
  return (
    <div className="rounded-2xl bg-white shadow-md border overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}

/** Job/annuncio card skeleton */
export function SkeletonJobCard() {
  return (
    <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-6">
      <div className="flex gap-3 mb-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-4 mb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  )
}

/** Application card skeleton */
export function SkeletonApplicationCard() {
  return (
    <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-6">
      <div className="flex justify-between gap-4 mb-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-40 mb-3" />
      <Skeleton className="h-16 w-full rounded-lg mb-3" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

/** List skeleton - generic rows */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(rows)].map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  )
}
