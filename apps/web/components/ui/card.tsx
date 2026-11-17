import type { ComponentProps } from 'react'
import { cx } from './cx'

type CardProps = ComponentProps<'div'> & {
  // Léger relief au survol, pour les cartes cliquables
  interactive?: boolean
}

export function Card({ interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cx(
        'glass border rounded-xl p-4 shadow-sm',
        interactive && 'transition-shadow hover:shadow-md',
        className
      )}
      {...props}
    />
  )
}
