'use client';

import { useState } from 'react';

import { LatLngTuple } from 'leaflet';

import { MapActions } from '@/components/map-actions';
import WorldMap from '@/components/world-map';

export default function WorldMapPage() {
  const [targetLocation, setTargetLocation] = useState<LatLngTuple | null>(null);
  const [timezone, setTimezone] = useState('Europe/Lisbon');
  const [isLoadingTimezone, setIsLoadingTimezone] = useState(false);

  const handleLocationFound = (lat: number, lng: number, isFromChat: boolean = false) => {
    setTargetLocation([lat, lng]);
    if (!isFromChat) {
      setIsLoadingTimezone(true);
    }
  };

  const handleTimezoneChange = (newTimezone: string) => {
    setIsLoadingTimezone(false);
    setTimezone(newTimezone);
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-4">
      <div className="flex gap-4 h-full">
        <div className="flex-1">
          <WorldMap targetLocation={targetLocation} timezone={timezone} isLoadingTimezone={isLoadingTimezone} />
        </div>
        <div className="w-[300px] bg-white p-4">
          <MapActions onLocationFound={handleLocationFound} onTimezoneChange={handleTimezoneChange} />
        </div>
      </div>
    </div>
  );
}
