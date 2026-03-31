import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { SessionSwitchPanel } from "../components/SessionSwitchPanel";

export function ProfilePage() {
  const { user, logout, isLoggingOut } = useAuth();
  const profile = (user?.profile ?? {}) as Record<string, unknown>;
  const switchMode = String(profile["switch_mode"] ?? "").toLowerCase() === "true";
  const originalName = profile["original_name"];
  const originalEmail = profile["original_email"];
  const originalSub = profile["original_sub"];

  return (
    <main className="shell">
      <section className="card">
        <h1>Protected Profile</h1>
        <p>This route requires a valid OIDC session and is only accessible after login.</p>
        <div className="row">
          <Link to="/" className="btn-secondary">
            Back home
          </Link>
          <button
            className="btn-danger"
            type="button"
            onClick={() => void logout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>

        <section className="claims" aria-label="User claims">
          <h2>OIDC Claims</h2>
          <p>
            Token mode: <strong>{switchMode ? "switched-session token" : "login token"}</strong>
          </p>

          {switchMode && (
            <p>
              Original actor: <strong>{String(originalName ?? originalSub ?? "unknown")}</strong>
              {originalEmail ? ` (${String(originalEmail)})` : ""}
            </p>
          )}

          <pre>{JSON.stringify(profile, null, 2)}</pre>
        </section>

        <SessionSwitchPanel />
      </section>
    </main>
  );
}
