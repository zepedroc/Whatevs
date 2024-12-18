'use client';

import { createTranslator } from 'next-intl';

export function getTranslations(messages: any, locale: string) {
  return createTranslator({ messages, locale });
}
