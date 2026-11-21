import type { ReactNode } from 'react'

// Bandeau déroulant : un titre et un chevron, le contenu s'ouvre dessous (replié par défaut)
export function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group glass overflow-hidden rounded-xl border shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="font-display text-2xl font-bold text-gray-900">{title}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="border-t bg-gray-50">{children}</div>
    </details>
  )
}
