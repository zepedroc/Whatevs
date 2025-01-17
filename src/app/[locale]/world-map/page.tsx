'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// We need to dynamically import the map component because Leaflet requires window object
const WorldMap = dynamic(() => import('@/components/world-map'), {
  ssr: false,
  loading: () => <div>Loading map...</div>,
});

export default function WorldMapPage() {
  const t = useTranslations('WorldMap');
  const [searchLocation, setSearchLocation] = useState('');
  const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}`,
      );
      const data = await response.json();

      if (data && data[0]) {
        setTargetLocation([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden p-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-[15px]">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder={t('searchPlaceholder')}
            />
            <Button type="submit" size="sm">
              {t('searchButton')}
            </Button>
          </form>
        </div>
        <div className="h-[calc(100vh-12rem)] p-[15px]">
          <div className="h-full rounded-lg overflow-hidden">
            <Suspense fallback={<div>Loading map...</div>}>
              <WorldMap targetLocation={targetLocation} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
