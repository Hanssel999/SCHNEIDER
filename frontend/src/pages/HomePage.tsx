import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FleetLegend } from "../components/FleetLegend";
import { ParticleField } from "../components/ParticleField";
import { authService } from "../services/auth";

type HealthResponse = {
  status: string;
  service: string;
};

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export function HomePage() {
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

  return (
    <main className="shell">
      <ParticleField />
      <div className="orbit orbit-one" aria-hidden="true" />
      <div className="orbit orbit-two" aria-hidden="true" />
      <div className="orbit orbit-three" aria-hidden="true" />
      <FleetLegend />
      <header className="topbar">
        <span className="topbar-mark">SCHNEIDER</span>
        <span className="topbar-caption">ELD · Fleet operations</span>
        <Link className="topbar-action" to={authService.isDriver() ? "/driver" : "/signin"}>
          {authService.isDriver() ? "Driver page" : "Sign in"} <span>→</span>
        </Link>
      </header>
      <section className="hero" aria-labelledby="brand-title">
        <p className="eyebrow">Electronic logging, made visible</p>
        <h1 id="brand-title">SCHNEIDER<sup>®</sup></h1>
        <span className="brand-rule" aria-hidden="true" />
        <p className="intro">Every mile. Every driver. One connected fleet.</p>
      </section>
      <footer>
        <div className="status" aria-live="polite">
          <span className={`status-dot ${health ? "online" : ""}`} />
          {health ? `${health.service} is online` : error ?? "Connecting to API..."}
        </div>
        <span className="footer-note">11 units tracked · 03 routes active</span>
      </footer>
    </main>
  );
}
