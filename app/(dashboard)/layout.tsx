import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Sidebar />
        <main className="flex-1 ml-0 lg:ml-64 p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </main>
        <Toaster />
      </div>
    </AuthGuard>
  )
}
