"use client";

import { useEffect, useRef } from "react";

export function BackgroundAnimation() {
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null);
  const globeCanvasRef = useRef<HTMLCanvasElement>(null);
  const hexGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const particlesCanvas = particlesCanvasRef.current;
    const globeCanvas = globeCanvasRef.current;
    const hexGrid = hexGridRef.current;
    
    if (!particlesCanvas || !globeCanvas || !hexGrid) return;

    const pCtx = particlesCanvas.getContext("2d");
    const gCtx = globeCanvas.getContext("2d");
    
    if (!pCtx || !gCtx) return;

    let mouseX = 0, mouseY = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      particlesCanvas.width = width;
      particlesCanvas.height = height;
      globeCanvas.width = width;
      globeCanvas.height = height;
      createHexGrid();
    };

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / width - 0.5) * 2;
      mouseY = (e.clientY / height - 0.5) * 2;
    };

    // Particle class
    class Particle {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      speedX: number = 0;
      speedY: number = 0;
      opacity: number = 0;
      hue: number = 0;
      life: number = 0;
      age: number = 0;

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.hue = Math.random() > 0.7 ? 170 : 160;
        this.life = Math.random() * 200 + 100;
        this.age = 0;
      }

      constructor() {
        this.reset();
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.age++;
        if (this.age > this.life || this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.reset();
        }
        this.x += mouseX * 0.02;
        this.y += mouseY * 0.02;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const fadeRatio = 1 - (this.age / this.life);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, ${this.opacity * fadeRatio})`;
        ctx.fill();
      }
    }

    const particleCount = 150;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const drawConnections = (ctx: CanvasRenderingContext2D) => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          if (!p1 || !p2) continue;
          
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const opacity = (1 - dist / 100) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 229, 160, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    // Globe wireframe
    const globeRadius = Math.min(width, height) * 0.3;
    let globeRotation = 0;

    const drawGlobe = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, width, height);
      globeRotation += 0.003;

      const radius = globeRadius;
      const cx = width * 0.5;
      const cy = height * 0.45;

      // Equatorial line
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius, radius * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 229, 160, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        const latRad = (lat * Math.PI) / 180;
        const yOff = Math.sin(latRad) * radius * 0.35;
        const xScale = Math.cos(latRad);
        ctx.beginPath();
        ctx.ellipse(cx, cy + yOff, radius * xScale, radius * 0.12 * xScale, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 229, 160, 0.08)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Longitude lines (rotating)
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI / 6) + globeRotation;
        const x1 = cx + Math.cos(angle) * radius;
        const x2 = cx + Math.cos(angle + Math.PI) * radius;
        ctx.beginPath();
        ctx.moveTo(x1, cy - radius * 0.35);
        ctx.bezierCurveTo(x1, cy, x2, cy, x2, cy + radius * 0.35);
        ctx.strokeStyle = 'rgba(0, 229, 160, 0.06)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // GPS ping dots
      const pingPoints = [
        { lat: 33.9, lon: 35.5 },
        { lat: 25.2, lon: 55.3 },
        { lat: 51.5, lon: -0.1 },
        { lat: 40.7, lon: -74 },
        { lat: 1.3, lon: 103.8 },
      ];

      pingPoints.forEach((p, idx) => {
        const latRad = (p.lat * Math.PI) / 180;
        const lonRad = (p.lon * Math.PI) / 180 + globeRotation;
        const px = cx + Math.cos(latRad) * Math.cos(lonRad) * radius;
        const py = cy + Math.sin(latRad) * radius * 0.35;
        const pulsePhase = (Date.now() / 1000 + idx) % 2;
        const pulseSize = 3 + Math.sin(pulsePhase * Math.PI) * 2;

        ctx.beginPath();
        ctx.arc(px, py, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 160, ${0.6 + Math.sin(pulsePhase * Math.PI) * 0.3})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, pulseSize + 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 229, 160, ${0.2 * (1 - pulsePhase / 2)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    // Hex grid
    const createHexGrid = () => {
      const hexSize = 30;
      const cols = Math.ceil(width / (hexSize * 1.5));
      const rows = Math.ceil(height / (hexSize * 1.7));

      let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="position:absolute;top:0;left:0;">`;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * hexSize * 1.5 + (row % 2 ? hexSize * 0.75 : 0);
          const y = row * hexSize * 1.7;
          const points: string[] = [];
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            points.push(`${x + Math.cos(angle) * hexSize},${y + Math.sin(angle) * hexSize}`);
          }
          svg += `<polygon points="${points.join(' ')}" fill="none" stroke="rgba(0,229,160,0.03)" stroke-width="0.5"/>`;
        }
      }

      svg += '</svg>';
      hexGrid.innerHTML = svg;
    };

    // Animation loop
    let isHeroVisible = true;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]) {
        isHeroVisible = entries[0].isIntersecting;
      }
    }, { threshold: 0.1 });

    observer.observe(particlesCanvas.parentElement!);

    const animate = () => {
      if (isHeroVisible) {
        pCtx.clearRect(0, 0, width, height);
        particles.forEach(p => {
          p.update();
          p.draw(pCtx);
        });
        drawConnections(pCtx);
        drawGlobe(gCtx);
      }
      requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Canvas layers */}
      <canvas
        ref={particlesCanvasRef}
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 1 }}
      />
      <canvas
        ref={globeCanvasRef}
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 2, opacity: 0.4 }}
      />

      {/* Gradient overlays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 3,
          background: 'linear-gradient(135deg, rgba(10,14,23,0.95) 0%, rgba(10,14,23,0.7) 40%, rgba(10,14,23,0.4) 70%, rgba(10,14,23,0.8) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 4,
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,229,160,0.25), transparent 70%), radial-gradient(ellipse 30% 40% at 20% 60%, rgba(0,212,255,0.08), transparent 60%), radial-gradient(ellipse 25% 35% at 80% 30%, rgba(10,207,131,0.1), transparent 60%)',
          animation: 'glowPulse 8s ease-in-out infinite',
        }}
      />

      {/* Map wireframe overlay */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 5, opacity: 0, animation: 'fadeInMap 2s 0.5s forwards' }}
      >
        <svg
          viewBox="0 0 800 400"
          className="w-[70%] max-w-[800px] opacity-60"
          style={{
            transform: 'perspective(800px) rotateX(15deg) rotateY(-5deg)',
            animation: 'mapFloat 12s ease-in-out infinite',
          }}
        >
          {/* Simplified world map continents */}
          <g fill="none" stroke="#00E5A0" strokeWidth="0.5" opacity="0.3">
            <path d="M380,120 L400,115 L420,130 L440,160 L450,200 L440,240 L420,270 L400,280 L380,270 L370,240 L375,200 L380,160 L380,120Z"/>
            <path d="M370,70 L390,65 L410,70 L420,80 L415,95 L400,100 L385,95 L370,80 L370,70Z"/>
            <path d="M420,80 L450,75 L480,80 L520,90 L550,100 L570,120 L560,140 L540,160 L520,170 L500,160 L480,140 L460,130 L440,120 L420,100 L420,80Z"/>
            <path d="M180,60 L200,55 L220,60 L230,80 L240,120 L250,160 L260,200 L250,240 L240,260 L220,280 L200,290 L180,280 L170,260 L165,230 L170,200 L175,160 L180,120 L180,60Z"/>
            <path d="M220,200 L240,195 L260,210 L270,240 L260,270 L240,290 L220,300 L210,280 L215,260 L220,230 L220,200Z"/>
            <path d="M480,120 L500,115 L510,130 L505,160 L490,170 L480,160 L480,120Z"/>
            <path d="M560,220 L600,215 L630,230 L640,260 L620,280 L590,280 L560,260 L550,240 L560,220Z"/>
          </g>
          {/* Animated tracking routes */}
          <g>
            <path d="M200,100 C280,90 350,120 420,100" fill="none" stroke="#0ACF83" strokeWidth="1.5" strokeDasharray="8 4" style={{ animation: 'routeFlow 2s linear infinite' }}/>
            <path d="M380,80 C420,85 480,100 550,130" fill="none" stroke="#00E5A0" strokeWidth="1.5" strokeDasharray="8 4" style={{ animation: 'routeFlow 2s linear infinite' }}/>
            <path d="M180,180 C220,200 280,220 350,200" fill="none" stroke="#00D4FF" strokeWidth="1" strokeDasharray="6 3" style={{ animation: 'routeFlow 2s linear infinite' }}/>
            {/* Vehicle dots */}
            <circle cx="200" cy="100" r="4" fill="#00E5A0" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}/>
            <circle cx="380" cy="80" r="4" fill="#0ACF83" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}/>
            <circle cx="180" cy="180" r="3" fill="#00D4FF" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}/>
          </g>
        </svg>
      </div>

      {/* Decorative orbit rings */}
      <div
        className="pointer-events-none absolute rounded-full border"
        style={{
          zIndex: 4,
          width: '600px',
          height: '600px',
          top: 'calc(50% - 300px)',
          left: 'calc(50% - 300px)',
          borderColor: 'rgba(0,229,160,0.08)',
          animation: 'orbitSpin 20s linear infinite',
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full border"
        style={{
          zIndex: 4,
          width: '450px',
          height: '450px',
          top: 'calc(50% - 225px)',
          left: 'calc(50% - 225px)',
          borderColor: 'rgba(0,212,255,0.06)',
          animation: 'orbitSpin 15s linear infinite reverse',
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full border"
        style={{
          zIndex: 4,
          width: '300px',
          height: '300px',
          top: 'calc(50% - 150px)',
          left: 'calc(50% - 150px)',
          borderColor: 'rgba(0,229,160,0.1)',
          animation: 'orbitSpin 10s linear infinite',
        }}
      />

      {/* Floating pulse orbs */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          zIndex: 5,
          width: '120px',
          height: '120px',
          top: '20%',
          left: '15%',
          background: 'radial-gradient(circle, rgba(0,229,160,0.2), transparent 70%)',
          animation: 'fpFloat 8s ease-in-out infinite, fpPulse 3s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          zIndex: 5,
          width: '80px',
          height: '80px',
          bottom: '30%',
          left: '40%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.15), transparent 70%)',
          animation: 'fpFloat 6s 2s ease-in-out infinite, fpPulse 4s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          zIndex: 5,
          width: '100px',
          height: '100px',
          top: '40%',
          right: '25%',
          background: 'radial-gradient(circle, rgba(10,207,131,0.12), transparent 70%)',
          animation: 'fpFloat 10s 1s ease-in-out infinite, fpPulse 3.5s ease-in-out infinite',
        }}
      />

      {/* Hex grid background */}
      <div
        ref={hexGridRef}
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 3, opacity: 0.04 }}
      />

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{
          zIndex: 10,
          height: '120px',
          background: 'linear-gradient(to top, #0a0e17, transparent)',
        }}
      />

      <style jsx global>{`
        @keyframes glowPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes fadeInMap {
          to { opacity: 1; }
        }

        @keyframes mapFloat {
          0%, 100% { transform: perspective(800px) rotateX(15deg) rotateY(-5deg) translateZ(0); }
          50% { transform: perspective(800px) rotateX(10deg) rotateY(5deg) translateZ(20px); }
        }

        @keyframes orbitSpin {
          from { transform: rotate(0deg) rotateX(60deg); }
          to { transform: rotate(360deg) rotateX(60deg); }
        }

        @keyframes fpFloat {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-15px); }
        }

        @keyframes fpPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }

        @keyframes routeFlow {
          to { stroke-dashoffset: -24; }
        }

        @media (max-width: 1024px) {
          .map-wireframe svg {
            width: 90%;
            opacity: 0.3;
          }
        }

        @media (max-width: 768px) {
          .orbit-ring {
            display: none;
          }
          .map-wireframe {
            opacity: 0.3;
          }
        }
      `}</style>
    </>
  );
}
