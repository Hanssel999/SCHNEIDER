import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";

export function SignInPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <AuthLayout
      title="Welcome back."
      description="Sign in to keep every driver, vehicle, and hour of service moving together."
      alternateLabel="New to Schneider ELD?"
      alternateText="Create an account"
      alternatePath="/signup"
    >
      <div className="form-heading">
        <span className="form-step">01 / ACCESS</span>
        <h2>Sign in</h2>
        <p>Use your fleet credentials to continue.</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Work email
          <input type="email" name="email" placeholder="you@company.com" required />
        </label>
        <label>
          Password
          <span className="password-field">
            <input type="password" name="password" placeholder="Enter your password" required />
            <button type="button" aria-label="Show password">Show</button>
          </span>
        </label>
        <div className="form-options">
          <label className="checkbox-label"><input type="checkbox" name="remember" /> Remember me</label>
          <Link to="/signin">Forgot password?</Link>
        </div>
        <button className="primary-button" type="submit">Sign in <span>→</span></button>
        {submitted && <p className="form-feedback" role="status">Credentials received. Connecting to your fleet...</p>}
      </form>
    </AuthLayout>
  );
}
