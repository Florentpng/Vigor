import type { Metadata } from "next";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Police des titres : grasse et condensée
const barlowCondensed = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vigor",
  description: "Ton programme de musculation, séance après séance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Applique le thème choisi avant l'affichage, pour éviter un flash clair. Clair par défaut. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('vigor-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      {/* suppressHydrationWarning : certaines extensions du navigateur ajoutent des attributs au <body> */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
