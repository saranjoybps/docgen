import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-6 lg:ml-64">
          {children}
        </main>
        <Toaster />
      </div>
    </AuthGuard>
  )
}
