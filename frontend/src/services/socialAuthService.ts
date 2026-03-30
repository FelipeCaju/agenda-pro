function loadScript(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(id) as HTMLScriptElement | null;

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Falha ao carregar script.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Falha ao carregar script."));
    document.head.appendChild(script);
  });
}

export function getGoogleClientId() {
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim();
}

export function getAppleClientId() {
  return String(import.meta.env.VITE_APPLE_CLIENT_ID ?? "").trim();
}

export function getAppleRedirectUri() {
  return String(import.meta.env.VITE_APPLE_REDIRECT_URI ?? window.location.origin).trim();
}

export async function ensureGoogleAuthLoaded() {
  await loadScript("https://accounts.google.com/gsi/client", "google-identity-services");
}

export async function ensureAppleAuthLoaded() {
  await loadScript(
    "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js",
    "apple-signin-services",
  );
}

export async function signInWithApple() {
  const clientId = getAppleClientId();

  if (!clientId) {
    throw new Error("Login com Apple nao configurado.");
  }

  await ensureAppleAuthLoaded();

  if (!window.AppleID?.auth) {
    throw new Error("Apple Sign In nao ficou disponivel.");
  }

  window.AppleID.auth.init({
    clientId,
    scope: "name email",
    redirectURI: getAppleRedirectUri(),
    usePopup: true,
  });

  const response = await window.AppleID.auth.signIn();
  const idToken = response.authorization?.id_token;

  if (!idToken) {
    throw new Error("A Apple nao retornou um token de login.");
  }

  return idToken;
}
