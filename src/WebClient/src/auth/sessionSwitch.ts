export type SessionContext = {
  effectiveUserName: string;
  originalUserName: string;
  isSwitched: boolean;
  switchableUsers: string[];
};

type SwitchRequest = {
  targetUserName: string;
};

const authority = import.meta.env.VITE_AUTH_AUTHORITY ?? "https://localhost:5001";

async function parseResponse(response: Response): Promise<SessionContext> {
  if (!response.ok) {
    const detail = await response.text();

    // Provide more specific error messages for common HTTP status codes
    if (response.status === 401) {
      throw new Error(
        "Unauthorized: Your session expired or authentication cookie is invalid. Please sign in again."
      );
    } else if (response.status === 403) {
      throw new Error("Forbidden: You do not have permission to perform this action.");
    } else if (response.status === 404) {
      throw new Error("Not found: The requested session resource was not found.");
    } else if (response.status >= 500) {
      throw new Error(`Server error: ${response.status} ${detail || response.statusText}`);
    }

    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as SessionContext;
}

export async function getSessionContext(): Promise<SessionContext> {
  try {
    const response = await fetch(`${authority}/api/Session/Context`, {
      credentials: "include"
    });

    return parseResponse(response);
  } catch (error) {
    // Re-throw with context about which operation failed
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch session context: ${message}`);
  }
}

export async function switchSessionUser(targetUserName: string): Promise<SessionContext> {
  const body: SwitchRequest = { targetUserName };

  try {
    const response = await fetch(`${authority}/api/Session/Switch`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    return parseResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to switch user: ${message}`);
  }
}

export async function switchBackSessionUser(): Promise<SessionContext> {
  try {
    const response = await fetch(`${authority}/api/Session/SwitchBack`, {
      method: "POST",
      credentials: "include"
    });

    return parseResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to switch back to original user: ${message}`);
  }
}
