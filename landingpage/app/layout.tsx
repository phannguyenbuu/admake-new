import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

export const metadata: Metadata = {
  title: 'ADMAKE - Tạo động lực cho doanh nghiệp',
  description: 'ADMAKE - Tạo động lực cho doanh nghiệp',
  generator: 'ADMAKE',
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${inter.style.fontFamily};
  --font-sans: ${inter.variable};
  --font-mono: ${inter.variable};
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
