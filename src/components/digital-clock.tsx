'use client';

import React, { useEffect, useState } from 'react';

interface DigitalClockProps {
  timezone: string;
  label: string;
}

const DigitalClock: React.FC<DigitalClockProps> = ({ timezone, label }) => {
  const [time, setTime] = useState(new Date());
  const [isFlickering, setIsFlickering] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const digitalTime = time.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="flex flex-col items-center m-4 p-6 rounded-lg border border-green-500/30 bg-black/95 shadow-lg w-48">
      <h2 className="text-lg font-semibold mb-4 text-green-500/90">{label}</h2>
      <div
        className={`text-3xl tracking-wider ${isFlickering ? 'opacity-50' : 'opacity-100'} transition-opacity duration-50`}
        style={{
          color: '#22ff22',
          textShadow: '0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00',
          fontFamily: 'var(--font-matrix), monospace',
          letterSpacing: '0.1em',
        }}
      >
        {digitalTime}
      </div>
    </div>
  );
};

export default DigitalClock;
