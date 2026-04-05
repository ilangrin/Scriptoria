import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Scriptoria — Old French Document Translator',
  description:
    'Translate historical French documents (handwritten or printed) into Hebrew, English, or modern French using AI.',
  keywords: ['French', 'translation', 'historical documents', 'handwriting', 'paleography'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-parchment-50">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
