import type { ComponentProps } from 'react'

// Icônes en SVG : elles prennent la couleur du texte (currentColor) et la taille de la classe (h-* w-*).
type IconProps = ComponentProps<'svg'>

function Stroke({ children, className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  )
}

export function TimerIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M9 2h6" />
    </Stroke>
  )
}

export function HourglassIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M6 2h12M6 22h12M7 2v4.5L12 12 7 17.5V22M17 2v4.5L12 12l5 5.5V22" />
    </Stroke>
  )
}

export function DumbbellIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
    </Stroke>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Stroke>
  )
}

export function FlameIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M12 2c.8 3.4 5 5.6 5 10.2A5 5 0 0 1 7 12.4c0-1.9.9-3.2 2-4.2.3 1.3 1 2.1 2 2.3C10.6 7.9 11 4.9 12 2Z" />
    </svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="3" y="4.5" width="18" height="17" rx="2" />
      <path d="M3 10h18M8 2.5v4M16 2.5v4" />
    </Stroke>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />
    </Stroke>
  )
}

export function LinkIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </Stroke>
  )
}

export function VideoIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m22 8-6 4 6 4z" />
    </Stroke>
  )
}

export function VideoOffIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m22 8-6 4 6 4zM3 3l18 18" />
    </Stroke>
  )
}
