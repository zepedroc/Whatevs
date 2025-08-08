'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface PongGameProps {
  width?: number;
  height?: number;
  winningScore?: number;
}

// Game constants
const DEFAULT_WINNING_SCORE = 5;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const PADDLE_SPEED = 5;
const BALL_SIZE = 10;
const BALL_SPEED = 4;
const LEFT_PADDLE_COLOR = '#3B82F6'; // Blue
const RIGHT_PADDLE_COLOR = '#EF4444'; // Red

export default function PongGame({ width = 800, height = 500, winningScore = DEFAULT_WINNING_SCORE }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const gameStateRef = useRef({
    leftPaddleY: height / 2 - PADDLE_HEIGHT / 2,
    rightPaddleY: height / 2 - PADDLE_HEIGHT / 2,
    ballX: width / 2,
    ballY: height / 2,
    ballSpeedX: BALL_SPEED,
    ballSpeedY: BALL_SPEED,
    leftScore: 0,
    rightScore: 0,
    gameOver: false,
    winner: '',
  });

  // Game state for rendering
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});

  // Refs for direct access in the game loop
  const keysPressedRef = useRef(keysPressed);

  // Update the keys pressed ref when state changes
  useEffect(() => {
    keysPressedRef.current = keysPressed;
  }, [keysPressed]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for game controls to avoid page scrolling
      if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
      setKeysPressed((prev) => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeysPressed((prev) => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const resetBall = useCallback(() => {
    // Randomize initial direction
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const dirY = Math.random() > 0.5 ? 1 : -1;

    // Update game state ref directly
    gameStateRef.current.ballX = width / 2;
    gameStateRef.current.ballY = height / 2;
    gameStateRef.current.ballSpeedX = BALL_SPEED * dirX;
    gameStateRef.current.ballSpeedY = BALL_SPEED * dirY;
  }, [width, height]);

  // Check if game is over
  const checkGameOver = useCallback(() => {
    if (gameStateRef.current.leftScore >= winningScore) {
      gameStateRef.current.gameOver = true;
      gameStateRef.current.winner = 'Left Player';
      setGameOver(true);
      return true;
    } else if (gameStateRef.current.rightScore >= winningScore) {
      gameStateRef.current.gameOver = true;
      gameStateRef.current.winner = 'Right Player';
      setGameOver(true);
      return true;
    }
    return false;
  }, [winningScore]);

  // Reset game
  const resetGame = () => {
    gameStateRef.current = {
      leftPaddleY: height / 2 - PADDLE_HEIGHT / 2,
      rightPaddleY: height / 2 - PADDLE_HEIGHT / 2,
      ballX: width / 2,
      ballY: height / 2,
      ballSpeedX: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      ballSpeedY: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      leftScore: 0,
      rightScore: 0,
      gameOver: false,
      winner: '',
    };

    setGameOver(false);
    setGameStarted(true);
  };

  // Game animation loop using requestAnimationFrame for smoother animation
  const animate = useCallback((time: number) => {
    if (previousTimeRef.current === null) {
      previousTimeRef.current = time;
    }

    previousTimeRef.current = time;

    const canvas = canvasRef.current;
    if (!canvas) {
      requestRef.current = window.requestAnimationFrame(animate);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      requestRef.current = window.requestAnimationFrame(animate);
      return;
    }

    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // If game is over, show winner message
    if (gameStateRef.current.gameOver) {
      ctx.fillStyle = 'white';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${gameStateRef.current.winner} wins!`, width / 2, height / 2 - 24);
      ctx.font = '24px Arial';
      ctx.fillText('Press "Play Again" to restart', width / 2, height / 2 + 24);

      // Continue animation loop
      requestRef.current = window.requestAnimationFrame(animate);
      return;
    }

    // Get current keys pressed
    const currentKeysPressed = keysPressedRef.current;

    // Move paddles based on key presses
    if (currentKeysPressed['w'] && gameStateRef.current.leftPaddleY > 0) {
      gameStateRef.current.leftPaddleY -= PADDLE_SPEED;
    }
    if (currentKeysPressed['s'] && gameStateRef.current.leftPaddleY < height - PADDLE_HEIGHT) {
      gameStateRef.current.leftPaddleY += PADDLE_SPEED;
    }
    if (currentKeysPressed['ArrowUp'] && gameStateRef.current.rightPaddleY > 0) {
      gameStateRef.current.rightPaddleY -= PADDLE_SPEED;
    }
    if (currentKeysPressed['ArrowDown'] && gameStateRef.current.rightPaddleY < height - PADDLE_HEIGHT) {
      gameStateRef.current.rightPaddleY += PADDLE_SPEED;
    }

    // Move ball
    gameStateRef.current.ballX += gameStateRef.current.ballSpeedX;
    gameStateRef.current.ballY += gameStateRef.current.ballSpeedY;

    // Ball collision with top and bottom walls
    if (gameStateRef.current.ballY <= 0 || gameStateRef.current.ballY >= height - BALL_SIZE) {
      gameStateRef.current.ballSpeedY = -gameStateRef.current.ballSpeedY;
    }

    // Ball collision with paddles
    if (
      (gameStateRef.current.ballX <= PADDLE_WIDTH &&
        gameStateRef.current.ballY + BALL_SIZE >= gameStateRef.current.leftPaddleY &&
        gameStateRef.current.ballY <= gameStateRef.current.leftPaddleY + PADDLE_HEIGHT) ||
      (gameStateRef.current.ballX >= width - PADDLE_WIDTH - BALL_SIZE &&
        gameStateRef.current.ballY + BALL_SIZE >= gameStateRef.current.rightPaddleY &&
        gameStateRef.current.ballY <= gameStateRef.current.rightPaddleY + PADDLE_HEIGHT)
    ) {
      gameStateRef.current.ballSpeedX = -gameStateRef.current.ballSpeedX * 1.05; // Increase speed slightly on paddle hit
    }

    // Ball out of bounds - scoring
    if (gameStateRef.current.ballX <= 0) {
      // Right player scores
      gameStateRef.current.rightScore += 1;

      // Check if game is over
      if (!checkGameOver()) {
        resetBall();
      }
    } else if (gameStateRef.current.ballX >= width - BALL_SIZE) {
      // Left player scores
      gameStateRef.current.leftScore += 1;

      // Check if game is over
      if (!checkGameOver()) {
        resetBall();
      }
    }

    // Draw paddles with different colors
    // Left paddle (blue)
    ctx.fillStyle = LEFT_PADDLE_COLOR;
    ctx.fillRect(0, gameStateRef.current.leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Right paddle (red)
    ctx.fillStyle = RIGHT_PADDLE_COLOR;
    ctx.fillRect(width - PADDLE_WIDTH, gameStateRef.current.rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball as a circle (restored)
    ctx.beginPath();
    ctx.arc(
      gameStateRef.current.ballX + BALL_SIZE / 2,
      gameStateRef.current.ballY + BALL_SIZE / 2,
      BALL_SIZE / 2,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();

    // Draw center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.strokeStyle = 'white';
    ctx.stroke();

    // Draw scores with labels
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';

    // Left score
    ctx.fillStyle = LEFT_PADDLE_COLOR;
    ctx.fillText(`Left: ${gameStateRef.current.leftScore}`, width / 4, 50);

    // Right score
    ctx.fillStyle = RIGHT_PADDLE_COLOR;
    ctx.fillText(`Right: ${gameStateRef.current.rightScore}`, (3 * width) / 4, 50);

    // Continue animation loop
    requestRef.current = window.requestAnimationFrame(animate);
  }, [width, height, checkGameOver, resetBall]);

  // Start/stop game loop
  useEffect(() => {
    if (gameStarted) {
      // Initialize game state
      gameStateRef.current = {
        leftPaddleY: height / 2 - PADDLE_HEIGHT / 2,
        rightPaddleY: height / 2 - PADDLE_HEIGHT / 2,
        ballX: width / 2,
        ballY: height / 2,
        ballSpeedX: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
        ballSpeedY: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
        leftScore: 0,
        rightScore: 0,
        gameOver: false,
        winner: '',
      };

      // Start animation loop
      requestRef.current = window.requestAnimationFrame(animate);
    } else if (requestRef.current) {
      window.cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current) {
        window.cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameStarted, animate, height, width]);

  return (
    <div className="flex flex-col items-center">
      {!gameStarted ? (
        <div className="mb-4 text-center">
          <h3 className="text-xl mb-4">Controls:</h3>
          <div className="flex justify-center gap-12 mb-6">
            <div>
              <h4 className="font-semibold mb-2" style={{ color: LEFT_PADDLE_COLOR }}>
                Left Player
              </h4>
              <p>W (up)</p>
              <p>S (down)</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: RIGHT_PADDLE_COLOR }}>
                Right Player
              </h4>
              <p>↑ (up)</p>
              <p>↓ (down)</p>
            </div>
          </div>
          <p className="mb-4">First to {winningScore} points wins!</p>
          <button
            onClick={() => setGameStarted(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <canvas ref={canvasRef} width={width} height={height} className="border border-gray-700 rounded-lg" />
          {gameOver && (
            <div className="mt-4">
              <button
                onClick={resetGame}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
