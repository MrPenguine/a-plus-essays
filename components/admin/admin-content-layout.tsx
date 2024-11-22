"use client"

interface AdminContentLayoutProps {
  children?: React.ReactNode
}

export function AdminContentLayout({ children }: AdminContentLayoutProps) {
  return (
    <div className="flex flex-col gap-6 w-full min-h-screen">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3 w-full">
        <div className="aspect-video rounded-xl bg-muted/50 w-full" />
        <div className="aspect-video rounded-xl bg-muted/50 w-full" />
        <div className="aspect-video rounded-xl bg-muted/50 w-full" />
      </div>
      <div className="flex-1 rounded-xl bg-muted/50 w-full" />
      {children}
    </div>
  )
} 