import { FormEvent, useState } from "react";
import { AuthLayout } from "../components/AuthLayout";
import { authService } from "../services/auth";

import type { AccountRole } from "../services/auth";

export function SignUpPage() {
  const [role, setRole] = useState<AccountRole>("driver");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const form = new FormData(event.currentTarget);
    try {
      const data = await authService.signUp({
        email: String(form.get("email")),
        first_name: String(form.get("firstName")),
        last_name: String(form.get("lastName")),
        password: String(form.get("password")),
        password_confirm: String(form.get("confirmPassword")),
        role,
      });
      setFeedback(data.message);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to create your account.");
    }
  };

  return (
    <AuthLayout
      title="Bring your fleet into focus."
      description="Create your ELD account and turn every route into a clearer, safer operation."
      alternateLabel="Already have an account?"
      alternateText="Sign in"
      alternatePath="/signin"
    >
      <div className="form-heading">
        <span className="form-step">01 / NEW ACCOUNT</span>
        <h2>Create account</h2>
        <p>Set up your secure fleet workspace.</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            First name
            <input type="text" name="firstName" placeholder="Alex" required />
          </label>
          <label>
            Last name
            <input type="text" name="lastName" placeholder="Morgan" required />
          </label>
        </div>
        <label>
          Work email
          <input type="email" name="email" placeholder="you@company.com" required />
        </label>
        <fieldset>
          <legend>I am joining as</legend>
          <div className="role-options">
            <label className={role === "driver" ? "role-option selected" : "role-option"}>
              <input type="radio" name="role" value="driver" checked={role === "driver"} onChange={() => setRole("driver")} />
              <span><strong>Driver</strong><small>Log hours on the road</small></span>
            </label>
            <label className={role === "manager" ? "role-option selected" : "role-option"}>
              <input type="radio" name="role" value="manager" checked={role === "manager"} onChange={() => setRole("manager")} />
              <span><strong>Fleet manager</strong><small>Coordinate your fleet</small></span>
            </label>
          </div>
        </fieldset>
        <div className="form-grid">
          <label>
            Password
            <input type="password" name="password" placeholder="8+ characters" minLength={8} required />
          </label>
          <label>
            Confirm password
            <input type="password" name="confirmPassword" placeholder="Repeat password" minLength={8} required />
          </label>
        </div>
        <label className="checkbox-label terms-label"><input type="checkbox" required /> I agree to the Terms and Privacy Policy.</label>
        <button className="primary-button" type="submit">Create my account <span>→</span></button>
        {feedback && <p className="form-feedback" role="status">{feedback}</p>}
      </form>
    </AuthLayout>
  );
}
