import type { ComponentProps } from 'react'
import { cx } from './cx'

const FIELD = 'w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cx(FIELD, className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cx(FIELD, className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cx(FIELD, className)} {...props} />
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cx('block text-sm font-medium text-gray-700 mb-1', className)} {...props} />
}

export function ErrorMessage({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{children}</div>
}
