import Image from 'next/image'
import ThemeToggle from '@/components/theme-toggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-6 p-6 font-sans">
      <div className="absolute right-4 top-4 flex items-center gap-2 text-sm text-gray-600">
        <span>Mode sombre</span>
        <ThemeToggle />
      </div>

      <div className="flex items-center gap-3">
        <Image src="/logo-mark.png" alt="" width={57} height={54} priority className="h-14 w-auto" />
        <span className="text-3xl font-bold tracking-wide text-gray-900">Vigor</span>
      </div>

      {children}
    </main>
  )
}
