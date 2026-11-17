import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cx } from './cx'

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
type Size = 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'border text-gray-700 hover:bg-gray-50',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'border border-red-200 text-red-600 hover:bg-red-50',
  ghost: 'text-gray-600 hover:text-blue-600',
}

const SIZES: Record<Size, string> = {
  md: 'px-4 py-2 rounded-lg text-sm font-medium',
  lg: 'w-full px-5 py-4 rounded-xl text-base font-semibold',
}

type Options = { variant?: Variant; size?: Size; className?: string }

function classes({ variant = 'primary', size = 'md', className }: Options) {
  return cx(
    'inline-flex items-center justify-center text-center transition cursor-pointer active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    SIZES[size],
    VARIANTS[variant],
    className
  )
}

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...props
}: ComponentProps<'button'> & Options) {
  return <button type={type} className={classes({ variant, size, className })} {...props} />
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & Options) {
  return <Link className={classes({ variant, size, className })} {...props} />
}
