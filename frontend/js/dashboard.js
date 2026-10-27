const userIdElement = document.getElementById("user-id");
const usernameElement = document.getElementById("username");
const balanceElement = document.getElementById("balance");
const messageElement = document.getElementById("dashboard-message");
const refreshBalanceButton = document.getElementById("refresh-balance");

async function loadProfile() {
    try {
        messageElement.textContent = "Loading profile...";

        const user = await apiRequest("/api/users/me");

        userIdElement.textContent = user.id;
        usernameElement.textContent = user.username;
        balanceElement.textContent = user.balance;

        messageElement.textContent = "";
    } catch (error) {
        messageElement.textContent =
            "Could not load profile: " + error.message;
    }
}

async function loadBalance() {
    try {
        const result = await apiRequest("/api/users/me/balance");

        balanceElement.textContent = result.balance;
        messageElement.textContent = "";
    } catch (error) {
        messageElement.textContent =
            "Could not refresh balance: " + error.message;
    }
}

refreshBalanceButton.addEventListener("click", loadBalance);

loadProfile();