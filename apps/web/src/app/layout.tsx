import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'EaseRead — AI-Powered Document Reading',
    template: '%s | EaseRead',
  },
  description:
    'Read smarter with AI-powered document insights. Upload PDFs, EPUBs, and text files — get instant summaries, Q&A, and deep understanding.',
  keywords: [
    'document reader',
    'AI reading',
    'PDF reader',
    'EaseRead',
    'document analysis',
  ],
  openGraph: {
    title: 'EaseRead — AI-Powered Document Reading',
    description: 'Read smarter with AI-powered document insights.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
