import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async (props) => {
  const locale = (await props.requestLocale) ?? 'en';

  return {
    locale,
    messages: (await import(`../messages/${locale}/messages.json`)).default,
  };
});
