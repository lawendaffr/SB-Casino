const balanceElement = document.getElementById("balance");
const refreshBalanceButton = document.getElementById("refresh-balance");

const redeemForm = document.getElementById("redeem-form");
const codeInput = document.getElementById("code");
const redeemButton = document.getElementById("redeem-button");
const redeemMessage = document.getElementById("redeem-message");

async function loadBalance() {
    try {
        const data = await apiRequest("/api/users/me/balance");
        balanceElement.textContent = data.balance;
    } catch (error) {
        balanceElement.textContent = "Unavailable";
    }
}

function getRedemptionError(error) {
    if (error.status === 404) {
        return "This code does not exist.";
    }

    if (error.status === 409) {
        return "You have already redeemed this code, or its usage limit has been reached.";
    }

    if (error.status === 400) {
        return "This code is invalid, inactive, or expired.";
    }

    if (error.status === 401) {
        return "Your session has expired. Please log in again.";
    }

    return "Could not redeem code: " + error.message;
}

async function redeemCode(event) {
    event.preventDefault();

    const code = codeInput.value.trim();

    if (!code) {
        redeemMessage.textContent = "Enter a redemption code.";
        return;
    }

    redeemButton.disabled = true;
    redeemMessage.textContent = "Redeeming code...";

    try {
        const result = await apiRequest("/api/codes/redeem", {
            method: "POST",
            body: JSON.stringify({ code })
        });

        balanceElement.textContent = result.balance;

        redeemMessage.textContent =
            `Success! ${result.amount} credits added. ` +
            `Your new balance is ${result.balance} credits.`;

        codeInput.value = "";
    } catch (error) {
        redeemMessage.textContent = getRedemptionError(error);
    } finally {
        redeemButton.disabled = false;
    }
}

redeemForm.addEventListener("submit", redeemCode);
refreshBalanceButton.addEventListener("click", loadBalance);

loadBalance();