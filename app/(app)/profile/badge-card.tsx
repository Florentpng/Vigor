'use client'

import { useRef } from 'react'
import Image from 'next/image'

type Props = {
  title: string
  description: string
  imageSrc: string | null
  unlocked: boolean
  statusLabel: string
}

function StarIcon({ unlocked, size }: { unlocked: boolean; size: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'h-40 w-40' : 'h-16 w-16'
  const icon = size === 'lg' ? 'h-20 w-20' : 'h-7 w-7'

  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-full ${
        unlocked ? 'bg-amber-400 text-white' : 'bg-gray-300 text-white'
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className={icon}>
        <path d="M10 1l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.3 4.8 17.1l1-5.8L1.5 7.2l5.9-.9L10 1z" />
      </svg>
    </span>
  )
}

// Carte de badge dans la galerie ; un clic ouvre le badge en grand dans une boîte de dialogue.
export default function BadgeCard({ title, description, imageSrc, unlocked, statusLabel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <li>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Voir le badge ${title} en grand`}
        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left cursor-pointer transition-shadow hover:shadow-md ${
          unlocked ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 opacity-60'
        }`}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            width={96}
            height={96}
            className={`h-16 w-16 shrink-0 object-contain ${unlocked ? '' : 'grayscale'}`}
          />
        ) : (
          <StarIcon unlocked={unlocked} size="sm" />
        )}
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-600">{description}</p>
          <p className="mt-1 text-xs text-gray-500">{statusLabel}</p>
        </div>
      </button>

      {/* Un clic sur le fond (le <dialog> lui-même) ferme la boîte ; Échap aussi, nativement. */}
      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close()
        }}
        aria-label={title}
        className="m-auto w-[min(90vw,26rem)] rounded-2xl border bg-white p-0 text-center shadow-xl backdrop:bg-black/60"
      >
        <div className="flex flex-col items-center gap-4 p-6">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={title}
              width={380}
              height={380}
              className={`h-72 w-72 max-w-full object-contain ${unlocked ? '' : 'grayscale'}`}
            />
          ) : (
            <StarIcon unlocked={unlocked} size="lg" />
          )}

          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
            <p className="mt-3 text-xs font-medium text-gray-500">{statusLabel}</p>
          </div>

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="mt-1 px-5 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </dialog>
    </li>
  )
}
