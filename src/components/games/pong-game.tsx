import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Play, RotateCcw, Trophy } from 'lucide-react';

// --- Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_RADIUS = 8;
const WIN_SCORE = 5;
const INITIAL_BALL_SPEED = 5;
const MAX_BALL_SPEED = 12;
const AI_SPEED = 6;

// --- Types ---
type Vector = { x: number; y: number };
type Ball = {
  pos: Vector;
  vel: Vector;
  speed: number;
  active: boolean;
  color: string;
  trail: Vector[];
};
type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export default function DualBallPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [winner, setWinner] = useState<'PLAYER' | 'AI' | null>(null);

  // Mutable game state (kept out of React state for 60fps loop)
  const gameRef = useRef({
    playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    aiY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    targetAiY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    balls: [] as Ball[],
    mouseY: CANVAS_HEIGHT / 2,
    shakeIntensity: 0,
  });

  // --- Initialization Helpers ---
  const createBall = (startLeft: boolean, color: string): Ball => {
    const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8; // Random angle within +/- 22.5 deg
    const dir = startLeft ? 1 : -1;
    return {
      pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      vel: {
        x: INITIAL_BALL_SPEED * Math.cos(angle) * dir,
        y: INITIAL_BALL_SPEED * Math.sin(angle),
      },
      speed: INITIAL_BALL_SPEED,
      active: true,
      color: color,
      trail: [],
    };
  };

  const initGame = useCallback(() => {
    setScores({ player: 0, ai: 0 });
    setWinner(null);
    gameRef.current.playerY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    gameRef.current.aiY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    gameRef.current.balls = [
      createBall(true, '#22d3ee'), // Cyan ball
      createBall(false, '#f472b6'), // Pink ball
    ];
    setGameState('PLAYING');
  }, []);

  const resetBalls = () => {
    gameRef.current.balls = [createBall(Math.random() > 0.5, '#22d3ee'), createBall(Math.random() > 0.5, '#f472b6')];
  };

  // --- Game Loop Mechanics ---
  const update = () => {
    const { current: game } = gameRef;

    // 1. Update Player Paddle (Mouse follows)
    const targetPlayerY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, game.mouseY - PADDLE_HEIGHT / 2));
    // Smooth ease-in for player paddle purely visual, feels nice
    game.playerY += (targetPlayerY - game.playerY) * 0.3;

    // 2. Update AI Paddle
    // AI Strategy: Find closest incoming ball
    let targetBall = null;
    let maxThreatX = -Infinity;

    for (const ball of game.balls) {
      if (ball.vel.x > 0) {
        // Incoming to AI
        if (ball.pos.x > maxThreatX) {
          maxThreatX = ball.pos.x;
          targetBall = ball;
        }
      }
    }

    // If no immediate threat, loosely track the nearest ball regardless of direction
    if (!targetBall) {
      let minDistance = Infinity;
      for (const ball of game.balls) {
        const dist = CANVAS_WIDTH - ball.pos.x;
        if (dist < minDistance) {
          minDistance = dist;
          targetBall = ball;
        }
      }
    }

    if (targetBall) {
      game.targetAiY = targetBall.pos.y - PADDLE_HEIGHT / 2;
    } else {
      game.targetAiY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2; // Return to center if bored
    }

    // Clamp AI target
    game.targetAiY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, game.targetAiY));

    // Move AI towards target
    if (game.aiY < game.targetAiY) {
      game.aiY = Math.min(game.aiY + AI_SPEED, game.targetAiY);
    } else if (game.aiY > game.targetAiY) {
      game.aiY = Math.max(game.aiY - AI_SPEED, game.targetAiY);
    }

    // 3. Update Balls
    let scoreChanged = false;
    game.balls.forEach((ball) => {
      if (!ball.active) return;

      // Update trail
      ball.trail.push({ ...ball.pos });
      if (ball.trail.length > 10) ball.trail.shift();

      // Move
      ball.pos.x += ball.vel.x;
      ball.pos.y += ball.vel.y;

      // Ceiling/Floor Collision
      if (ball.pos.y - BALL_RADIUS < 0 || ball.pos.y + BALL_RADIUS > CANVAS_HEIGHT) {
        ball.vel.y = -ball.vel.y;
        ball.pos.y = Math.max(BALL_RADIUS, Math.min(CANVAS_HEIGHT - BALL_RADIUS, ball.pos.y));
      }

      // Paddle Collision Helpers
      const hitPaddle = (paddleX: number, paddleY: number) => {
        return (
          ball.pos.x - BALL_RADIUS < paddleX + PADDLE_WIDTH &&
          ball.pos.x + BALL_RADIUS > paddleX &&
          ball.pos.y > paddleY &&
          ball.pos.y < paddleY + PADDLE_HEIGHT
        );
      };

      // Player Paddle Collision
      if (ball.vel.x < 0 && hitPaddle(10, game.playerY)) {
        // 10 is paddle left margin
        let collidePoint = ball.pos.y - (game.playerY + PADDLE_HEIGHT / 2);
        collidePoint = collidePoint / (PADDLE_HEIGHT / 2);
        const angleRad = (Math.PI / 4) * collidePoint;
        const dir = 1;
        ball.speed = Math.min(ball.speed + 0.5, MAX_BALL_SPEED);
        ball.vel.x = dir * ball.speed * Math.cos(angleRad);
        ball.vel.y = ball.speed * Math.sin(angleRad);
        ball.pos.x = 10 + PADDLE_WIDTH + BALL_RADIUS;
      }

      // AI Paddle Collision
      if (ball.vel.x > 0 && hitPaddle(CANVAS_WIDTH - 10 - PADDLE_WIDTH, game.aiY)) {
        let collidePoint = ball.pos.y - (game.aiY + PADDLE_HEIGHT / 2);
        collidePoint = collidePoint / (PADDLE_HEIGHT / 2);
        const angleRad = (Math.PI / 4) * collidePoint;
        const dir = -1;
        ball.speed = Math.min(ball.speed + 0.5, MAX_BALL_SPEED);
        ball.vel.x = dir * ball.speed * Math.cos(angleRad);
        ball.vel.y = ball.speed * Math.sin(angleRad);
        ball.pos.x = CANVAS_WIDTH - 10 - PADDLE_WIDTH - BALL_RADIUS;
      }

      // Scoring
      if (ball.pos.x + BALL_RADIUS < 0) {
        // AI scored
        setScores((prev) => ({ ...prev, ai: prev.ai + 1 }));
        ball.active = false;
        scoreChanged = true;
        game.shakeIntensity = 10;
      } else if (ball.pos.x - BALL_RADIUS > CANVAS_WIDTH) {
        // Player scored
        setScores((prev) => ({ ...prev, player: prev.player + 1 }));
        ball.active = false;
        scoreChanged = true;
        game.shakeIntensity = 10;
      }
    });

    // Reset balls if both are inactive
    if (game.balls.every((b) => !b.active)) {
      resetBalls();
    }

    // If a score happened and only one ball remains active, spawn a new one to keep two in play
    if (scoreChanged) {
      const activeBalls = game.balls.filter((b) => b.active);
      if (activeBalls.length === 1) {
        const existingColor = activeBalls[0].color;
        const newColor = existingColor === '#22d3ee' ? '#f472b6' : '#22d3ee';
        const newBall = createBall(Math.random() > 0.5, newColor);
        game.balls = [activeBalls[0], newBall];
      }
    }

    if (game.shakeIntensity > 0) {
      game.shakeIntensity *= 0.9;
      if (game.shakeIntensity < 0.5) game.shakeIntensity = 0;
    }
  };

  // Check win condition outside the loop to avoid state update loop issues
  useEffect(() => {
    if (scores.player >= WIN_SCORE) {
      setWinner('PLAYER');
      setGameState('GAME_OVER');
    } else if (scores.ai >= WIN_SCORE) {
      setWinner('AI');
      setGameState('GAME_OVER');
    }
  }, [scores]);

  // --- Rendering --- //
  const draw = (ctx: CanvasRenderingContext2D) => {
    const { current: game } = gameRef;

    // Clear with slight trail effect for whole screen if desired, but standard clear is cleaner for this style
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Screen shake
    ctx.save();
    if (game.shakeIntensity > 0) {
      const dx = (Math.random() - 0.5) * game.shakeIntensity;
      const dy = (Math.random() - 0.5) * game.shakeIntensity;
      ctx.translate(dx, dy);
    }

    // Draw Net
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.setLineDash([10, 15]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Helper to draw glowing elements
    const drawGlowingRect = (x: number, y: number, w: number, h: number, color: string, glow: number = 20) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.shadowBlur = 0;
    };

    const drawGlowingCircle = (x: number, y: number, r: number, color: string, glow: number = 20) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;
    };

    // Player Paddle (Cyan)
    drawGlowingRect(10, game.playerY, PADDLE_WIDTH, PADDLE_HEIGHT, '#22d3ee');
    // AI Paddle (Magenta)
    drawGlowingRect(CANVAS_WIDTH - 10 - PADDLE_WIDTH, game.aiY, PADDLE_WIDTH, PADDLE_HEIGHT, '#e879f9');

    // Balls
    game.balls.forEach((ball) => {
      if (!ball.active) return;

      // Draw Trail
      ball.trail.forEach((pos, i) => {
        const opacity = (i / ball.trail.length) * 0.5;
        const size = BALL_RADIUS * (i / ball.trail.length);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.closePath();
      });
      ctx.globalAlpha = 1.0;

      // Draw Ball
      drawGlowingCircle(ball.pos.x, ball.pos.y, BALL_RADIUS, ball.color, 30);

      // White center for extra pop
      ctx.beginPath();
      ctx.arc(ball.pos.x, ball.pos.y, BALL_RADIUS * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.closePath();
    });

    ctx.restore();
  };

  const animate = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    update();
    draw(ctx);

    requestRef.current = requestAnimationFrame(animate);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      requestRef.current = requestAnimationFrame(animate);
    } else if (gameState === 'GAME_OVER' || gameState === 'MENU') {
      // Draw one last frame or initial frame if needed
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) draw(ctx);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, animate]);

  // --- Input Handling ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      gameRef.current.mouseY = e.clientY - rect.top;
    }
  };

  // --- UI Rendering ---
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans select-none">
      {/* Header / Scoreboard */}
      <div className="w-full max-w-[800px] flex justify-between items-center mb-6 px-4">
        <div className="flex flex-col items-center">
          <h2 className="text-cyan-400 font-bold text-xl tracking-wider uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            Player
          </h2>
          <div className="text-6xl font-black text-slate-100 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] font-mono">
            {String(scores.player).padStart(2, '0')}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-slate-700 font-bold text-xl tracking-[0.5em]">VS</div>
          <div className="text-slate-600 text-sm mt-2">TARGET: {WIN_SCORE}</div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-fuchsia-400 font-bold text-xl tracking-wider uppercase drop-shadow-[0_0_10px_rgba(232,121,249,0.5)]">
            AI-Core
          </h2>
          <div className="text-6xl font-black text-slate-100 drop-shadow-[0_0_15px_rgba(232,121,249,0.8)] font-mono">
            {String(scores.ai).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative group rounded-2xl p-1 bg-gradient-to-br from-cyan-500 via-purple-500 to-fuchsia-500 shadow-[0_0_50px_-12px_rgba(168,85,247,0.5)]">
        <div className="relative rounded-xl overflow-hidden bg-slate-900" onMouseMove={handleMouseMove}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block cursor-none"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          />

          {/* Scanlines overlay for retro feel */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20 mix-blend-overlay"></div>

          {/* Overlays */}
          {gameState === 'MENU' && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)] mb-8 italic tracking-tight">
                NEON PONG DX
              </h1>
              <button
                onClick={initGame}
                className="group relative px-8 py-4 bg-slate-800 text-cyan-50 font-bold text-xl rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-3">
                  <Play className="w-6 h-6 fill-current" /> START GAME
                </span>
              </button>
              <p className="text-slate-400 mt-6 flex flex-col items-center gap-1">
                <span className="text-sm uppercase tracking-widest">Two balls active simultaneously</span>
                <span className="text-xs opacity-50">Use mouse to control left paddle</span>
              </p>
            </div>
          )}

          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-700">
              <Trophy
                className={`w-20 h-20 mb-4 ${winner === 'PLAYER' ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'text-slate-600'}`}
              />

              <h2 className="text-5xl font-black text-white mb-2 drop-shadow-lg">
                {winner === 'PLAYER' ? 'VICTORY' : 'DEFEAT'}
              </h2>
              <p className={`text-2xl font-bold mb-8 ${winner === 'PLAYER' ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
                {winner === 'PLAYER' ? 'Humanity prevails' : 'AI superiority achieved'}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={initGame}
                  className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                >
                  <RotateCcw className="w-5 h-5" /> PLAY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-slate-500 text-sm">First to {WIN_SCORE} points wins.</div>
    </div>
  );
}
