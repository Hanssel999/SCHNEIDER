import { useEffect, useRef, useState } from "react";

type HealthResponse = {
  status: string;
  service: string;
};

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiUrl}/health/`)
      .then((response) => {
        if (!response.ok) throw new Error("API request failed");
        return response.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch(() => setError("Backend unavailable. Start Django to connect."));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let particles: Array<{
      angle: number;
      radius: number;
      speed: number;
      size: number;
      opacity: number;
      drift: number;
    }> = [];

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.min(260, Math.max(120, Math.floor(window.innerWidth / 5)));
      particles = Array.from({ length: count }, (_, index) => ({
        angle: (index / count) * Math.PI * 2 + Math.random() * 0.2,
        radius: Math.min(window.innerWidth, window.innerHeight) * (0.28 + Math.random() * 0.48),
        speed: 0.0007 + Math.random() * 0.0014,
        size: 0.7 + Math.random() * 2,
        opacity: 0.16 + Math.random() * 0.62,
        drift: (Math.random() - 0.5) * 0.4,
      }));
    };

    const draw = (time: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      context.clearRect(0, 0, width, height);
      const centerX = width * 0.5;
      const centerY = height * 0.53;

      particles.forEach((particle) => {
        const angle = particle.angle + time * particle.speed;
        const radius = particle.radius + Math.sin(time * 0.0008 + particle.angle) * 16 + particle.drift * time * 0.01;
        const x = centerX + Math.cos(angle) * radius * 1.12;
        const y = centerY + Math.sin(angle) * radius * 0.57;
        context.beginPath();
        context.fillStyle = `rgba(255, 248, 224, ${particle.opacity})`;
        context.arc(x, y, particle.size, 0, Math.PI * 2);
        context.fill();
      });

      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <main className="shell">
      <canvas ref={canvasRef} className="particle-field" aria-hidden="true" />
      <div className="orbit orbit-one" aria-hidden="true" />
      <div className="orbit orbit-two" aria-hidden="true" />
      <div className="orbit orbit-three" aria-hidden="true" />
      <header className="topbar">
        <span className="topbar-mark">SCHNEIDER</span>
        <span className="topbar-caption">Moving energy forward</span>
      </header>
      <section className="hero" aria-labelledby="brand-title">
        <p className="eyebrow">Powering progress</p>
        <h1 id="brand-title">SCHNEIDER<sup>®</sup></h1>
        <span className="brand-rule" aria-hidden="true" />
        <p className="intro">Reliable movement for a world in motion.</p>
      </section>
      <footer>
        <div className="status" aria-live="polite">
          <span className={`status-dot ${health ? "online" : ""}`} />
          {health ? `${health.service} is online` : error ?? "Connecting to API..."}
        </div>
        <span className="footer-note">EST. 1935 · GREENVILLE, SC</span>
      </footer>
    </main>
  );
}

export default App;