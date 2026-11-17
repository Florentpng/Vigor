import { cx } from './cx'

// Pastille de difficulté (Débutant, Intermédiaire, Avancé) : contour orange avec halo.
export function LevelBadge({ children, size = 'lg' }: { children: React.ReactNode; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-lg border-blue-600 bg-blue-50 font-medium text-blue-600',
        size === 'lg'
          ? 'border-2 px-4 py-1 text-xl shadow-[0_0_14px_color-mix(in_srgb,var(--color-blue-600)_45%,transparent)]'
          : 'border px-2.5 py-0.5 text-sm shadow-[0_0_8px_color-mix(in_srgb,var(--color-blue-600)_35%,transparent)]'
      )}
    >
      {children}
    </span>
  )
}
