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

/** Card skeleton - placeholder per PostCard e card generiche (no image block per evitare layout shift) */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl bg-white shadow-md shadow-gray-200/80 border border-gray-100 overflow-hidden">
      <div className="p-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <SkeletonAvatar className="w-10 h-10 shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {[...Array(lines)].map((_, i) => (
          <SkeletonText key={i} width={i === lines - 1 ? 'w-3/4' : 'w-full'} />
        ))}
      </div>
    </div>
  )
}

/** Thesis proposal card skeleton - match tesi card layout */
export function SkeletonThesisCard() {
  return (
    <div className="rounded-2xl bg-white shadow-md shadow-gray-200/80 border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full shrink-0" />
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

/** Bacheca community post skeleton - match real Card structure (p-6, avatar, title, 2-3 lines content) */
export function SkeletonBachecaCard() {
  return (
    <div className="rounded-2xl bg-white shadow-md shadow-gray-200/80 border border-gray-100 p-6">
      <div className="flex items-start gap-4 mb-4">
        <SkeletonAvatar className="w-12 h-12 shrink-0" />
        <div className="flex-1 space-y-1 min-w-0">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-3/4 mb-3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
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

/** Portfolio grid item skeleton - match portfolio card layout */
export function SkeletonPortfolioItem() {
  return (
    <div className="rounded-2xl bg-white shadow-md shadow-gray-200/80 border border-gray-100 overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg mt-2" />
      </div>
    </div>
  )
}

/** Job/annuncio card skeleton - match Card annunci layout (line-clamp-2 desc, compact) */
export function SkeletonJobCard() {
  return (
    <div className="rounded-2xl bg-white shadow-md shadow-gray-200/80 border border-gray-100 p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-6 w-16 rounded-full shrink-0" />
          </div>
          <div className="flex items-center gap-4 mb-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1.5 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>
    </div>
  )
}

/** Application card skeleton - match candidature card layout */
export function SkeletonApplicationCard() {
  return (
    <div className="rounded-2xl bg-white shadow-md shadow-gray-200/80 border border-gray-100 p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-56 mb-2" />
          <div className="flex items-center gap-4 mt-2">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-24 rounded-lg shrink-0" />
      </div>
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

/** Scopri/Discover sidebar skeleton (right sidebar dashboard) */
export function SkeletonScopriSidebar() {
  return (
    <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="h-5 w-5 shrink-0 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
