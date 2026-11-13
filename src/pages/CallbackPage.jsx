import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shell } from "../components/Shell.jsx";
import { finishOAuthCallback } from "../lib/authFlow.js";
import { isDemoMode } from "../lib/demo.js";
import { getWixClient } from "../lib/wixClient.js";

export function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const demoPreview = isDemoMode() && !window.location.search.includes("code=");

  useEffect(() => {
    if (demoPreview) return undefined;
    let cancelled = false;
    async function finish() {
      const wix = getWixClient();
      if (!wix) {
        if (!cancelled) setError("The supplies sign-in client is not configured yet (SUP-002).");
        return;
      }
      try {
        await finishOAuthCallback(wix);
        if (!cancelled) navigate("/", { replace: true });
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Sign-in could not be finished.");
        }
      }
    }
    finish();
    return () => {
      cancelled = true;
    };
  }, [demoPreview, navigate]);

  return (
    <Shell screen="callback">
      <section className="status-card" aria-live="polite">
        {demoPreview ? (
          <>
            <h1>Finishing sign-in</h1>
            <p>This is the return page after Wix Members completes email or Google sign-in. In this preview there is no live session yet.</p>
            <Link className="button button-outline button-block" to="/login">Back to sign in</Link>
          </>
        ) : error ? (
          <>
            <h1>Sign-in needs another try</h1>
            <p>{error}</p>
            <Link className="button button-outline button-block" to="/login">Back to sign in</Link>
          </>
        ) : (
          <>
            <h1>Finishing sign-in</h1>
            <p>Returning you to the franchise catalog.</p>
          </>
        )}
      </section>
    </Shell>
  );
}
