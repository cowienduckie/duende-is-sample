import { useEffect } from "react";
import { userManager } from "../auth/oidc";

export function SilentCallbackPage() {
  useEffect(() => {
    const completeSilentSignIn = async () => {
      try {
        await userManager.signinSilentCallback();
      } catch {
        // Silent renew failures are handled by the caller flow; this page should stay no-op.
      }
    };

    void completeSilentSignIn();
  }, []);

  return null;
}
