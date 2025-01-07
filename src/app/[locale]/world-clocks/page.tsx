import AnalogClock from '@/components/analog-clock';
import { useTranslations } from 'next-intl';

export default function WorldClocksPage() {
  const t = useTranslations();

  const clocks = [
    { timezone: 'Europe/Lisbon', label: t('WorldClocks.portugal') },
    { timezone: 'Europe/Stockholm', label: t('WorldClocks.sweden') },
    { timezone: 'Asia/Tokyo', label: t('WorldClocks.japan') },
    { timezone: 'America/New_York', label: t('WorldClocks.usa') },
  ];

  return (
    <div className="p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-center">{t('WorldClocks.title')}</h1>
      <div className="flex flex-wrap justify-center gap-6">
        {clocks.map((clock) => (
          <AnalogClock key={clock.timezone} timezone={clock.timezone} label={clock.label} />
        ))}
      </div>
    </div>
  );
}
