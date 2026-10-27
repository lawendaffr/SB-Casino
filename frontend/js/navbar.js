
async function loadNavbar() {
    const container = document.getElementById("navbar-container");

    if (!container) return;

    try {
        const response = await fetch("components/navbar.html");

        if (!response.ok) {
            throw new Error("Failed to load navbar");
        }

        container.innerHTML = await response.text();

        const authContainer = document.getElementById("navbar-auth");
        const token = localStorage.getItem("token");

        if (token && authContainer) {
            authContainer.innerHTML = `
                <a href="dashboard.html">My Account</a>
                <button id="logout-button">Logout</button>
            `;

            document.getElementById("logout-button")
                .addEventListener("click", () => {
                    localStorage.removeItem("token");
                    window.location.href = "index.html";
                });
        }
    } catch (error) {
        console.error("Navbar error:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadNavbar);
