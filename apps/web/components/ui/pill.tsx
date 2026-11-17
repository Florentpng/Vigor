import type { ComponentProps } from 'react'
import { cx } from './cx'

type Tone = 'accent' | 'neutral' | 'success' | 'warning' | 'admin'

const TONES: Record<Tone, string> = {
  accent: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-600',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-50 text-amber-800',
  admin: 'bg-purple-100 text-purple-800',
}

export function Pill({
  tone = 'accent',
  className,
  ...props
}: ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      className={cx('inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium', TONES[tone], className)}
      {...props}
    />
  )
}
