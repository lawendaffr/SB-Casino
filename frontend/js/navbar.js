const THEME_STORAGE_KEY = "sbCasinoTheme";

function getPreferredTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "light" ? "light" : "dark";
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
        toggle.textContent = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
        toggle.setAttribute("aria-pressed", String(theme === "dark"));
    }
}

function toggleTheme() {
    applyTheme(getPreferredTheme() === "dark" ? "light" : "dark");
}

applyTheme(getPreferredTheme());

function updatePageLinks(root = document) {
    root.querySelectorAll('a[href^="/"]').forEach(link => {
        link.href = window.appRoute(link.getAttribute("href"));
    });
}

window.updatePlayerBalance = balanceValue => {
    const balance = document.getElementById("player-balance");
    if (!balance || balance.hidden) return;
    balance.textContent = `${Number(balanceValue).toLocaleString()} credits`;
};

function setMenuOpen(open) {
    const menu = document.getElementById("side-menu");
    const backdrop = document.getElementById("menu-backdrop");
    const toggle = document.getElementById("menu-toggle");
    if (!menu || !backdrop || !toggle) return;

    menu.hidden = !open;
    menu.setAttribute("aria-hidden", String(!open));
    backdrop.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);

    if (open) document.getElementById("menu-close")?.focus();
    else toggle.focus();
}

async function loadPlayerSummary(loggedIn) {
    const name = document.getElementById("player-name");
    const avatar = document.getElementById("player-avatar");
    const balance = document.getElementById("player-balance");
    const profileLink = document.getElementById("player-profile-link");
    if (!name || !avatar || !balance) return;
    if (profileLink) {
        profileLink.href = window.appRoute(loggedIn ? "/dashboard" : "/login");
        profileLink.setAttribute("aria-label", loggedIn ? "Open player dashboard" : "Log in to your account");
    }

    if (!loggedIn) {
        name.textContent = "Guest";
        avatar.textContent = "G";
        balance.hidden = true;
        return;
    }

    name.textContent = "Player";
    try {
        const user = await apiRequest("/api/users/me");
        name.textContent = user.username;
        avatar.textContent = (user.username || "P").slice(0, 1).toUpperCase();
        balance.hidden = false;
        window.updatePlayerBalance(user.balance);
    } catch (error) {
        console.warn("Could not load player summary:", error);
        balance.hidden = true;
    }
}

function bindMenu() {
    const toggle = document.getElementById("menu-toggle");
    const close = document.getElementById("menu-close");
    const backdrop = document.getElementById("menu-backdrop");
    const themeToggle = document.getElementById("theme-toggle");
    const logoutButton = document.getElementById("logout-button");

    toggle?.addEventListener("click", () => setMenuOpen(true));
    close?.addEventListener("click", () => setMenuOpen(false));
    backdrop?.addEventListener("click", () => setMenuOpen(false));
    themeToggle?.addEventListener("click", toggleTheme);
    logoutButton?.addEventListener("click", logout);

    document.querySelectorAll(".side-menu-links a").forEach(link => {
        link.addEventListener("click", () => setMenuOpen(false));
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !document.getElementById("side-menu")?.hidden) {
            setMenuOpen(false);
        }
    });
}

async function loadNavbar() {
    await window.apiReady;
    const navbarContainer = document.getElementById("navbar");
    if (!navbarContainer) return;

    try {
        const response = await fetch("components/navbar.html");
        if (!response.ok) throw new Error("Failed to load navbar");
        navbarContainer.innerHTML = await response.text();
    } catch (error) {
        console.warn("Could not load navbar component:", error);
        navbarContainer.innerHTML = `
            <div class="nav-shell"><nav id="main-navbar" aria-label="Main navigation">
                <a class="nav-home" href="/">SB-Casino</a>
                <div class="player-summary" id="player-summary"><a class="player-profile-link" id="player-profile-link" href="/dashboard" aria-label="Open player dashboard"><span class="player-avatar" id="player-avatar">G</span><span class="player-name" id="player-name">Guest</span></a><span class="player-balance" id="player-balance" hidden></span></div>
                <button class="menu-toggle" id="menu-toggle" type="button" aria-label="Open menu" aria-controls="side-menu" aria-expanded="false"><span></span><span></span><span></span></button>
            </nav><button id="menu-backdrop" class="menu-backdrop" type="button" aria-label="Close menu" hidden></button>
            <aside id="side-menu" class="side-menu" aria-label="Site menu" aria-hidden="true" hidden>
                <div class="side-menu-heading"><div><p class="menu-eyebrow">SB-CASINO</p><h2>Menu</h2></div><button id="menu-close" class="menu-close" type="button" aria-label="Close menu">×</button></div>
                <nav class="side-menu-links"><a href="/games" id="games-link">Games <span>→</span></a><a href="/dashboard" id="dashboard-link">Dashboard <span>→</span></a><a href="/history" id="history-link">Game history <span>→</span></a><a href="/deposit" id="deposit-link">Redeem credits <span>→</span></a><a href="/login" id="login-link">Login / Register <span>→</span></a></nav>
                <div class="side-menu-bottom"><button id="theme-toggle" type="button">Switch to light mode</button><button id="logout-button" class="logout-button" type="button" hidden>Log out</button></div>
            </aside></div>`;
    }

    updatePageLinks(navbarContainer);
    const loggedIn = Boolean(localStorage.getItem("accessToken"));
    document.getElementById("dashboard-link").hidden = !loggedIn;
    document.getElementById("history-link").hidden = !loggedIn;
    document.getElementById("deposit-link").hidden = !loggedIn;
    document.getElementById("login-link").hidden = loggedIn;
    document.getElementById("logout-button").hidden = !loggedIn;

    bindMenu();
    await loadPlayerSummary(loggedIn);
    applyTheme(getPreferredTheme());
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
    } catch (error) {
        console.error("Logout request failed:", error);
    } finally {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = window.appRoute("/");
    }
}

document.addEventListener("DOMContentLoaded", loadNavbar);
