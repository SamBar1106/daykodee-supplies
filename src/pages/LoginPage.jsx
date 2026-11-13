import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LoginState } from "@wix/sdk";
import { Shell } from "../components/Shell.jsx";
import { EyeIcon, GoogleIcon } from "../components/Icons.jsx";
import {
  beginGoogleSignIn,
  beginPasswordLogin,
  beginRegistration,
  loginMessage,
  sendPasswordReset,
  submitVerificationCode,
} from "../lib/authFlow.js";
import { getWixClient } from "../lib/wixClient.js";
import { useSession } from "../session.jsx";

export function LoginPage() {
  const session = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingAuth, setPendingAuth] = useState(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!session.demo && session.authReady && session.signedIn && session.catalogStatus === "ok") {
    return <Navigate to="/" replace />;
  }
  if (!session.demo && session.authReady && session.signedIn && session.catalogStatus === "forbidden") {
    return <Navigate to="/pending" replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setMessage("");
    const wix = getWixClient();
    if (!wix) {
      setMessage("The supplies sign-in client is not configured yet. Add the public client ID in VITE_WIX_CLIENT_ID (SUP-002).");
      return;
    }
    if (mode === "reset") {
      setSubmitting(true);
      try {
        await sendPasswordReset(wix, email.trim());
        setMessage("If that email has an account, Wix sent a password reset link.");
        setMode("sign-in");
      } catch {
        setMessage("The reset email could not be sent. Check the address and try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (mode === "request" && password !== confirm) {
      setMessage("Enter the same password in both fields.");
      return;
    }
    setSubmitting(true);
    try {
      const response = mode === "request"
        ? await beginRegistration(wix, email.trim(), password)
        : await beginPasswordLogin(wix, email.trim(), password);
      if (response.loginState === LoginState.OWNER_APPROVAL_REQUIRED) {
        navigate("/pending");
        return;
      }
      if (response.loginState === LoginState.EMAIL_VERIFICATION_REQUIRED) {
        setPendingAuth(response);
        setMode("verify");
        setMessage(loginMessage(response));
        return;
      }
      if (response.loginState !== LoginState.SUCCESS) {
        setMessage(loginMessage(response));
      }
    } catch {
      setMessage("Sign-in could not be completed. Confirm the OAuth client allows this site’s callback URL.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify(event) {
    event.preventDefault();
    const wix = getWixClient();
    if (!wix || !pendingAuth) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await submitVerificationCode(wix, pendingAuth, code.trim());
      if (response.loginState === LoginState.OWNER_APPROVAL_REQUIRED) {
        navigate("/pending");
        return;
      }
      if (response.loginState !== LoginState.SUCCESS) {
        setPendingAuth(response);
        setMessage(loginMessage(response));
      }
    } catch {
      setMessage("That verification code could not be confirmed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setMessage("");
    const wix = getWixClient();
    if (!wix) {
      setMessage("The supplies sign-in client is not configured yet. Add the public client ID in VITE_WIX_CLIENT_ID (SUP-002).");
      return;
    }
    setSubmitting(true);
    try {
      await beginGoogleSignIn(wix);
    } catch {
      setMessage("Google sign-in could not be started. The OAuth client must allow this site’s callback URL.");
      setSubmitting(false);
    }
  }

  const heading = mode === "request"
    ? "Request franchise access"
    : mode === "reset"
      ? "Reset your password"
      : mode === "verify"
        ? "Check your email"
        : "Sign in to Daykodee Supplies";

  return (
    <Shell screen="login">
      <section className="auth-card">
        <p className="host-pill"><span className="live-dot" aria-hidden="true" /> supplies.daykodee.com</p>
        <h1>{heading}</h1>
        <p className="lede">For Family Affair childcare franchise owners.</p>
        {mode === "verify" ? (
          <form onSubmit={onVerify}>
            <label htmlFor="code">Verification code</label>
            <input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} required />
            {message ? <p className="form-error" role="alert">{message}</p> : null}
            <button className="button button-gold button-block" type="submit" disabled={submitting}>Confirm code</button>
          </form>
        ) : (
          <form onSubmit={onSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="director@campus.familyaffair.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {mode !== "reset" ? (
              <>
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  {mode === "sign-in" ? (
                    <button type="button" className="text-button" onClick={() => { setMode("reset"); setMessage(""); }}>
                      Forgot password?
                    </button>
                  ) : null}
                </div>
                <div className="password-field">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "request" ? "new-password" : "current-password"}
                    placeholder="Enter your portal password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
              </>
            ) : null}
            {mode === "request" ? (
              <>
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                />
              </>
            ) : null}
            {message ? <p className="form-error" role="alert">{message}</p> : null}
            <button className="button button-gold button-block" type="submit" disabled={submitting}>
              <span className="btn-label-desktop">{mode === "request" ? "Request access" : mode === "reset" ? "Send reset email" : "Sign in"}</span>
              <span className="btn-label-mobile">{mode === "sign-in" ? "Sign in to Franchise Portal" : mode === "request" ? "Request access" : "Send reset email"}</span>
            </button>
          </form>
        )}
        {mode === "sign-in" ? (
          <>
            <div className="or-row" aria-hidden="true"><span>or</span></div>
            <button type="button" className="button button-google button-block" onClick={onGoogle} disabled={submitting}>
              <GoogleIcon /> Continue with Google
            </button>
            <p className="fine-print">
              New accounts require approval. If this is your first time, you can{" "}
              <button type="button" className="text-button" onClick={() => { setMode("request"); setMessage(""); }}>request access</button>.
              {" "}We will email you when your account is approved.
            </p>
          </>
        ) : (
          <p className="fine-print">
            <button type="button" className="text-button" onClick={() => { setMode("sign-in"); setMessage(""); }}>Back to sign in</button>
          </p>
        )}
        {session.demo ? (
          <p className="fine-print">
            <Link to="/">Preview the sample catalog</Link>
            {" · "}
            <Link to="/pending">Preview pending approval</Link>
          </p>
        ) : null}
        <p className="secure-note"><span aria-hidden="true">●</span> 256-bit encrypted franchise session</p>
      </section>
    </Shell>
  );
}
