const POST_AUTH_REDIRECT_KEY = "cira_post_auth_redirect";

export function sanitizeAuthRedirect(path?: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  if (path === "/login" || path === "/register") {
    return null;
  }

  return path;
}

export function storePostAuthRedirect(path?: string | null) {
  const safePath = sanitizeAuthRedirect(path);

  if (!safePath) {
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    return;
  }

  sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, safePath);
}

export function consumePostAuthRedirect(): string | null {
  const storedPath = sanitizeAuthRedirect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY));
  sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  return storedPath;
}