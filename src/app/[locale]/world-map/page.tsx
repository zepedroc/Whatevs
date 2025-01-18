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
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-[15px]">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <MapActions onLocationFound={handleLocationFound} />
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
