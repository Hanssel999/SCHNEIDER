import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export function AuthLayout({
  children,
  title,
  description,
  alternateLabel,
  alternateText,
  alternatePath,
}: {
  children: ReactNode;
  title: string;
  description: string;
  alternateLabel: string;
  alternateText: string;
  alternatePath: string;
}) {
  return (
    <main className="auth-shell">
      <div className="auth-glow auth-glow-one" aria-hidden="true" />
      <div className="auth-glow auth-glow-two" aria-hidden="true" />
      <header className="auth-header">
        <Link className="auth-brand" to="/">SCHNEIDER<span>®</span></Link>
        <span className="auth-product">ELD · Fleet operations</span>
      </header>
      <section className="auth-content">
        <div className="auth-copy">
          <p className="auth-kicker">One connected fleet</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="auth-route-line" aria-hidden="true"><i /><i /><i /></div>
        </div>
        <div className="auth-card">
          {children}
          <p className="auth-switch">{alternateLabel} <Link to={alternatePath}>{alternateText}</Link></p>
        </div>
      </section>
      <footer className="auth-footer">Secure access for drivers and fleet teams <span>·</span> ELD platform</footer>
    </main>
  );
}
