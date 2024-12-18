import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import NavBar from '@/components/navbar';

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NavBar />
      {children}
    </NextIntlClientProvider>
  );
}
