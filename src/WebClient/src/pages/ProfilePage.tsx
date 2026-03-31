import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { SessionSwitchPanel } from "../components/SessionSwitchPanel";

export function ProfilePage() {
  const { user, logout, isLoggingOut } = useAuth();

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
          <pre>{JSON.stringify(user?.profile ?? {}, null, 2)}</pre>
        </section>

        <SessionSwitchPanel />
      </section>
    </main>
  );
}
