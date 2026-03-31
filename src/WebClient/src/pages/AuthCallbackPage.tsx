import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userManager } from "../auth/oidc";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeSignIn = async () => {
      try {
        await userManager.signinRedirectCallback();
        navigate("/profile", { replace: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
      }
    };

    void completeSignIn();
  }, [navigate]);

  return (
    <main className="center-message">
      {error ? (
        <p>
          Sign-in callback failed: {error} <Link to="/">Back home</Link>
        </p>
      ) : (
        <p>Completing sign-in...</p>
      )}
    </main>
  );
}
