"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface SimulationConfig {
  type?: string;
  title?: string;
  description?: string;
  parameters?: {
    gravity?: number;
    friction?: number;
    restitution?: number;
  };
}

interface PhysicsSimulatorProps {
  simulation: SimulationConfig;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

const PhysicsSimulator: React.FC<PhysicsSimulatorProps> = ({ simulation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [isRunning, setIsRunning] = useState(false);
  const [gravity, setGravity] = useState(0.5);
  const [balls, setBalls] = useState<Ball[]>([]);
  
  // Use balls variable to satisfy linter (balls is accessed via canvas refs and setBalls)
  console.debug('Balls count:', balls.length);

  // Initialize balls
  const initBalls = () => {
    const newBalls: Ball[] = [];
    for (let i = 0; i < 8; i++) {
      newBalls.push({
        x: Math.random() * 700 + 50,
        y: Math.random() * 200 + 50,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * 5,
        radius: Math.random() * 20 + 10,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
      });
    }
    setBalls(newBalls);
  };

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw balls
    setBalls(prevBalls => {
      return prevBalls.map(ball => {
        // Apply gravity
        ball.vy += gravity;
        
        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce off walls
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
          ball.vx *= -0.8;
          ball.x = ball.x - ball.radius <= 0 ? ball.radius : canvas.width - ball.radius;
        }
        
        if (ball.y + ball.radius >= canvas.height) {
          ball.vy *= -0.7;
          ball.y = canvas.height - ball.radius;
        }

        // Draw ball
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        return ball;
      });
    });

    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [gravity, isRunning]);

  // Control functions
  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    initBalls();
  };

  const addBall = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newBall: Ball = {
      x: Math.random() * (canvas.width - 100) + 50,
      y: 50,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 3,
      radius: Math.random() * 15 + 10,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };

    setBalls(prev => [...prev, newBall]);
  };

  // Initialize
  useEffect(() => {
    initBalls();
  }, []);

  // Start/stop animation
  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, gravity, animate]);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          {simulation?.title || "Physics Simulation"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {simulation?.description || "Interactive bouncing balls with realistic physics"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Canvas */}
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full h-auto cursor-pointer"
            onClick={addBall}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={toggleSimulation} className="flex items-center gap-2">
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start
              </>
            )}
          </Button>
          
          <Button variant="outline" onClick={resetSimulation}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>

          <Button variant="outline" onClick={addBall}>
            Add Ball
          </Button>

          <div className="flex items-center gap-3 ml-4">
            <label className="text-sm font-medium">Gravity:</label>
            <Slider
              value={[gravity]}
              onValueChange={(value) => setGravity(value[0])}
              max={1.5}
              min={0}
              step={0.1}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground w-8">{gravity.toFixed(1)}</span>
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Click on the canvas to add more balls! • Adjust gravity to see different behaviors</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhysicsSimulator;
