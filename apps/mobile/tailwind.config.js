// Accent : variables définies à la racine de l'app (voir src/lib/theme.ts) pour passer du bronze
// (mode clair) à l'orange (mode sombre), comme le web.
const accent = (name) => `rgb(var(--blue-${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Mode clair : gris ardoise (comme le web)
        gray: {
          50: '#f8fafc',
          100: '#f8fafc',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Mode sombre : anthracite / bleu-nuit (les écrans utilisent « dark:…-zinc-… »)
        zinc: {
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#8b9bb0',
          500: '#64748b',
          600: '#475569',
          700: '#475569',
          800: '#334155',
          900: '#1e293b',
          950: '#0b0f19',
        },
        blue: {
          50: accent('50'),
          100: accent('100'),
          400: accent('400'),
          500: accent('500'),
          600: accent('600'),
          700: accent('700'),
          800: accent('800'),
          950: accent('950'),
        },
      },
      fontFamily: {
        // Titres : Barlow Condensed (voir src/app/_layout.tsx). Pas de « font-bold » avec ces classes.
        display: ['BarlowCondensed_700Bold'],
        'display-sb': ['BarlowCondensed_600SemiBold'],
        'display-xb': ['BarlowCondensed_800ExtraBold'],
      },
    },
  },
  plugins: [],
}
