import { useEffect, useRef } from 'react';

/**
 * Shared canvas engine for all page atmospheres.
 *
 * mode:
 *  - "grid"     : 3D-perspective grid + floating nodes + connecting lines (Role Selection)
 *  - "orbital"  : slow rotating rings + soft glow (Auth pages)
 *  - "beams"    : vertical light beams + deep grid (Leaderboard)
 *  - "constellation" : drifting nodes with thin connecting lines (Student Profile)
 *  - "particles": light ambient floating dots (Dashboards / Forms)
 *  - "static"   : near-static single soft glow (Settings)
 *
 * intensity: "strong" | "medium" | "light" | "minimal" | "static"
 * colors: array of hex strings used for nodes/particles/beams
 */
export default function AuroraCanvas({ mode = 'particles', intensity = 'light', colors = ['#7C3AED', '#22D3EE'] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const densityMap = { strong: 1, medium: 0.65, light: 0.4, minimal: 0.2, static: 0 };
    const baseCount = window.innerWidth < 640 ? 26 : 60;
    const count = Math.round(baseCount * (densityMap[intensity] ?? 0.4));

    let width, height, dpr;
    let nodes = [];
    let raf;
    let running = true;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeNodes() {
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.6 + 0.6,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
    }

    function drawGrid(t) {
      const rows = 10;
      ctx.strokeStyle = 'rgba(124,58,237,0.06)';
      ctx.lineWidth = 1;
      const horizon = height * 0.4;
      for (let i = 0; i <= rows; i++) {
        const p = i / rows;
        const y = horizon + (height - horizon) * p * p;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      const cols = 14;
      for (let i = 0; i <= cols; i++) {
        const cx = (i / cols) * width;
        ctx.beginPath();
        ctx.moveTo(width / 2 + (cx - width / 2) * 0.2, horizon);
        ctx.lineTo(cx, height);
        ctx.stroke();
      }
    }

    function drawBeams() {
      const beamCount = 3;
      const positions = [0.22, 0.5, 0.78];
      const beamColors = colors;
      for (let i = 0; i < beamCount; i++) {
        const x = width * positions[i];
        const grad = ctx.createLinearGradient(x, 0, x, height);
        grad.addColorStop(0, `${beamColors[i % beamColors.length]}22`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(x - 60, 0, 120, height);
      }
    }

    function drawOrbitals(t) {
      const cx = width / 2;
      const cy = height * 0.42;
      const rings = [0.55, 0.75, 0.95];
      rings.forEach((rf, i) => {
        const r = Math.min(width, height) * rf * 0.4;
        ctx.beginPath();
        ctx.strokeStyle = `${colors[i % colors.length]}22`;
        ctx.lineWidth = 1;
        ctx.ellipse(cx, cy, r, r * 0.4, t * 0.0002 * (i + 1), 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    function step(t) {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      if (mode === 'grid') drawGrid(t);
      if (mode === 'beams') drawBeams();
      if (mode === 'orbital') drawOrbitals(t);

      if (intensity !== 'static' && mode !== 'orbital') {
        nodes.forEach((n) => {
          if (!reducedMotion) {
            n.x += n.vx;
            n.y += n.vy;
            if (n.x < 0 || n.x > width) n.vx *= -1;
            if (n.y < 0 || n.y > height) n.vy *= -1;
          }
          ctx.beginPath();
          ctx.fillStyle = n.color;
          ctx.globalAlpha = 0.55;
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });

        if (mode === 'grid' || mode === 'constellation') {
          const maxDist = mode === 'constellation' ? 130 : 110;
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const a = nodes[i], b = nodes[j];
              const dx = a.x - b.x, dy = a.y - b.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < maxDist) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(167,139,250,${0.12 * (1 - dist / maxDist)})`;
                ctx.lineWidth = 1;
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
            }
          }
        }
      }

      if (!reducedMotion && intensity !== 'static') {
        raf = requestAnimationFrame(step);
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else {
        running = true;
        raf = requestAnimationFrame(step);
      }
    }

    resize();
    makeNodes();
    step(0);

    window.addEventListener('resize', () => {
      resize();
      makeNodes();
    });
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, intensity, colors.join(',')]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
