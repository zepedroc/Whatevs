'use server';

import { redirect } from 'next/navigation';

export default function EuroMillionsRedirectPage() {
  redirect('../bets');
}
