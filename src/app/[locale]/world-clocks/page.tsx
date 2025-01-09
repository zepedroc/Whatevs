'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import AnalogClock from '@/components/analog-clock';
import DigitalClock from '@/components/digital-clock';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function WorldClocksPage() {
  const t = useTranslations();
  const [isAnalog, setIsAnalog] = useState(true);

  const clocks = [
    { timezone: 'Europe/Lisbon', label: t('WorldClocks.portugal') },
    { timezone: 'Europe/Stockholm', label: t('WorldClocks.sweden') },
    { timezone: 'Asia/Tokyo', label: t('WorldClocks.japan') },
    { timezone: 'America/New_York', label: t('WorldClocks.usa') },
  ];

  const ClockComponent = isAnalog ? AnalogClock : DigitalClock;

  return (
    <div className="p-6 bg-gray-100 h-[calc(100vh-64px)]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">{t('WorldClocks.title')}</h1>

        <div className="flex items-center justify-center gap-2 mb-8">
          <Label htmlFor="clock-mode" className="text-sm font-medium">
            {t('WorldClocks.digitalMode')}
          </Label>
          <Switch id="clock-mode" checked={isAnalog} onCheckedChange={setIsAnalog} />
          <Label htmlFor="clock-mode" className="text-sm font-medium">
            {t('WorldClocks.analogMode')}
          </Label>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {clocks.map((clock) => (
            <ClockComponent key={clock.timezone} timezone={clock.timezone} label={clock.label} />
          ))}
        </div>
      </div>
    </div>
  );
}
