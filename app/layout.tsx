import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: '5A - Plateforme de Tests API Collaborative',
    template: '%s | 5A'
  },
  description: 'Plateforme collaborative de tests API avec rapports détaillés, tests programmés et monitoring en temps réel.',
  keywords: [
    'API testing',
    'collaborative testing',
    'automated tests',
    'API monitoring',
    'test scheduling',
    'test reports',
    'API documentation',
    'team collaboration',
    'API performance',
    'test automation'
  ],
  authors: [{ name: 'Leonaar' }],
  creator: 'Leonaar',
  publisher: 'Leonaar',
  metadataBase: new URL('https://5a.leonaar.com'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://5a.leonaar.com',
    siteName: '5A - Tests API Collaboratifs',
    title: '5A - Plateforme de Tests API Collaborative',
    description: 'Plateforme collaborative de tests API avec rapports détaillés, tests programmés et monitoring en temps réel.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '5A - Tests API Collaboratifs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '5A - Plateforme de Tests API Collaborative',
    description: 'Plateforme collaborative de tests API avec rapports détaillés, tests programmés et monitoring en temps réel.',
    images: ['/twitter-image.png'],
    creator: '@leonaar',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#000000'
      }
    ]
  },
  manifest: '/site.webmanifest',
  applicationName: '5A',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
}

export const themeColor = '#ffffff'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 
