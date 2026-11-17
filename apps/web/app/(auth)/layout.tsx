import Image from 'next/image'
import logo from '../icon.png'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-shell relative min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-6 p-6 font-sans">
      <div className="flex items-center gap-3">
        <Image src={logo} alt="" priority className="h-24 w-24" />
        <span className="text-3xl font-bold tracking-wide text-gray-900">Vigor</span>
      </div>

      {children}
    </main>
  )
}
