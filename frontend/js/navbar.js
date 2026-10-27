
async function loadNavbar() {
    const navbarContainer = document.getElementById("navbar");
    if (!navbarContainer) return;

    try {
        const response = await fetch("components/navbar.html");

        if (!response.ok) {
            throw new Error("Failed to load navbar");
        }

        navbarContainer.innerHTML = await response.text();

        const loggedIn = Boolean(localStorage.getItem("accessToken"));

        document.getElementById("login-link").hidden = loggedIn;
        document.getElementById("logout-button").hidden = !loggedIn;

        document.getElementById("dashboard-link").hidden = !loggedIn;
        document.getElementById("blackjack-link").hidden = !loggedIn;
        document.getElementById("history-link").hidden = !loggedIn;
        document.getElementById("deposit-link").hidden = !loggedIn;

        document
            .getElementById("logout-button")
            .addEventListener("click", logout);
    } catch (error) {
        console.error("Navbar error:", error);
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
    } catch (error) {
        console.error("Logout request failed:", error);
    } finally {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        window.location.href = "index.html";
    }
}

document.addEventListener("DOMContentLoaded", loadNavbar);