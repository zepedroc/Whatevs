import { useCallback, useEffect, useRef, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Alien extends Position {
  id: number;
  alive: boolean;
}

interface Bullet extends Position {
  id: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 40;
const ALIEN_WIDTH = 40;
const ALIEN_HEIGHT = 30;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 15;
const PLAYER_SPEED = 8;
const BULLET_SPEED = 10;
const ALIEN_BULLET_SPEED = 5;
const ALIEN_SPEED = 0.5;
const INITIAL_LIVES = 3;

export default function SpaceInvadersGame() {
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [alienBullets, setAlienBullets] = useState<Bullet[]>([]);
  const [aliens, setAliens] = useState<Alien[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [alienDirection, setAlienDirection] = useState(1);
  const [playerHit, setPlayerHit] = useState(false);
  const [lastAlienShot, setLastAlienShot] = useState(0);

  const keysPressed = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number | null>(null);
  const bulletIdRef = useRef(0);
  const alienBulletIdRef = useRef(0);

  // Initialize aliens
  const initializeAliens = useCallback(() => {
    const newAliens: Alien[] = [];
    let id = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 11; col++) {
        newAliens.push({
          id: id++,
          x: col * 60 + 100,
          y: row * 50 + 50,
          alive: true,
        });
      }
    }
    setAliens(newAliens);
  }, []);

  // Start new game
  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(INITIAL_LIVES);
    setBullets([]);
    setAlienBullets([]);
    setPlayerX(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
    setAlienDirection(1);
    setPlayerHit(false);
    setLastAlienShot(Date.now());
    initializeAliens();
  }, [initializeAliens]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);

      if (e.key === ' ' && gameStarted && !gameOver) {
        e.preventDefault();
        setBullets((prev) => {
          // Limit number of bullets on screen
          if (prev.length >= 3) return prev;
          return [
            ...prev,
            {
              id: bulletIdRef.current++,
              x: playerX + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
              y: GAME_HEIGHT - PLAYER_HEIGHT - 20,
            },
          ];
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerX, gameStarted, gameOver]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      // Move player
      if (keysPressed.current.has('ArrowLeft')) {
        setPlayerX((prev) => Math.max(0, prev - PLAYER_SPEED));
      }
      if (keysPressed.current.has('ArrowRight')) {
        setPlayerX((prev) => Math.min(GAME_WIDTH - PLAYER_WIDTH, prev + PLAYER_SPEED));
      }

      // Move player bullets
      setBullets((prev) =>
        prev.map((bullet) => ({ ...bullet, y: bullet.y - BULLET_SPEED })).filter((bullet) => bullet.y > 0),
      );

      // Move alien bullets
      setAlienBullets((prev) =>
        prev.map((bullet) => ({ ...bullet, y: bullet.y + ALIEN_BULLET_SPEED })).filter((bullet) => bullet.y < GAME_HEIGHT),
      );

      // Aliens shoot
      const now = Date.now();
      const aliveAliens = aliens.filter((alien) => alien.alive);
      if (
        aliveAliens.length > 0 &&
        now - lastAlienShot > (1000 + Math.random() * 2000) / Math.max(1, aliveAliens.length / 10)
      ) {
        const shootingAlien = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
        setAlienBullets((prev) => [
          ...prev,
          {
            id: alienBulletIdRef.current++,
            x: shootingAlien.x + ALIEN_WIDTH / 2 - BULLET_WIDTH / 2,
            y: shootingAlien.y + ALIEN_HEIGHT,
          },
        ]);
        setLastAlienShot(now);
      }

      // Move aliens
      setAliens((prev) => {
        const aliveAliens = prev.filter((alien) => alien.alive);
        if (aliveAliens.length === 0) {
          setGameOver(true);
          return prev;
        }

        const rightMost = Math.max(...aliveAliens.map((a) => a.x));
        const leftMost = Math.min(...aliveAliens.map((a) => a.x));
        let newDirection = alienDirection;
        let shouldDrop = false;

        if (rightMost >= GAME_WIDTH - ALIEN_WIDTH - 20 && alienDirection > 0) {
          newDirection = -1;
          shouldDrop = true;
        } else if (leftMost <= 20 && alienDirection < 0) {
          newDirection = 1;
          shouldDrop = true;
        }

        if (newDirection !== alienDirection) {
          setAlienDirection(newDirection);
        }

        return prev.map((alien) => ({
          ...alien,
          x: alien.x + alienDirection * ALIEN_SPEED,
          y: shouldDrop ? alien.y + 30 : alien.y,
        }));
      });

      // Check player bullet collisions with aliens
      const collisions: { bulletId: number; alienId: number }[] = [];

      bullets.forEach((bullet) => {
        aliens.forEach((alien) => {
          if (!alien.alive) return;

          if (
            bullet.x < alien.x + ALIEN_WIDTH &&
            bullet.x + BULLET_WIDTH > alien.x &&
            bullet.y < alien.y + ALIEN_HEIGHT &&
            bullet.y + BULLET_HEIGHT > alien.y
          ) {
            collisions.push({ bulletId: bullet.id, alienId: alien.id });
          }
        });
      });

      // Update bullets - remove collided ones
      if (collisions.length > 0) {
        const collidedBulletIds = new Set(collisions.map((c) => c.bulletId));
        setBullets((prev) => prev.filter((bullet) => !collidedBulletIds.has(bullet.id)));
      }

      // Update aliens - mark collided ones as dead and update score
      if (collisions.length > 0) {
        const collidedAlienIds = new Set(collisions.map((c) => c.alienId));
        setAliens((prev) => prev.map((alien) => (collidedAlienIds.has(alien.id) ? { ...alien, alive: false } : alien)));
        setScore((prev) => prev + collisions.length * 10);
      }

      // Check alien bullet collisions with player
      setAlienBullets((prevBullets) => {
        const remainingBullets: Bullet[] = [];
        const playerY = GAME_HEIGHT - PLAYER_HEIGHT - 20;

        prevBullets.forEach((bullet) => {
          if (
            bullet.x < playerX + PLAYER_WIDTH &&
            bullet.x + BULLET_WIDTH > playerX &&
            bullet.y < playerY + PLAYER_HEIGHT &&
            bullet.y + BULLET_HEIGHT > playerY
          ) {
            // Player hit!
            setLives((prev) => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setGameOver(true);
              }
              return newLives;
            });
            setPlayerHit(true);
            setTimeout(() => setPlayerHit(false), 500);
          } else {
            remainingBullets.push(bullet);
          }
        });

        return remainingBullets;
      });

      // Check if aliens reached player
      aliens.forEach((alien) => {
        if (alien.alive && alien.y + ALIEN_HEIGHT >= GAME_HEIGHT - PLAYER_HEIGHT - 20) {
          setGameOver(true);
        }
      });

      // Check win condition
      if (aliens.every((alien) => !alien.alive)) {
        setGameOver(true);
      }
    };

    gameLoopRef.current = window.setInterval(gameLoop, 1000 / 60);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, aliens, alienDirection, playerX, lastAlienShot]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-black flex items-center justify-center p-8">
      <div className="relative">
        {/* Game Title */}
        <div className="text-center mb-6">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            SPACE INVADERS
          </h1>
          <div className="flex justify-center gap-8 text-xl">
            <p className="text-cyan-400">Score: {score}</p>
            <div className="flex items-center gap-2">
              <span className="text-pink-400">Lives:</span>
              <div className="flex gap-1">
                {[...Array(INITIAL_LIVES)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-4 ${i < lives ? 'bg-gradient-to-t from-cyan-400 to-blue-500' : 'bg-gray-700'} rounded-t-lg`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Game Container */}
        <div
          className="relative bg-black border-4 border-purple-500 rounded-lg shadow-2xl shadow-purple-500/50 overflow-hidden"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* Stars Background */}
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white rounded-full animate-pulse"
                style={{
                  width: Math.random() * 3 + 'px',
                  height: Math.random() * 3 + 'px',
                  left: Math.random() * GAME_WIDTH + 'px',
                  top: Math.random() * GAME_HEIGHT + 'px',
                  animationDelay: Math.random() * 3 + 's',
                }}
              />
            ))}
          </div>

          {!gameStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-cyan-400 mb-4">READY TO PLAY?</h2>
                <p className="text-white mb-2">Use ← → arrows to move, SPACE to shoot</p>
                <p className="text-orange-400 mb-6">Watch out! The aliens shoot back!</p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-purple-500/50"
                >
                  START GAME
                </button>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
              <div className="text-center">
                <h2 className="text-5xl font-bold text-red-500 mb-4">
                  {aliens.every((alien) => !alien.alive) ? 'YOU WIN!' : 'GAME OVER'}
                </h2>
                <p className="text-3xl text-cyan-400 mb-6">Final Score: {score}</p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-purple-500/50"
                >
                  PLAY AGAIN
                </button>
              </div>
            </div>
          )}

          {/* Player Ship */}
          {gameStarted && (
            <div
              className={`absolute transition-transform duration-150 ${playerHit ? 'scale-110 brightness-125' : ''}`}
              style={{
                left: playerX,
                bottom: 20,
                width: PLAYER_WIDTH,
                height: PLAYER_HEIGHT,
              }}
            >
              <div className="relative w-full h-full">
                <div className="absolute inset-x-4 inset-y-2 bg-gradient-to-t from-cyan-400 to-blue-500 rounded-t-lg" />
                <div className="absolute bottom-0 left-2 right-2 h-2 bg-cyan-300 rounded-b-sm" />
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-white rounded-t-full" />
              </div>
            </div>
          )}

          {/* Aliens */}
          {aliens.map(
            (alien) =>
              alien.alive && (
                <div
                  key={alien.id}
                  className="absolute"
                  style={{
                    left: alien.x,
                    top: alien.y,
                    width: ALIEN_WIDTH,
                    height: ALIEN_HEIGHT,
                  }}
                >
                  <div className="relative w-full h-full animate-pulse">
                    <div className="absolute inset-0 bg-gradient-to-b from-pink-500 to-purple-600 rounded-lg transform rotate-45" />
                    <div className="absolute inset-2 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full" />
                    <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full" />
                    <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
              ),
          )}

          {/* Player Bullets */}
          {bullets.map((bullet) => (
            <div
              key={bullet.id}
              className="absolute bg-gradient-to-t from-yellow-400 to-white rounded-full shadow-lg shadow-yellow-400/50"
              style={{
                left: bullet.x,
                top: bullet.y,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
              }}
            />
          ))}

          {/* Alien Bullets */}
          {alienBullets.map((bullet) => (
            <div
              key={bullet.id}
              className="absolute bg-gradient-to-b from-red-500 to-orange-600 rounded-full shadow-lg shadow-red-600/50"
              style={{
                left: bullet.x,
                top: bullet.y,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
              }}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-cyan-400">
          <p className="text-lg">← → Move • SPACE Shoot</p>
        </div>
      </div>
    </div>
  );
}
