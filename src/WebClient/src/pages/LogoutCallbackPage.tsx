import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userManager } from "../auth/oidc";

export function LogoutCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  useEffect(() => {
    const completeSignOut = async () => {
      try {
        // Clear local auth state first to prevent race conditions
        // where other components try to call protected endpoints
        // before signoutRedirectCallback completes
        await userManager.removeUser();

        // Then complete the OIDC signout callback
        try {
          await userManager.signoutRedirectCallback();
        } catch (callbackError) {
          // Even if callback fails, user is already cleared from storage
          // so it's safe to continue. Log the error but don't block navigation.
          console.warn("Sign-out callback error (non-blocking):", callbackError);
        }

        // Give React a moment to process context updates before navigating
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigate("/", { replace: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("Sign-out error:", message);

        // Retry up to maxRetries times in case of transient errors
        if (retryCount < maxRetries) {
          console.log(`Retrying sign-out (attempt ${retryCount + 1}/${maxRetries})`);
          setRetryCount(retryCount + 1);
          // Retry after a short delay
          setTimeout(() => {
            setError(null);
          }, 500);
        } else {
          // After all retries exhausted, show error but allow user to navigate home manually
          setError(message);
        }
      }
    };

    completeSignOut();
  }, [navigate, retryCount]);

  return (
    <main className="center-message">
      {error ? (
        <div>
          <p>Sign-out callback failed: {error}</p>
          <p>
            <Link to="/">Return home</Link>
          </p>
        </div>
      ) : (
        <p>Completing sign-out...</p>
      )}
    </main>
  );
}
