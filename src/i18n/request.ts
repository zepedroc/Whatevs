import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async (props) => {
  const locale = await props.requestLocale;

  return {
    messages: (await import(`../messages/${locale}/messages.json`)).default,
  };
});
