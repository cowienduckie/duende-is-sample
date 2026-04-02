import { UserManager, WebStorageStateStore, type UserManagerSettings } from "oidc-client-ts";

const authority = import.meta.env.VITE_AUTH_AUTHORITY ?? "https://localhost:5001";
const clientId = import.meta.env.VITE_AUTH_CLIENT_ID ?? "webclient.spa";
const redirectUri = import.meta.env.VITE_AUTH_REDIRECT_URI ?? "http://localhost:5173/auth/callback";
const postLogoutRedirectUri =
  import.meta.env.VITE_AUTH_POST_LOGOUT_REDIRECT_URI ??
  "http://localhost:5173/auth/logout-callback";
const silentRedirectUri =
  import.meta.env.VITE_AUTH_SILENT_REDIRECT_URI ?? "http://localhost:5173/auth/silent-callback";
const scope = import.meta.env.VITE_AUTH_SCOPE ?? "openid profile email session_context scope1";

const settings: UserManagerSettings = {
  authority,
  client_id: clientId,
  redirect_uri: redirectUri,
  post_logout_redirect_uri: postLogoutRedirectUri,
  silent_redirect_uri: silentRedirectUri,
  response_type: "code",
  scope,
  monitorSession: false,
  silentRequestTimeoutInSeconds: 3,
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage })
};

export const userManager = new UserManager(settings);
