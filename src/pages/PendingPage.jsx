import { Shell } from "../components/Shell.jsx";
import { ClockIcon, ShieldIcon } from "../components/Icons.jsx";
import { useSession } from "../session.jsx";

export function PendingPage() {
  const session = useSession();
  const email = session.member?.loginEmail || "your franchise email";

  return (
    <Shell screen="pending">
      <section className="auth-card pending-card">
        <p className="status-pill"><span className="gold-dot" aria-hidden="true" /> Pending approval</p>
        <div className="clock-badge" aria-hidden="true"><ClockIcon /></div>
        <h1>Your access is waiting for approval</h1>
        <p className="lede">
          Thanks for requesting access to Daykodee Supplies. A Daykodee administrator must approve franchise owner accounts before you can view franchise pricing or place an order. We will email you at{" "}
          <span className="email-pill">{email}</span> when your account is ready.
        </p>
        <div className="verify-box">
          <p><ShieldIcon /> Verification in progress</p>
          <span>Franchise territory credentials are verified by the Daykodee team. Product lists stay hidden until the Franchisees label is on the account.</span>
        </div>
        <button type="button" className="button button-outline button-block" onClick={session.signOut}>
          ← Back to sign in
        </button>
        <p className="fine-print">If you already have an approved account, try signing in with the email on file.</p>
      </section>
    </Shell>
  );
}
