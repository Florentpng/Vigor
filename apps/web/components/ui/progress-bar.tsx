import { cx } from './cx'

// Barre de progression ; `value` est un pourcentage de 0 à 100.
export function ProgressBar({
  value,
  tone = 'accent',
  className,
}: {
  value: number
  tone?: 'accent' | 'success'
  className?: string
}) {
  const percent = Math.min(100, Math.max(0, value))

  return (
    <div className={cx('h-1.5 rounded-full bg-gray-200 overflow-hidden', className)} aria-hidden="true">
      <div
        className={cx('h-full transition-[width] duration-500', tone === 'success' ? 'bg-green-500' : 'bg-blue-600')}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
