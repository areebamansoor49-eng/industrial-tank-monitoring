"use client";

import {
  FormEvent,
  Suspense,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/layout/ThemeToggle";

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a18.7 18.7 0 0 1-3.2 3.9" />
      <path d="M6.2 6.2C3.5 8.1 2 12 2 12s3.5 6 10 6a9.8 9.8 0 0 0 3.1-.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const redirectPath = (() => {
    const redirect = searchParams.get("redirect");

    if (
      redirect &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//")
    ) {
      return redirect;
    }

    return "/dashboard";
  })();

  const callbackError = searchParams.get("error");

  const displayedCallbackError =
    callbackError === "auth_callback_failed"
      ? "Email confirmation could not be completed. Please try again."
      : callbackError === "email_not_verified"
        ? "Please confirm your email address before accessing the dashboard."
        : "";

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      setLoading(false);
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setError("Please enter your full name.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();

        setError(
          "Please confirm your email address before signing in. Check your inbox for the confirmation email.",
        );

        setLoading(false);
        return;
      }

      router.replace(redirectPath);
      router.refresh();
      return;
    }

    const { data, error: signupError } =
      await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo:
            `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              redirectPath,
            )}`,
        },
      });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (data.user?.email_confirmed_at) {
      router.replace(redirectPath);
      router.refresh();
      return;
    }

    setMessage(
      "Account created successfully. We sent a confirmation link to your email. Please confirm your email before signing in.",
    );

    setLoading(false);
  };

  const switchMode = () => {
    setMode((current) =>
      current === "login" ? "signup" : "login",
    );
    setError("");
    setMessage("");
  };

  return (
    <main className="auth-page">
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>
      <section
        className="auth-card"
        aria-labelledby="auth-title"
      >
        <div className="auth-brand">
          <div
            className="auth-brand-mark"
            aria-hidden="true"
          >
            IT
          </div>

          <div>
            <span className="auth-brand-name">
              INDUSTRIAL
            </span>
            <span className="auth-brand-subtitle">
              TANK MONITORING
            </span>
          </div>
        </div>

        <div className="auth-heading">
          <span className="auth-eyebrow">
            {mode === "login"
              ? "SECURE ACCESS"
              : "CREATE ACCOUNT"}
          </span>

          <h1 id="auth-title">
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h1>

          <p>
            {mode === "login"
              ? "Sign in to access your industrial monitoring workspace."
              : "Create your secure account to access the monitoring platform."}
          </p>
        </div>

        {(displayedCallbackError || error) && (
          <div
            className="auth-alert auth-alert-error"
            role="alert"
          >
            <span className="auth-alert-icon">!</span>
            <span>
              {error || displayedCallbackError}
            </span>
          </div>
        )}

        {message && (
          <div
            className="auth-alert auth-alert-success"
            role="status"
          >
            <span className="auth-alert-icon">✓</span>
            <span>{message}</span>
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {mode === "signup" && (
            <label className="auth-field">
              <span>Full name</span>

              <input
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={loading}
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email address</span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />
          </label>

          <label className="auth-field">
            <span>Password</span>

            <div className="auth-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                disabled={loading}
              />

              <button
                type="button"
                className="auth-password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                title={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                <EyeIcon hidden={!showPassword} />
              </button>
            </div>

            <small>Minimum 6 characters</small>
          </label>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="auth-spinner" />
                {mode === "login"
                  ? "Signing in..."
                  : "Creating account..."}
              </>
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>

          <button
            type="button"
            onClick={switchMode}
            disabled={loading}
          >
            {mode === "login"
              ? "Create account"
              : "Sign in"}
          </button>
        </div>

        <p className="auth-security-note">
          Your account is protected by secure authentication.
          Passwords are never displayed in the application.
        </p>
      </section>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="auth-page">
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">IT</div>

          <div>
            <span className="auth-brand-name">
              INDUSTRIAL
            </span>
            <span className="auth-brand-subtitle">
              TANK MONITORING
            </span>
          </div>
        </div>

        <div className="auth-heading">
          <span className="auth-eyebrow">
            SECURE ACCESS
          </span>
          <h1>Welcome back</h1>
          <p>Loading secure authentication...</p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
