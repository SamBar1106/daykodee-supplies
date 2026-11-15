import assert from "node:assert/strict";
import test from "node:test";
import { LoginState } from "@wix/sdk";
import {
  beginGoogleSignIn,
  beginPasswordLogin,
  finishOAuthCallback,
  loginMessage,
  submitVerificationCode,
} from "./authFlow.js";
import { OAUTH_DATA_KEY, PKCE_KEY, TOKEN_STORAGE_KEY } from "./config.js";
import { fetchFranchiseCatalog } from "./franchise.js";
import { memberAccessToken, readStoredTokens } from "./wixClient.js";

function storage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: (key) => entries.delete(key),
  };
}

function browser(t) {
  const replacements = {
    localStorage: storage(),
    sessionStorage: storage(),
    window: {
      location: { origin: "https://portal.example", search: "", assign: t.mock.fn() },
    },
  };
  for (const [key, value] of Object.entries(replacements)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    });
  }
  // Every test must explicitly mock each expected request. Never contact Wix.
  t.mock.method(globalThis, "fetch", async () => assert.fail("Unexpected request"));
}

function mockWix(t, response) {
  let tokens = {};
  return {
    auth: {
      login: t.mock.fn(async () => response),
      getTokens: () => tokens,
      setTokens: t.mock.fn((next) => { tokens = next; }),
      loggedIn: () => tokens.refreshToken?.role === "member",
      generateVisitorTokens: t.mock.fn(async () => ({
        accessToken: { value: "mock-visitor-access", expiresAt: 0 },
      })),
    },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function returnFromPasswordRedirect() {
  const { state } = JSON.parse(sessionStorage.getItem(PKCE_KEY));
  window.location.search = `?code=mock-code&state=${state}`;
}

for (const [httpStatus, expectedStatus] of [[200, "ok"], [403, "forbidden"]]) {
  test(`first password attempt refreshes stale access to ${expectedStatus} after the token exchange`, async (t) => {
    browser(t);
    const success = { loginState: LoginState.SUCCESS, data: { sessionToken: "mock-session" } };
    const wix = mockWix(t, success);
    const tokenRequested = deferred();
    const tokenResponse = deferred();
    const accessRequested = deferred();
    const accessResponse = deferred();
    let catalogStatus = "unauthorized"; // Provider's mount-time visitor check already finished.
    const requests = [];
    t.mock.method(globalThis, "fetch", async (url, options) => {
      requests.push(url);
      if (url.endsWith("/redirect-session")) {
        const request = JSON.parse(options.body);
        assert.equal(request.auth.authRequest.sessionToken, "mock-session");
        assert.equal(options.headers.authorization, "mock-visitor-access");
        return { ok: true, json: async () => ({ redirectSession: { fullUrl: "https://auth.example/authorize" } }) };
      }
      if (url.endsWith("/oauth2/token")) {
        const request = JSON.parse(options.body);
        assert.equal(request.code, "mock-code");
        assert.equal(request.codeVerifier, JSON.parse(sessionStorage.getItem(PKCE_KEY)).codeVerifier);
        tokenRequested.resolve();
        return { ok: true, json: () => tokenResponse.promise };
      }
      assert.ok(url.endsWith("/franchise-catalog"));
      assert.equal(options.headers.Authorization, "Bearer mock-member-access");
      accessRequested.resolve();
      return accessResponse.promise;
    });

    assert.equal(await beginPasswordLogin(wix, "member@example.test", "mock-password"), success);
    assert.equal(wix.auth.login.mock.callCount(), 1);
    assert.equal(window.location.assign.mock.calls[0].arguments[0], "https://auth.example/authorize");
    returnFromPasswordRedirect();
    const refresh = t.mock.fn(async () => {
      assert.equal(wix.auth.loggedIn(), true);
      assert.deepEqual(readStoredTokens(), wix.auth.getTokens());
      assert.equal(sessionStorage.getItem(PKCE_KEY), null);
      const token = await memberAccessToken(wix);
      catalogStatus = (await fetchFranchiseCatalog(token)).status;
    });
    let finished = false;
    const callback = finishOAuthCallback(wix, refresh).then(() => { finished = true; });
    await tokenRequested.promise;
    assert.equal(refresh.mock.callCount(), 0);
    assert.equal(localStorage.getItem(TOKEN_STORAGE_KEY), null);
    assert.equal(catalogStatus, "unauthorized");

    tokenResponse.resolve({
      access_token: "mock-member-access", refresh_token: "mock-member-refresh", expires_in: 3600,
    });
    await Promise.race([
      accessRequested.promise,
      callback.then(() => assert.fail("callback completed without refreshing stale access")),
    ]);
    assert.equal(finished, false, "navigation must wait for the access check too");
    accessResponse.resolve({ status: httpStatus, json: async () => httpStatus === 200 ? { items: [] } : { error: "forbidden" } });
    await callback;
    assert.equal(refresh.mock.callCount(), 1);
    assert.equal(catalogStatus, expectedStatus);
    assert.equal(wix.auth.login.mock.callCount(), 1, "no second password login");
    assert.equal(requests.length, 3);
  });
}

test("invalid password stays a failure without exchanging or applying member tokens", async (t) => {
  browser(t);
  const failure = { loginState: LoginState.FAILURE, errorCode: "invalidPassword" };
  const wix = mockWix(t, failure);
  assert.equal(await beginPasswordLogin(wix, "member@example.test", "mock-wrong-password"), failure);
  assert.match(loginMessage(failure), /password does not match/);
  assert.equal(wix.auth.setTokens.mock.callCount(), 0);
  assert.equal(window.location.assign.mock.callCount(), 0);
});

for (const state of [LoginState.EMAIL_VERIFICATION_REQUIRED, LoginState.OWNER_APPROVAL_REQUIRED]) {
  test(`${state} remains a required step without member tokens or a redirect`, async (t) => {
    browser(t);
    const response = { loginState: state };
    const wix = mockWix(t, response);
    assert.equal(await beginPasswordLogin(wix, "member@example.test", "mock-password"), response);
    assert.match(loginMessage(response), state === LoginState.EMAIL_VERIFICATION_REQUIRED ? /verification code/ : /approval/);
    assert.equal(wix.auth.setTokens.mock.callCount(), 0);
    assert.equal(window.location.assign.mock.callCount(), 0);
  });
}

test("email verification completes through the same password callback without another login", async (t) => {
  browser(t);
  const pending = { loginState: LoginState.EMAIL_VERIFICATION_REQUIRED };
  const wix = mockWix(t, pending);
  const success = { loginState: LoginState.SUCCESS, data: { sessionToken: "mock-session" } };
  wix.auth.processVerification = t.mock.fn(async (code, response) => {
    assert.equal(code.verificationCode, "mock-code");
    assert.equal(response, pending);
    return success;
  });
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/redirect-session")) {
      return { ok: true, json: async () => ({ redirectSession: { fullUrl: "https://auth.example/authorize" } }) };
    }
    assert.ok(url.endsWith("/oauth2/token"));
    return { ok: true, json: async () => ({ access_token: "mock-member-access", refresh_token: "mock-member-refresh", expires_in: 3600 }) };
  });
  await beginPasswordLogin(wix, "member@example.test", "mock-password");
  assert.equal(await submitVerificationCode(wix, pending, "mock-code"), success);
  returnFromPasswordRedirect();
  const refresh = t.mock.fn(async () => assert.equal(wix.auth.loggedIn(), true));
  await finishOAuthCallback(wix, refresh);
  assert.equal(refresh.mock.callCount(), 1);
  assert.equal(wix.auth.login.mock.callCount(), 1);
});

test("Google first-attempt redirect and callback keep their existing SDK path", async (t) => {
  browser(t);
  const wix = mockWix(t);
  const oauthData = { state: "mock-google-state", codeVerifier: "mock-google-verifier" };
  const memberTokens = {
    accessToken: { value: "mock-google-access", expiresAt: 9999999999 },
    refreshToken: { value: "mock-google-refresh", role: "member" },
  };
  wix.auth.generateOAuthData = () => oauthData;
  wix.auth.getAuthUrl = async (data, options) => {
    assert.deepEqual(data, oauthData);
    assert.equal(options.idp, "google");
    return { authUrl: "https://auth.example/google" };
  };
  wix.auth.parseFromUrl = () => ({ code: "mock-google-code", state: oauthData.state });
  wix.auth.getMemberTokens = t.mock.fn(async (code, state, data) => {
    assert.equal(code, "mock-google-code");
    assert.equal(state, oauthData.state);
    assert.deepEqual(data, oauthData);
    return memberTokens;
  });
  await beginGoogleSignIn(wix);
  assert.equal(window.location.assign.mock.calls[0].arguments[0], "https://auth.example/google");
  await finishOAuthCallback(wix, () => assert.fail("Google must not use the password refresh"));
  assert.deepEqual(readStoredTokens(), memberTokens);
  assert.equal(sessionStorage.getItem(OAUTH_DATA_KEY), null);
  assert.equal(wix.auth.getMemberTokens.mock.callCount(), 1);
  assert.equal(wix.auth.login.mock.callCount(), 0);
});
