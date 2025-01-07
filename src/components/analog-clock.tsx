'use client';

import React, { useState, useEffect } from 'react';

type AnalogClockProps = {
  timezone: string;
  label: string;
};

const AnalogClock: React.FC<AnalogClockProps> = ({ timezone, label }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeInTimezone = () => {
    return new Date(time.toLocaleString('en-US', { timeZone: timezone }));
  };

  const timeInZone = getTimeInTimezone();
  const seconds = timeInZone.getSeconds() * 6;
  const minutes = timeInZone.getMinutes() * 6 + seconds / 60;
  const hours = (timeInZone.getHours() % 12) * 30 + minutes / 12;

  return (
    <div className="flex flex-col items-center m-4">
      <h2 className="text-lg font-semibold mb-2">{label}</h2>
      <div className="relative w-48 h-48">
        {/* Clock face */}
        <div className="absolute inset-0 rounded-full bg-white border-4 border-gray-300 shadow">
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-full"
              style={{
                transform: `rotate(${i * 30}deg)`,
              }}
            >
              <div className="absolute w-1 h-4 bg-gray-800 left-1/2 transform -translate-x-1/2" />
            </div>
          ))}

          {/* Hour hand */}
          <div
            className="absolute bg-gray-800 rounded-full"
            style={{
              width: '4px',
              height: '30%',
              transform: `rotate(${hours}deg)`,
              left: 'calc(50% - 2px)',
              bottom: '50%',
              transformOrigin: 'bottom',
            }}
          />

          {/* Minute hand */}
          <div
            className="absolute bg-gray-800 rounded-full"
            style={{
              width: '2px',
              height: '40%',
              transform: `rotate(${minutes}deg)`,
              left: 'calc(50% - 1px)',
              bottom: '50%',
              transformOrigin: 'bottom',
            }}
          />

          {/* Second hand */}
          <div
            className="absolute bg-red-500 rounded-full"
            style={{
              width: '1px',
              height: '45%',
              transform: `rotate(${seconds}deg)`,
              left: 'calc(50% - 0.5px)',
              bottom: '50%',
              transformOrigin: 'bottom',
            }}
          />

          {/* Center piece */}
          <div
            className="absolute w-4 h-4 bg-gray-800 rounded-full"
            style={{ left: 'calc(50% - 8px)', top: 'calc(50% - 8px)' }}
          />
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-600">{timeInZone.toLocaleTimeString()}</div>
    </div>
  );
};

export default AnalogClock;
