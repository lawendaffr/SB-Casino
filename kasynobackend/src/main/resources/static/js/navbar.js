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

    const toggleButtons = document.querySelectorAll("#theme-toggle");
    toggleButtons.forEach((toggleButton) => {
        const isDark = theme === "dark";
        toggleButton.setAttribute(
            "aria-label",
            isDark ? "Switch to light mode" : "Switch to dark mode"
        );
        toggleButton.setAttribute("aria-pressed", String(isDark));
        toggleButton.textContent = isDark ? "Theme: Onyx" : "Theme: Light";
    });
}

function toggleTheme() {
    const currentTheme =
        document.documentElement.getAttribute("data-theme") || getPreferredTheme();
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
}

// Apply saved/default theme immediately to avoid flash of unstyled theme
applyTheme(getPreferredTheme());

async function loadNavbar() {
    applyTheme(getPreferredTheme());

    const navbarContainer = document.getElementById("navbar");
    if (navbarContainer) {
        try {
            const response = await fetch("components/navbar.html");
            if (!response.ok) {
                throw new Error("Failed to load navbar");
            }
            navbarContainer.innerHTML = await response.text();
        } catch (error) {
            console.warn("Falling back to inline navbar:", error);
            navbarContainer.innerHTML = `
                <nav id="main-navbar">
                    <a href="index.html">SB-Casino</a>
                    <a href="index.html">Home</a>

                    <a href="dashboard.html" id="dashboard-link" hidden>Dashboard</a>
                    <a href="blackjack.html" id="blackjack-link" hidden>Blackjack</a>
                    <a href="history.html" id="history-link" hidden>Game History</a>
                    <a href="deposit.html" id="deposit-link" hidden>Redeem Code</a>

                    <button type="button" id="theme-toggle">Theme: Onyx</button>
                    <a href="login.html" id="login-link">Login / Register</a>
                    <button type="button" id="logout-button" hidden>Logout</button>
                </nav>
                <hr>
            `;
        }

        const loggedIn = Boolean(localStorage.getItem("accessToken"));

        const loginLink = document.getElementById("login-link");
        const logoutButton = document.getElementById("logout-button");
        const dashboardLink = document.getElementById("dashboard-link");
        const blackjackLink = document.getElementById("blackjack-link");
        const historyLink = document.getElementById("history-link");
        const depositLink = document.getElementById("deposit-link");
        const themeToggle = document.getElementById("theme-toggle");

        if (loginLink) loginLink.hidden = loggedIn;
        if (logoutButton) {
            logoutButton.hidden = !loggedIn;
            logoutButton.addEventListener("click", logout);
        }

        if (dashboardLink) dashboardLink.hidden = !loggedIn;
        if (blackjackLink) blackjackLink.hidden = !loggedIn;
        if (historyLink) historyLink.hidden = !loggedIn;
        if (depositLink) depositLink.hidden = !loggedIn;

        if (themeToggle) {
            themeToggle.addEventListener("click", toggleTheme);
        }

        applyTheme(getPreferredTheme());
        return;
    }

    const homeContainer = document.getElementById("navbar-container");
    if (homeContainer) {
        homeContainer.innerHTML = `
            <div id="home-toolbar">
                <button type="button" id="theme-toggle"></button>
            </div>
        `;
        const themeToggle = document.getElementById("theme-toggle");
        if (themeToggle) {
            themeToggle.addEventListener("click", toggleTheme);
        }
        applyTheme(getPreferredTheme());
    }
}

async function logout() {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
        if (refreshToken && typeof apiRequest === "function") {
            await apiRequest("/api/auth/logout", {
                method: "POST",
                body: JSON.stringify({ refreshToken })
            });
        }
    } catch (error) {
        console.error("Logout request failed:", error);
    } finally {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        window.location.href = "index.html";
    }
}

document.addEventListener("DOMContentLoaded", loadNavbar);
