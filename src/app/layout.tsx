import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import './globals.css';

// Load Inter font with variable font support
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Application metadata
export const metadata: Metadata = {
  title: {
    default: 'Mission Connect Studio - AI Social Media Content',
    template: '%s | Mission Connect Studio',
  },
  description:
    'Transform health mission stories into inspiring social media content. AI-powered content generation for Instagram, Facebook, and LinkedIn.',
  keywords: [
    'social media',
    'content generator',
    'AI',
    'marketing',
    'Instagram',
    'Facebook',
    'LinkedIn',
    'TikTok',
    'viral content',
    'copywriting',
  ],
  authors: [{ name: 'Story Studio' }],
  creator: 'Story Studio',
  publisher: 'Story Studio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://storystudio.ai'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Story Studio',
    title: 'Story Studio - AI Social Media Content Generator',
    description:
      'Transform your stories and photos into viral social media content with AI.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Story Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Story Studio - AI Social Media Content Generator',
    description:
      'Transform your stories and photos into viral social media content with AI.',
    images: ['/og-image.png'],
    creator: '@storystudio',
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

// Viewport configuration
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

/**
 * Root Layout
 *
 * This is the root layout for the entire application. It wraps all pages
 * with the necessary providers, fonts, and global styles.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              classNames: {
                toast: 'bg-background border border-border shadow-lg',
                title: 'text-foreground font-medium',
                description: 'text-muted-foreground',
                actionButton: 'bg-primary text-primary-foreground',
                cancelButton: 'bg-muted text-muted-foreground',
                closeButton: 'text-muted-foreground hover:text-foreground',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
