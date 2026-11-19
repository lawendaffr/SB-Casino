const MODE_KEY = "sbCasinoApiMode";
const queryMode = new URLSearchParams(window.location.search).get("api");
const savedMode = localStorage.getItem(MODE_KEY);

if (["live", "mock"].includes(queryMode)) {
  if (savedMode && savedMode !== queryMode) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
  }
  localStorage.setItem(MODE_KEY, queryMode);
}

export const API_MODE = localStorage.getItem(MODE_KEY) || "live";
const mockAdapterPromise = API_MODE === "mock" ? import("./api.mock.js") : null;
export const apiReady = mockAdapterPromise
  ? mockAdapterPromise.then((adapter) => adapter.initialize())
  : Promise.resolve();

const syncChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("sb_casino_sync") : null;

export function notifyDataSync(detail = {}) {
  const payload = { ...detail, timestamp: Date.now() };
  try {
    syncChannel?.postMessage(payload);
  } catch {
    // Ignore BroadcastChannel errors
  }
  window.dispatchEvent(new CustomEvent("casino:data-sync", { detail: payload }));
}

if (syncChannel) {
  syncChannel.addEventListener("message", (event) => {
    window.dispatchEvent(new CustomEvent("casino:data-sync", { detail: event.data || {} }));
  });
}

// Per-tab session isolation: each tab keeps its own sessionStorage tokens once initialized,
// so a player tab and an admin tab can run side-by-side in the same browser without overwriting each other.
function ensureTabSessionInitialized() {
  if (sessionStorage.getItem("sbTabSessionInit")) return;
  sessionStorage.setItem("sbTabSessionInit", "1");
  const localAccess = localStorage.getItem("accessToken");
  const localRefresh = localStorage.getItem("refreshToken");
  if (localAccess && !sessionStorage.getItem("accessToken")) {
    sessionStorage.setItem("accessToken", localAccess);
  }
  if (localRefresh && !sessionStorage.getItem("refreshToken")) {
    sessionStorage.setItem("refreshToken", localRefresh);
  }
}

export function getAccessToken() {
  ensureTabSessionInitialized();
  return sessionStorage.getItem("accessToken");
}

export function getRefreshToken() {
  ensureTabSessionInitialized();
  return sessionStorage.getItem("refreshToken");
}

export function setAuthTokens(accessToken, refreshToken) {
  sessionStorage.setItem("sbTabSessionInit", "1");
  if (accessToken) {
    sessionStorage.setItem("accessToken", accessToken);
    localStorage.setItem("accessToken", accessToken);
  }
  if (refreshToken) {
    sessionStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("refreshToken", refreshToken);
  }
}

export function clearAuthTokens() {
  const currentAccess = sessionStorage.getItem("accessToken");
  sessionStorage.setItem("sbTabSessionInit", "1");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
  if (!currentAccess || localStorage.getItem("accessToken") === currentAccess) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

let refreshPromise;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    if (!response.ok) throw new Error("Session expired");

    const tokens = await response.json();
    setAuthTokens(tokens.accessToken, tokens.refreshToken);
    return tokens.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function readResponse(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest(path, options = {}, retry = true) {
  const method = (options.method || "GET").toUpperCase();

  if (API_MODE === "mock") {
    const adapter = await mockAdapterPromise;
    const res = await adapter.apiRequest(path, options);
    if (method !== "GET" && !path.startsWith("/api/auth/refresh")) {
      notifyDataSync({ path, method });
    }
    return res;
  }

  const headers = { ...options.headers };
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response = await fetch(path, { ...options, headers });
  if (response.status === 401 && retry && !path.startsWith("/api/auth/")) {
    try {
      headers.Authorization = `Bearer ${await refreshAccessToken()}`;
      response = await fetch(path, { ...options, headers });
    } catch {
      clearAuthTokens();
      window.dispatchEvent(new Event("casino:auth-expired"));
      throw new Error("Your session expired. Please log in again.");
    }
  }

  const data = await readResponse(response);
  if (!response.ok) {
    const error = new Error(
      typeof data === "object" && data !== null
        ? data.message || data.error || `HTTP ${response.status}`
        : data || `HTTP ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  if (method !== "GET" && !path.startsWith("/api/auth/refresh")) {
    notifyDataSync({ path, method });
  }
  return data;
}
