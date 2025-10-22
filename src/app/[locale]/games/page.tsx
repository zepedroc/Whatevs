'use client';

import { useState } from 'react';

import dynamic from 'next/dynamic';

import { Bot } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Use dynamic import with no SSR for the game component since it uses browser APIs
const PongGame = dynamic(() => import('@/components/games/pong-game'), { ssr: false });
const Connect4Game = dynamic(() => import('@/components/games/connect4-game'), { ssr: false });
const SpaceInvadersGame = dynamic(() => import('@/components/games/space-invaders'), { ssr: false });
const TicTacToe = dynamic(() => import('@/components/games/tic-tac-toe'), { ssr: false });

type GameType = 'pong' | 'connect4' | 'space-invaders' | 'tic-tac-toe';

export default function GamesPage() {
  const t = useTranslations('Games');
  const [activeGame, setActiveGame] = useState<GameType>('pong');

  // Game selection handler
  const handleGameSelect = (game: GameType) => {
    setActiveGame(game);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

      {/* Game selection cards - shown only when no game is active */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleGameSelect('pong')}
            className={`py-3 px-6 font-medium text-lg rounded-t-lg transition-colors cursor-pointer ${
              activeGame === 'pong'
                ? 'bg-black text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Multiplayer Pong
          </button>
          <button
            onClick={() => handleGameSelect('space-invaders')}
            className={`py-3 px-6 font-medium text-lg rounded-t-lg transition-colors cursor-pointer ${
              activeGame === 'space-invaders'
                ? 'bg-black text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Space Invaders
          </button>
          <button
            onClick={() => handleGameSelect('connect4')}
            className={`py-3 px-6 font-medium text-lg rounded-t-lg transition-colors cursor-pointer ${
              activeGame === 'connect4'
                ? 'bg-black text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span>Connect 4</span>
              <Bot className="w-4 h-4" />
            </span>
          </button>
          <button
            onClick={() => handleGameSelect('tic-tac-toe')}
            className={`py-3 px-6 font-medium text-lg rounded-t-lg transition-colors cursor-pointer ${
              activeGame === 'tic-tac-toe'
                ? 'bg-black text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span>Tic-Tac-Toe</span>
              <Bot className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>

      {/* Active game container */}
      <div className="mt-6">
        {activeGame === 'pong' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Multiplayer Pong</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Classic Pong game with multiplayer support. Use W/S keys for the left paddle and Up/Down arrows for the right
              paddle.
            </p>
            <div className="bg-black rounded-lg p-4 w-full max-w-4xl mx-auto">
              <PongGame />
            </div>
          </div>
        )}

        {activeGame === 'connect4' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Connect 4</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Classic Connect 4 game for two players. Take turns dropping pieces and connect four in a row to win!
            </p>
            <div className="rounded-lg p-4 w-full max-w-4xl mx-auto border border-gray-200 dark:border-gray-800">
              <Connect4Game />
            </div>
          </div>
        )}

        {activeGame === 'space-invaders' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Space Invaders</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Classic Space Invaders game for two players. Take turns dropping pieces and connect four in a row to win!
            </p>
            <div className="bg-black rounded-lg p-4 w-full max-w-4xl mx-auto">
              <SpaceInvadersGame />
            </div>
          </div>
        )}

        {activeGame === 'tic-tac-toe' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Tic-Tac-Toe</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Play Tic-Tac-Toe against an AI model.</p>
            <div className="rounded-lg p-4 w-full max-w-3xl mx-auto border border-gray-200 dark:border-gray-800">
              <TicTacToe />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
