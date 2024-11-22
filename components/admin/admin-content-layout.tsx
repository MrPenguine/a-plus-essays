"use client"

interface AdminContentLayoutProps {
  children: React.ReactNode
}

export function AdminContentLayout({ children }: AdminContentLayoutProps) {
  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <div className="grid gap-4 md:gap-6">
        <div className="grid gap-4 md:gap-6">
          <div className="space-y-4 md:space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
} 