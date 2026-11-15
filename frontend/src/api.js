const MODE_KEY = "sbCasinoApiMode";
const queryMode = new URLSearchParams(window.location.search).get("api");
const savedMode = localStorage.getItem(MODE_KEY);

if (["live", "mock"].includes(queryMode)) {
  if (savedMode && savedMode !== queryMode) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
  localStorage.setItem(MODE_KEY, queryMode);
}

export const API_MODE = localStorage.getItem(MODE_KEY) || "live";
const mockAdapterPromise = API_MODE === "mock" ? import("./api.mock.js") : null;
export const apiReady = mockAdapterPromise
  ? mockAdapterPromise.then((adapter) => adapter.initialize())
  : Promise.resolve();

let refreshPromise;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    if (!response.ok) throw new Error("Session expired");

    const tokens = await response.json();
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
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
  if (API_MODE === "mock") {
    const adapter = await mockAdapterPromise;
    return adapter.apiRequest(path, options);
  }

  const headers = { ...options.headers };
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const token = localStorage.getItem("accessToken");
  if (token) headers.Authorization = `Bearer ${token}`;

  let response = await fetch(path, { ...options, headers });
  if (response.status === 401 && retry && !path.startsWith("/api/auth/")) {
    try {
      headers.Authorization = `Bearer ${await refreshAccessToken()}`;
      response = await fetch(path, { ...options, headers });
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
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
  return data;
}
