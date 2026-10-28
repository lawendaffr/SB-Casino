const THEME_STORAGE_KEY = "sbCasinoTheme";

function getPreferredTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
    }
    return "dark";
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    const toggleButton = document.getElementById("theme-toggle");
    if (toggleButton) {
        const isDark = theme === "dark";
        toggleButton.setAttribute(
            "aria-label",
            isDark ? "Switch to light mode" : "Switch to dark mode"
        );
        toggleButton.setAttribute("aria-pressed", String(isDark));
        toggleButton.textContent = isDark ? "Theme: Onyx" : "Theme: Light";
    }
}

function toggleTheme() {
    const currentTheme =
        document.documentElement.getAttribute("data-theme") || getPreferredTheme();
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
}

// Apply saved/default theme immediately to avoid flash of unstyled theme
applyTheme(getPreferredTheme());

function loadNavbar() {
    applyTheme(getPreferredTheme());

    const navbarContainer = document.getElementById("navbar");
    if (navbarContainer) {
        // Inject the same markup as components/navbar.html directly. This avoids
        // a local template fetch and keeps the demo navbar available on static hosts.
        navbarContainer.innerHTML = `
            <nav id="main-navbar">
                <a href="index.html">SB-Casino</a>
                <a href="index.html">Home</a>

                <a href="dashboard.html" id="dashboard-link">Dashboard</a>
                <a href="blackjack.html" id="blackjack-link">Blackjack</a>
                <a href="history.html" id="history-link">Game History</a>
                <a href="deposit.html" id="deposit-link">Redeem Code</a>

                <button type="button" id="theme-toggle"></button>
                <a href="login.html" id="login-link">Login / Register</a>
                <button type="button" id="logout-button" hidden>Logout</button>
            </nav>
            <hr>
        `;

        const loggedIn = Boolean(localStorage.getItem("accessToken"));
        document.getElementById("login-link").hidden = loggedIn;
        document.getElementById("logout-button").hidden = !loggedIn;
        document.getElementById("logout-button").addEventListener("click", logout);
        document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
        applyTheme(getPreferredTheme());
        return;
    }

    const homeTopContainer = document.getElementById("navbar-container");
    if (homeTopContainer) {
        homeTopContainer.innerHTML = `
            <div id="home-toolbar">
                <button type="button" id="theme-toggle"></button>
            </div>
        `;
        document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
        applyTheme(getPreferredTheme());
    }
}

async function logout() {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
        if (refreshToken) {
            await apiRequest("/api/auth/logout", {
                method: "POST",
                body: JSON.stringify({ refreshToken })
            });
        }
    } finally {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "index.html";
    }
}

document.addEventListener("DOMContentLoaded", loadNavbar);
