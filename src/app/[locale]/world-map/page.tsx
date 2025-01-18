'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapActions } from '@/components/map-actions';

// We need to dynamically import the map component because Leaflet requires window object
const WorldMap = dynamic(() => import('@/components/world-map'), {
  ssr: false,
  loading: () => <div>Loading map...</div>,
});

export default function WorldMapPage() {
  const t = useTranslations('WorldMap');
  const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null);

  const handleLocationFound = (lat: number, lng: number) => {
    setTargetLocation([lat, lng]);
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden p-4">
      <h1 className="text-2xl font-bold mb-4 px-[15px]">{t('title')}</h1>
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        <div className="flex-1 rounded-lg overflow-hidden">
          <Suspense fallback={<div>Loading map...</div>}>
            <WorldMap targetLocation={targetLocation} />
          </Suspense>
        </div>
        <div className="w-[300px] bg-background rounded-lg p-4 shadow-sm">
          <MapActions onLocationFound={handleLocationFound} />
        </div>
      </div>
    </div>
  );
}
