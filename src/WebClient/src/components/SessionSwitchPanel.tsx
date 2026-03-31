import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  getSessionContext,
  switchBackSessionUser,
  switchSessionUser,
  type SessionContext
} from "../auth/sessionSwitch";

export function SessionSwitchPanel() {
  const { isAuthenticated, isLoading, isLoggingOut, login } = useAuth();
  const [context, setContext] = useState<SessionContext | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't attempt to fetch if user is not authenticated or still loading
    if (isLoading || !isAuthenticated || isLoggingOut) {
      setContext(null);
      setError(null);
      return;
    }

    let isMounted = true;
    const timeoutId: ReturnType<typeof setTimeout> | null = null;

    const loadContext = async () => {
      setIsFetching(true);
      setError(null);

      try {
        const value = await getSessionContext();
        if (isMounted) {
          setContext(value);
        }
      } catch (e) {
        // Only show error if it's not a 401 Unauthorized (which could happen
        // during logout race conditions or token expiration)
        const message = e instanceof Error ? e.message : String(e);
        if (isMounted) {
          // Don't show error for 401 - it might be a transient logout condition
          // If user is still authenticated, this is a real error
          if (!message.includes("401")) {
            setError(message);
          } else {
            // 401 during session fetch - user might be in logout process
            // Clear context and silently fail
            setContext(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    void loadContext();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, isLoading, isLoggingOut]);

  const switchableUsers = useMemo(() => context?.switchableUsers ?? [], [context]);

  const triggerRelogin = async () => {
    await login();
  };

  const handleSwitch = async (targetUserName: string) => {
    setIsSwitching(true);
    setError(null);

    try {
      await switchSessionUser(targetUserName);
      await triggerRelogin();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setIsSwitching(false);
    }
  };

  const handleSwitchBack = async () => {
    setIsSwitching(true);
    setError(null);

    try {
      await switchBackSessionUser();
      await triggerRelogin();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setIsSwitching(false);
    }
  };

  if (!isAuthenticated || !context) {
    return null;
  }

  return (
    <section className="switch-panel" aria-label="Session switch controls">
      <h2>Session Context</h2>
      {isFetching ? (
        <p className="hint">Refreshing session context...</p>
      ) : (
        <>
          <p className="hint">
            Effective user: <span className="mono">{context.effectiveUserName}</span>
          </p>
          <p className="hint">
            Original account: <span className="mono">{context.originalUserName}</span>
          </p>
          {context.isSwitched && (
            <p className="switch-badge" role="status">
              Switched mode active: you are acting as {context.effectiveUserName} on behalf of{" "}
              {context.originalUserName}.
            </p>
          )}
        </>
      )}

      {error && <p className="switch-error">Session switch error: {error}</p>}

      <div className="row">
        {context.isSwitched ? (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => void handleSwitchBack()}
            disabled={isSwitching}
          >
            {isSwitching ? "Switching back..." : `Switch back to ${context.originalUserName}`}
          </button>
        ) : switchableUsers.length > 0 ? (
          switchableUsers.map((username) => (
            <button
              key={username}
              className="btn-secondary"
              type="button"
              onClick={() => void handleSwitch(username)}
              disabled={isSwitching}
            >
              {isSwitching ? "Switching..." : `Switch to ${username}`}
            </button>
          ))
        ) : (
          <p className="hint">No other users available to switch to.</p>
        )}
      </div>
    </section>
  );
}
