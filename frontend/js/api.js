
const API_BASE_URL = window.API_BASE_URL || (window.location.port === "5500" ? `http://${window.location.hostname || "localhost"}:8080` : "");

let refreshPromise = null;

async function refreshAccessToken() {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
            throw new Error("Session expired");
        }

        const result = await response.json();

        localStorage.setItem("accessToken", result.accessToken);
        localStorage.setItem("refreshToken", result.refreshToken);

        return result.accessToken;
    })();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
}

async function apiRequest(path, options = {}, retry = true) {
    const headers = {
        ...options.headers
    };

    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const token = localStorage.getItem("accessToken");

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    if (response.status === 401 && retry &&
        !path.startsWith("/api/auth/")) {
        try {
            const newToken = await refreshAccessToken();

            headers["Authorization"] = `Bearer ${newToken}`;

            response = await fetch(`${API_BASE_URL}${path}`, {
                ...options,
                headers
            });
        } catch {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "login.html";
            throw new Error("Your session expired. Please log in again.");
        }
    }

    if (response.status === 204) {
        return null;
    }

    const text = await response.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!response.ok) {
        const message =
            typeof data === "object" && data !== null
                ? data.message || data.error
                : data;

        throw new Error(message || `HTTP ${response.status}`);
    }

    return data;
}
