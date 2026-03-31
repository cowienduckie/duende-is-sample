import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { SessionSwitchPanel } from "../components/SessionSwitchPanel";

export function HomePage() {
  const { isAuthenticated, isLoading, isLoggingOut, login, logout, user } = useAuth();

  return (
    <main className="shell">
      <section className="card">
        <h1>WebClient OIDC Demo</h1>
        <p>React + Vite app authenticated by AuthServer using Authorization Code flow with PKCE.</p>
        <p className="hint">
          Auth status:{" "}
          <strong>
            {isLoading ? "loading..." : isAuthenticated ? "authenticated" : "anonymous"}
          </strong>
        </p>

        <div className="row">
          {!isAuthenticated && (
            <button className="btn" type="button" onClick={() => void login()}>
              Sign in with AuthServer
            </button>
          )}

          {isAuthenticated && (
            <>
              <Link to="/profile" className="btn-secondary">
                View profile route
              </Link>
              <button
                className="btn-danger"
                type="button"
                onClick={() => void logout()}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </button>
            </>
          )}
        </div>

        {isAuthenticated && user && (
          <p className="hint">
            Signed in as <span className="mono">{user.profile.name ?? user.profile.sub}</span>
          </p>
        )}

        <SessionSwitchPanel />
      </section>
    </main>
  );
}
