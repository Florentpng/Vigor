export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6 font-sans">
      {children}
    </main>
  )
}
