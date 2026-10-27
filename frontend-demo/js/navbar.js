function loadNavbar() {
    const navbarContainer = document.getElementById("navbar");
    if (!navbarContainer) return;

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

            <a href="login.html" id="login-link">Login / Register</a>
            <button type="button" id="logout-button" hidden>Logout</button>
        </nav>
        <hr>
    `;

    const loggedIn = Boolean(localStorage.getItem("accessToken"));
    document.getElementById("login-link").hidden = loggedIn;
    document.getElementById("logout-button").hidden = !loggedIn;
    document.getElementById("logout-button").addEventListener("click", logout);
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
