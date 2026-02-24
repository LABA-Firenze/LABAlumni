import AppLayoutClient from './AppLayoutClient'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayoutClient>{children}</AppLayoutClient>
}
