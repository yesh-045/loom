"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Zap, Volume2, VolumeX } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface SimulationConfig {
  type: 'bouncing_balls' | 'pendulum' | 'wave' | 'particle_system' | 'gravity';
  title?: string;
  description?: string;
  parameters?: {
    gravity?: number;
    friction?: number;
    restitution?: number;
    particle_count?: number;
    wave_frequency?: number;
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
  mass: number;
  trail: { x: number; y: number }[];
}

interface Pendulum {
  angle: number;
  angularVelocity: number;
  length: number;
  bob: { x: number; y: number };
}

const PhysicsSimulator: React.FC<PhysicsSimulatorProps> = ({ simulation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [isRunning, setIsRunning] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [gravity, setGravity] = useState(simulation?.parameters?.gravity || 0.5);
  const [friction, setFriction] = useState(simulation?.parameters?.friction || 0.99);
  const [restitution, setRestitution] = useState(simulation?.parameters?.restitution || 0.8);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [stats, setStats] = useState({
    fps: 0,
    activeParticles: 0,
    totalEnergy: 0
  });

  // Simulation state
  const [balls, setBalls] = useState<Ball[]>([]);
  const [pendulums, setPendulums] = useState<Pendulum[]>([]);
  const [wavePhase, setWavePhase] = useState(0);
  const [lastTime, setLastTime] = useState(0);

  // Default simulation config
  const config: SimulationConfig = {
    type: simulation?.type || 'bouncing_balls',
    title: simulation?.title || 'Interactive Physics Demo',
    description: simulation?.description || 'Real-time physics simulation with customizable parameters',
    parameters: {
      gravity: gravity,
      friction: friction,
      restitution: restitution,
      particle_count: simulation?.parameters?.particle_count || 15,
      wave_frequency: simulation?.parameters?.wave_frequency || 0.02
    }
  };

  // Initialize simulation based on type
  const initializeSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    switch (config.type) {
      case 'bouncing_balls':
        const newBalls: Ball[] = [];
        for (let i = 0; i < (config.parameters?.particle_count || 15); i++) {
          newBalls.push({
            x: Math.random() * (width - 60) + 30,
            y: Math.random() * (height - 60) + 30,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 15 + 8,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            mass: Math.random() * 3 + 1,
            trail: []
          });
        }
        setBalls(newBalls);
        break;

      case 'pendulum':
        const newPendulums: Pendulum[] = [];
        for (let i = 0; i < 5; i++) {
          newPendulums.push({
            angle: (Math.random() - 0.5) * Math.PI / 2,
            angularVelocity: 0,
            length: 150 + i * 20,
            bob: { x: 0, y: 0 }
          });
        }
        setPendulums(newPendulums);
        break;

      case 'wave':
        setWavePhase(0);
        break;

      case 'particle_system':
        const particles: Ball[] = [];
        for (let i = 0; i < (config.parameters?.particle_count || 50); i++) {
          particles.push({
            x: width / 2,
            y: height / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            radius: Math.random() * 5 + 2,
            color: `hsl(${200 + Math.random() * 60}, 80%, ${50 + Math.random() * 30}%)`,
            mass: 0.5,
            trail: []
          });
        }
        setBalls(particles);
        break;

      case 'gravity':
        const gravityBalls: Ball[] = [];
        for (let i = 0; i < 8; i++) {
          gravityBalls.push({
            x: Math.random() * width,
            y: Math.random() * height / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: 0,
            radius: Math.random() * 12 + 6,
            color: `hsl(${Math.random() * 360}, 65%, 55%)`,
            mass: Math.random() * 2 + 1,
            trail: []
          });
        }
        setBalls(gravityBalls);
        break;
    }
  }, [config.type, config.parameters?.particle_count]);

  // Animation loop
  const animate = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !isRunning) return;

    const deltaTime = currentTime - lastTime;
    const fps = deltaTime > 0 ? 1000 / deltaTime : 0;
    
    setLastTime(currentTime);
    setStats(prev => ({ ...prev, fps: Math.round(fps) }));

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(240, 240, 240, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    switch (config.type) {
      case 'bouncing_balls':
      case 'particle_system':
      case 'gravity':
        updateBalls(ctx, canvas);
        break;
      case 'pendulum':
        updatePendulums(ctx, canvas);
        break;
      case 'wave':
        updateWave(ctx, canvas);
        break;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [isRunning, lastTime, config.type, balls, pendulums, wavePhase, gravity, friction, restitution]);

  // Update bouncing balls physics
  const updateBalls = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    setBalls(prevBalls => {
      const newBalls = prevBalls.map(ball => {
        const newBall = { ...ball };

        // Apply gravity
        if (config.type === 'gravity' || config.type === 'bouncing_balls') {
          newBall.vy += gravity;
        }

        // Update position
        newBall.x += newBall.vx;
        newBall.y += newBall.vy;

        // Apply friction
        newBall.vx *= friction;
        newBall.vy *= friction;

        // Boundary collisions
        if (newBall.x - newBall.radius <= 0) {
          newBall.x = newBall.radius;
          newBall.vx *= -restitution;
          playCollisionSound();
        }
        if (newBall.x + newBall.radius >= canvas.width) {
          newBall.x = canvas.width - newBall.radius;
          newBall.vx *= -restitution;
          playCollisionSound();
        }
        if (newBall.y - newBall.radius <= 0) {
          newBall.y = newBall.radius;
          newBall.vy *= -restitution;
          playCollisionSound();
        }
        if (newBall.y + newBall.radius >= canvas.height) {
          newBall.y = canvas.height - newBall.radius;
          newBall.vy *= -restitution;
          playCollisionSound();
        }

        // Update trail
        newBall.trail.push({ x: newBall.x, y: newBall.y });
        if (newBall.trail.length > 20) {
          newBall.trail.shift();
        }

        return newBall;
      });

      // Ball-to-ball collisions
      for (let i = 0; i < newBalls.length; i++) {
        for (let j = i + 1; j < newBalls.length; j++) {
          const ball1 = newBalls[i];
          const ball2 = newBalls[j];
          const dx = ball2.x - ball1.x;
          const dy = ball2.y - ball1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < ball1.radius + ball2.radius) {
            // Collision response
            const normalX = dx / distance;
            const normalY = dy / distance;
            
            const relativeVelocityX = ball2.vx - ball1.vx;
            const relativeVelocityY = ball2.vy - ball1.vy;
            const speed = relativeVelocityX * normalX + relativeVelocityY * normalY;

            if (speed > 0) continue;

            const impulse = 2 * speed / (ball1.mass + ball2.mass);
            ball1.vx += impulse * ball2.mass * normalX;
            ball1.vy += impulse * ball2.mass * normalY;
            ball2.vx -= impulse * ball1.mass * normalX;
            ball2.vy -= impulse * ball1.mass * normalY;

            playCollisionSound();
          }
        }
      }

      return newBalls;
    });

    // Draw balls
    balls.forEach(ball => {
      // Draw trail
      ctx.strokeStyle = ball.color + '40';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ball.trail.length > 1) {
        ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
        for (let i = 1; i < ball.trail.length; i++) {
          ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
        }
      }
      ctx.stroke();

      // Draw ball
      ctx.fillStyle = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Update pendulum physics
  const updatePendulums = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    setPendulums(prevPendulums => {
      return prevPendulums.map((pendulum, index) => {
        const newPendulum = { ...pendulum };
        
        // Physics calculation
        const angularAcceleration = (-gravity / newPendulum.length) * Math.sin(newPendulum.angle);
        newPendulum.angularVelocity += angularAcceleration;
        newPendulum.angularVelocity *= 0.999; // Damping
        newPendulum.angle += newPendulum.angularVelocity;

        // Calculate bob position
        const pivotX = canvas.width / 2 + (index - 2) * 80;
        const pivotY = 50;
        newPendulum.bob.x = pivotX + newPendulum.length * Math.sin(newPendulum.angle);
        newPendulum.bob.y = pivotY + newPendulum.length * Math.cos(newPendulum.angle);

        return newPendulum;
      });
    });

    // Draw pendulums
    pendulums.forEach((pendulum, index) => {
      const pivotX = canvas.width / 2 + (index - 2) * 80;
      const pivotY = 50;
      
      // Draw string
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(pendulum.bob.x, pendulum.bob.y);
      ctx.stroke();

      // Draw pivot
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw bob
      ctx.fillStyle = `hsl(${index * 60}, 70%, 60%)`;
      ctx.beginPath();
      ctx.arc(pendulum.bob.x, pendulum.bob.y, 15, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Update wave simulation
  const updateWave = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    setWavePhase(prev => prev + (config.parameters?.wave_frequency || 0.02));

    ctx.strokeStyle = '#4F94CD';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const amplitude = 80;
    const frequency = 0.02;
    const y0 = canvas.height / 2;

    for (let x = 0; x < canvas.width; x += 2) {
      const y = y0 + amplitude * Math.sin(frequency * x + wavePhase);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw wave interference
    ctx.strokeStyle = '#CD5C5C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 2) {
      const y = y0 + amplitude * 0.7 * Math.sin(frequency * x * 1.3 - wavePhase);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  };

  // Play collision sound
  const playCollisionSound = () => {
    if (soundEnabled && typeof window !== 'undefined' && 'AudioContext' in window) {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  };

  // Control functions
  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    initializeSimulation();
  };

  const addRandomBall = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newBall: Ball = {
      x: Math.random() * (canvas.width - 60) + 30,
      y: Math.random() * 100 + 50,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * 3,
      radius: Math.random() * 12 + 8,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      mass: Math.random() * 2 + 1,
      trail: []
    };

    setBalls(prev => [...prev, newBall]);
  };

  // Initialize and cleanup
  useEffect(() => {
    initializeSimulation();
  }, [initializeSimulation]);

  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, animate]);

  // Update stats
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      activeParticles: balls.length + pendulums.length,
      totalEnergy: balls.reduce((sum, ball) => sum + 0.5 * ball.mass * (ball.vx * ball.vx + ball.vy * ball.vy), 0)
    }));
  }, [balls, pendulums]);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              {config.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {config.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={soundEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowControls(!showControls)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Simulation Canvas */}
        <div className="relative border rounded-lg overflow-hidden bg-gray-50">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full h-auto cursor-pointer"
            onClick={config.type === 'bouncing_balls' ? addRandomBall : undefined}
          />
          
          {/* Stats Overlay */}
          <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-2 rounded text-xs font-mono">
            <div>FPS: {stats.fps}</div>
            <div>Objects: {stats.activeParticles}</div>
            <div>Energy: {stats.totalEnergy.toFixed(1)}</div>
            <div>Type: {config.type.replace('_', ' ')}</div>
          </div>

          {config.type === 'bouncing_balls' && (
            <div className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
              Click to add balls!
            </div>
          )}
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
          
          <Button variant="outline" onClick={resetSimulation} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>

          {config.type === 'bouncing_balls' && (
            <Button variant="outline" onClick={addRandomBall} className="flex items-center gap-2">
              Add Ball
            </Button>
          )}
        </div>

        {/* Advanced Controls */}
        {showControls && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Gravity: {gravity.toFixed(2)}</label>
              <Slider
                value={[gravity]}
                onValueChange={(value) => setGravity(value[0])}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Friction: {friction.toFixed(3)}</label>
              <Slider
                value={[friction]}
                onValueChange={(value) => setFriction(value[0])}
                max={1}
                min={0.9}
                step={0.001}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Bounce: {restitution.toFixed(2)}</label>
              <Slider
                value={[restitution]}
                onValueChange={(value) => setRestitution(value[0])}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Simulation Info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p><strong>Physics Properties:</strong> Real-time collision detection, momentum conservation, energy dissipation</p>
          <p><strong>Interactive:</strong> Adjustable parameters, sound effects, visual trails</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhysicsSimulator;
