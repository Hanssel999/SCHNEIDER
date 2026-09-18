import { useEffect, useRef } from "react";

const routes = [
  { points: [[0.06, 0.7], [0.24, 0.52], [0.46, 0.6], [0.67, 0.39], [0.94, 0.5]], color: "#ffe49a" },
  { points: [[0.12, 0.22], [0.3, 0.36], [0.5, 0.2], [0.73, 0.28], [0.9, 0.16]], color: "#bde6ba" },
  { points: [[0.19, 0.91], [0.35, 0.72], [0.53, 0.78], [0.7, 0.64], [0.84, 0.82]], color: "#ffd0b5" },
];

type VehicleState = "drive" | "duty" | "rest";

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let animationFrame = 0;
    let particles = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.00008 + Math.random() * 0.00018,
      size: 1 + Math.random() * 2.8,
      phase: Math.random() * Math.PI * 2,
    }));
    const dataPackets = Array.from({ length: 9 }, (_, index) => ({
      route: index % routes.length,
      phase: (index * 0.23) % 1,
      speed: 0.00012 + (index % 3) * 0.000025,
    }));
    let vehicles = Array.from({ length: 11 }, (_, index) => ({
      route: index % routes.length,
      progress: (index * 0.17) % 1,
      speed: 0.00008 + (index % 3) * 0.000025,
      status: (index % 4 === 0 ? "rest" : index % 3 === 0 ? "duty" : "drive") as VehicleState,
    }));

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = particles.map((particle) => ({ ...particle, x: Math.random(), y: Math.random() }));
      vehicles = vehicles.map((vehicle, index) => ({ ...vehicle, progress: (index * 0.17) % 1 }));
    };

    const draw = (time: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      context.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.x = (particle.x + particle.speed) % 1;
        const x = particle.x * width;
        const y = (particle.y + Math.sin(time * 0.001 + particle.phase) * 0.018) * height;
        const opacity = 0.28 + (Math.sin(time * 0.003 + particle.phase) + 1) * 0.25;
        context.beginPath();
        context.strokeStyle = `rgba(255, 249, 220, ${opacity * 0.5})`;
        context.lineWidth = particle.size;
        context.moveTo(x - 18, y);
        context.lineTo(x, y);
        context.stroke();
        context.beginPath();
        context.fillStyle = `rgba(255, 249, 220, ${opacity})`;
        context.shadowColor = "#fff8d2";
        context.shadowBlur = 8;
        context.arc(x, y, particle.size, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      });

      routes.forEach((route) => {
        context.beginPath();
        route.points.forEach(([x, y], index) => {
          if (index === 0) context.moveTo(x * width, y * height);
          else context.lineTo(x * width, y * height);
        });
        context.strokeStyle = `${route.color}99`;
        context.lineWidth = 2;
        context.setLineDash([5, 8]);
        context.stroke();
        context.setLineDash([]);
        route.points.forEach(([x, y]) => {
          const pulse = (Math.sin(time * 0.003 + x * 10 + y * 8) + 1) * 0.5;
          context.beginPath();
          context.strokeStyle = route.color;
          context.globalAlpha = 0.18 + pulse * 0.3;
          context.lineWidth = 1.5;
          context.arc(x * width, y * height, 7 + pulse * 8, 0, Math.PI * 2);
          context.stroke();
          context.beginPath();
          context.fillStyle = route.color;
          context.globalAlpha = 0.7 + pulse * 0.3;
          context.arc(x * width, y * height, 3, 0, Math.PI * 2);
          context.fill();
          context.globalAlpha = 1;
        });
      });

      dataPackets.forEach((packet) => {
        const route = routes[packet.route];
        const progress = (packet.phase + time * packet.speed) % 1;
        const segment = Math.min(route.points.length - 2, Math.floor(progress * (route.points.length - 1)));
        const segmentProgress = progress * (route.points.length - 1) - segment;
        const start = route.points[segment];
        const end = route.points[segment + 1];
        const x = (start[0] + (end[0] - start[0]) * segmentProgress) * width;
        const y = (start[1] + (end[1] - start[1]) * segmentProgress) * height;
        context.beginPath();
        context.fillStyle = "#ffffff";
        context.shadowColor = route.color;
        context.shadowBlur = 14;
        context.arc(x, y, 3.5, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      });

      vehicles.forEach((vehicle) => {
        const route = routes[vehicle.route];
        const segment = Math.min(route.points.length - 2, Math.floor(vehicle.progress * (route.points.length - 1)));
        const localProgress = vehicle.progress * (route.points.length - 1) - segment;
        const start = route.points[segment];
        const end = route.points[segment + 1];
        const x = (start[0] + (end[0] - start[0]) * localProgress) * width;
        const y = (start[1] + (end[1] - start[1]) * localProgress) * height;
        vehicle.progress = (vehicle.progress + vehicle.speed) % 1;
        context.beginPath();
        context.fillStyle = vehicle.status === "drive" ? "#fff8d2" : vehicle.status === "duty" ? "#bde6ba" : "#ffb28b";
        context.shadowColor = context.fillStyle;
        context.shadowBlur = 9;
        context.roundRect(x - 6, y - 3.5, 12, 7, 2);
        context.fill();
        context.shadowBlur = 0;
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

  return <canvas ref={canvasRef} className="particle-field" aria-label="Live fleet routes and vehicle activity" />;
}
