'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR for the game component since it uses browser APIs
const PongGame = dynamic(() => import('@/components/games/pong-game'), { ssr: false });

export default function GamesPage() {
  const t = useTranslations('Games');

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2">Multiplayer Pong</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Classic Pong game with multiplayer support</p>
            <a
              href="#pong"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Play Now
            </a>
          </div>
        </div>
      </div>

      <div id="pong" className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Multiplayer Pong</h2>
        <div className="bg-black rounded-lg p-4 w-full max-w-4xl mx-auto">
          <PongGame />
        </div>
      </div>
    </div>
  );
}
