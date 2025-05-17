import type { Metadata } from 'next';
import { Roboto, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LayoutClientBoundary } from '@/components/layout/layout-client-boundary';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Function Point Calculator',
  description: 'A suite of tools for software estimation including Function Point Calculation, COCOMO II, and AI-powered File Analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${geistMono.variable} font-sans antialiased`}>
        <LayoutClientBoundary>{children}</LayoutClientBoundary>
      </body>
    </html>
  );
}
