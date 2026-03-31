import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { User } from "oidc-client-ts";
import { userManager } from "./oidc";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  renewUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutInProgressRef = useRef(false);

  const refreshUser = useCallback(async () => {
    const currentUser = await userManager.getUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const currentUser = await userManager.getUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    hydrate();

    const onUserLoaded = (loadedUser: User) => {
      if (isMounted) {
        setUser(loadedUser);
      }
    };

    // When user is signed out, clear the user state immediately
    // This prevents race conditions where components try to access
    // protected endpoints after user has been signed out
    const onUserSignedOut = () => {
      if (isMounted) {
        setUser(null);
      }
    };

    // Also handle user unloaded event (happens when local session ends)
    const onUserUnloaded = () => {
      if (isMounted) {
        setUser(null);
      }
    };

    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addUserUnloaded(onUserUnloaded);
    userManager.events.addUserSignedOut(onUserSignedOut);

    return () => {
      isMounted = false;
      userManager.events.removeUserLoaded(onUserLoaded);
      userManager.events.removeUserUnloaded(onUserUnloaded);
      userManager.events.removeUserSignedOut(onUserSignedOut);
    };
  }, []);

  const login = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    await userManager.signinRedirect();
  }, [isLoggingOut]);

  const renewUser = useCallback(async () => {
    const renewed = await userManager.signinSilent();
    setUser(renewed);
  }, []);

  const logout = useCallback(async () => {
    if (logoutInProgressRef.current) {
      return;
    }

    logoutInProgressRef.current = true;
    setIsLoggingOut(true);

    try {
      await userManager.signoutRedirect();
    } catch (error) {
      logoutInProgressRef.current = false;
      setIsLoggingOut(false);
      console.warn("Error during signout redirect:", error);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && !user.expired),
      isLoading,
      isLoggingOut,
      login,
      logout,
      refreshUser,
      renewUser
    }),
    [isLoading, isLoggingOut, login, logout, refreshUser, renewUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
