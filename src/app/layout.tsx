import { Inter } from 'next/font/google';

import { AppToaster } from '@/components/ui/app-toaster';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Whatevs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
