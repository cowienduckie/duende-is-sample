import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../auth/useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, isLoggingOut, login } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoggingOut) {
      void login();
    }
  }, [isAuthenticated, isLoading, isLoggingOut, login]);

  if (isLoading) {
    return (
      <main className="center-message">
        <p>Checking your session...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="center-message">
        <p>{isLoggingOut ? "Signing you out..." : "Redirecting to AuthServer sign-in..."}</p>
      </main>
    );
  }

  return <>{children}</>;
}
