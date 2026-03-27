import './globals.css'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  title: 'CommandKit — Interactive CLI Documentation',
  description: 'Turn any CLI tool into beautiful, interactive documentation. Stop writing docs. Start showing commands.',
  keywords: ['CLI', 'documentation', 'developer tools', 'terminal', 'commands'],
  authors: [{ name: 'Alice' }],
  creator: 'Alice',
  publisher: 'CommandKit',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'CommandKit — Interactive CLI Documentation',
    description: 'Turn any CLI tool into beautiful, interactive documentation',
    url: 'https://commandkit.dev',
    siteName: 'CommandKit',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CommandKit — Interactive CLI Documentation',
    description: 'Turn any CLI tool into beautiful, interactive documentation',
    creator: '@commandkit',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable}`}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}