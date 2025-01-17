'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// We need to dynamically import the map component because Leaflet requires window object
const WorldMap = dynamic(() => import('@/components/world-map'), {
  ssr: false,
  loading: () => <div>Loading map...</div>,
});

export default function WorldMapPage() {
  return (
    <div className="h-screen w-full p-4">
      <h1 className="text-2xl font-bold mb-4">World Map</h1>
      <div className="h-[calc(100vh-8rem)] w-full">
        <Suspense fallback={<div>Loading map...</div>}>
          <WorldMap />
        </Suspense>
      </div>
    </div>
  );
}
