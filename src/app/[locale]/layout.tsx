import { VT323 } from 'next/font/google';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import NavBar from '@/components/navbar';

import '../globals.css';

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

const matrixFont = VT323({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <div style={{ '--font-matrix': matrixFont.style.fontFamily } as React.CSSProperties}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <NavBar />
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
