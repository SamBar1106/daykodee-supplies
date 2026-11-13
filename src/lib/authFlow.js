import { LoginState } from "@wix/sdk";
import { OAUTH_DATA_KEY, PKCE_KEY, WIX_CLIENT_ID } from "./config.js";
import { appUrl } from "./paths.js";
import { codeChallengeS256, randomHex } from "./pkce.js";
import { applyTokens, ensureVisitorTokens } from "./wixClient.js";

function assertNever(value) {
  throw new Error(`Unhandled login state: ${String(value)}`);
}

export function loginMessage(response) {
  switch (response.loginState) {
    case LoginState.SUCCESS:
      return "";
    case LoginState.FAILURE:
      switch (response.errorCode) {
        case "invalidEmail":
          return "Enter the email on your franchise account.";
        case "invalidPassword":
          return "That password does not match. Try again or reset it.";
        case "emailAlreadyExists":
          return "That email already has an account. Sign in instead.";
        case "resetPassword":
          return "This account needs a password reset before it can sign in.";
        case "missingCaptchaToken":
        case "invalidCaptchaToken":
          return "Sign-in needs a security check that is not set up on this client yet.";
        default:
          return "Sign-in did not succeed. Check the email and password.";
      }
    case LoginState.EMAIL_VERIFICATION_REQUIRED:
      return "Enter the verification code Wix sent to your email.";
    case LoginState.OWNER_APPROVAL_REQUIRED:
      return "Your account is waiting for Daykodee approval.";
    case LoginState.SILENT_CAPTCHA_REQUIRED:
    case LoginState.USER_CAPTCHA_REQUIRED:
      return "Sign-in needs a security check that is not set up on this client yet.";
    case LoginState.INITIAL:
      return "Enter your email and password to continue.";
    default:
      return assertNever(response.loginState);
  }
}

async function startPkceRedirect(wix, sessionToken) {
  const redirectUri = appUrl("callback");
  const codeVerifier = randomHex(32);
  const codeChallenge = await codeChallengeS256(codeVerifier);
  const state = randomHex(16);
  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ codeVerifier, state, redirectUri }));
  const visitorTokens = await ensureVisitorTokens(wix);
  const redirectResponse = await fetch(
    "https://www.wixapis.com/_api/redirects-api/v1/redirect-session",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: visitorTokens.accessToken.value,
      },
      body: JSON.stringify({
        auth: {
          authRequest: {
            clientId: WIX_CLIENT_ID,
            codeChallenge,
            codeChallengeMethod: "S256",
            responseMode: "query",
            responseType: "code",
            scope: "offline_access",
            redirectUri,
            sessionToken,
            state,
          },
        },
        callbacks: {
          postFlowUrl: appUrl(""),
        },
      }),
    },
  );
  const redirectData = await redirectResponse.json().catch(() => null);
  const fullUrl = redirectData?.redirectSession?.fullUrl || redirectData?.redirectSession?.fullURL;
  if (!redirectResponse.ok || !fullUrl) {
    throw new Error("Wix could not open the secure sign-in step.");
  }
  window.location.assign(fullUrl);
}

export async function beginPasswordLogin(wix, email, password) {
  const response = await wix.auth.login({ email, password });
  if (response.loginState === LoginState.SUCCESS) {
    await startPkceRedirect(wix, response.data.sessionToken);
  }
  return response;
}

export async function beginRegistration(wix, email, password) {
  const response = await wix.auth.register({ email, password });
  if (response.loginState === LoginState.SUCCESS) {
    await startPkceRedirect(wix, response.data.sessionToken);
  }
  return response;
}

export async function submitVerificationCode(wix, response, verificationCode) {
  const next = await wix.auth.processVerification({ verificationCode }, response);
  if (next.loginState === LoginState.SUCCESS) {
    await startPkceRedirect(wix, next.data.sessionToken);
  }
  return next;
}

export async function sendPasswordReset(wix, email) {
  await wix.auth.sendPasswordResetEmail(email, appUrl("callback"));
}

export async function beginGoogleSignIn(wix) {
  const redirectUri = appUrl("callback");
  const loginRequestData = wix.auth.generateOAuthData(redirectUri, appUrl("login"));
  sessionStorage.setItem(OAUTH_DATA_KEY, JSON.stringify(loginRequestData));
  await ensureVisitorTokens(wix);
  const { authUrl } = await wix.auth.getAuthUrl(loginRequestData, { idp: "google" });
  window.location.assign(authUrl);
}

async function finishPkceQuery(wix) {
  const raw = sessionStorage.getItem(PKCE_KEY);
  if (!raw) return false;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return false;
  const stored = JSON.parse(raw);
  if (params.get("state") !== stored.state) {
    throw new Error("Sign-in could not be verified. Start again from the login page.");
  }
  const tokenResponse = await fetch("https://www.wixapis.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: WIX_CLIENT_ID,
      grantType: "authorization_code",
      code,
      codeVerifier: stored.codeVerifier,
      redirectUri: stored.redirectUri,
    }),
  });
  const tokenData = await tokenResponse.json().catch(() => null);
  if (!tokenResponse.ok || !tokenData?.access_token) {
    throw new Error("Wix did not return a member session.");
  }
  applyTokens(wix, {
    accessToken: {
      value: tokenData.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + Number(tokenData.expires_in || 0),
    },
    refreshToken: {
      value: tokenData.refresh_token,
      role: "member",
    },
  });
  sessionStorage.removeItem(PKCE_KEY);
  return true;
}

export async function finishOAuthCallback(wix) {
  const pkceDone = await finishPkceQuery(wix);
  if (pkceDone) return;
  const raw = sessionStorage.getItem(OAUTH_DATA_KEY);
  if (!raw) {
    throw new Error("This page finishes a sign-in that was started on the login screen.");
  }
  const oAuthData = JSON.parse(raw);
  const returned = wix.auth.parseFromUrl();
  if (returned.error) {
    throw new Error(returned.errorDescription || "Google sign-in did not finish.");
  }
  const tokens = await wix.auth.getMemberTokens(returned.code, returned.state, oAuthData);
  applyTokens(wix, tokens);
  sessionStorage.removeItem(OAUTH_DATA_KEY);
}
