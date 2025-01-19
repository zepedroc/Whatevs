'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LocationClockProps {
  timezone: string;
  isLoading?: boolean;
}

export function LocationClock({ timezone, isLoading = false }: LocationClockProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    if (!timezone) return;

    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone,
      };

      try {
        const formatter = new Intl.DateTimeFormat('en-US', options);
        setTime(formatter.format(new Date()));
      } catch (error) {
        console.error('Error formatting time:', error);
      }
    };

    // Update immediately
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [timezone]);

  if (!timezone && !isLoading) return null;

  return (
    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-lg font-mono shadow-lg z-[1000]">
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading timezone...</span>
        </div>
      ) : (
        time
      )}
    </div>
  );
}
