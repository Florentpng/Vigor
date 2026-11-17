import type { ComponentProps } from 'react'
import { cx } from './cx'

// Bloc gris qui pulse, à la place d'un contenu en cours de chargement
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cx('animate-pulse rounded-lg bg-gray-200', className)}
      {...props}
    />
  )
}
