
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authMessage = document.getElementById("auth-message");

document.getElementById("show-login").addEventListener("click", () => {
    loginForm.hidden = false;
    registerForm.hidden = true;
    authMessage.textContent = "";
});

document.getElementById("show-register").addEventListener("click", () => {
    loginForm.hidden = true;
    registerForm.hidden = false;
    authMessage.textContent = "";
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    try {
        authMessage.textContent = "Logging in...";

        const result = await apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });

        localStorage.setItem("accessToken", result.accessToken);
        localStorage.setItem("refreshToken", result.refreshToken);

        window.location.href = "/dashboard";
    } catch (error) {
        authMessage.textContent = error.message;
    }
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("register-username").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    try {
        authMessage.textContent = "Creating account...";

        const result = await apiRequest("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ username, email, password })
        });

        authMessage.textContent =
            `Account created! Welcome, ${result.username}. You can now log in.`;

        registerForm.reset();
        loginForm.reset();

        registerForm.hidden = true;
        loginForm.hidden = false;

        document.getElementById("login-username").value = username;
    } catch (error) {
        authMessage.textContent = error.message;
    }
});
