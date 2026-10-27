const userIdElement = document.getElementById("user-id");
const usernameElement = document.getElementById("username");
const balanceElement = document.getElementById("balance");
const messageElement = document.getElementById("dashboard-message");

const refreshBalanceButton = document.getElementById("refresh-balance");
const refreshTransactionsButton =
    document.getElementById("refresh-transactions");

const transactionsMessage = document.getElementById("transactions-message");
const transactionsList = document.getElementById("transactions-list");

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

function getTransactionLabel(type) {
    const labels = {
        DEPOSIT: "Deposit",
        GAME_BET: "Game bet",
        GAME_PAYOUT: "Game winnings",
        GAME_WIN: "Game winnings",
        REFUND: "Refund",
        CODE_REDEMPTION: "Redeemed code"
    };

    return labels[type] || type.replaceAll("_", " ");
}

async function loadTransactions() {
    try {
        transactionsMessage.textContent = "Loading activity...";
        transactionsList.replaceChildren();

        const transactions =
            await apiRequest("/api/users/me/transactions");

        if (!Array.isArray(transactions) || transactions.length === 0) {
            transactionsMessage.textContent = "No activity yet.";
            return;
        }

        transactionsMessage.textContent = "";

        for (const transaction of transactions) {
            const row = document.createElement("tr");

            const typeCell = document.createElement("td");
            typeCell.textContent = getTransactionLabel(transaction.type);

            const descriptionCell = document.createElement("td");
            descriptionCell.textContent = transaction.description || "-";

            const dateCell = document.createElement("td");
            dateCell.textContent = transaction.createdAt
                ? new Date(transaction.createdAt).toLocaleString()
                : "-";

            const amountCell = document.createElement("td");

            const difference =
                transaction.balanceAfter - transaction.balanceBefore;

            const sign = difference > 0 ? "+" : difference < 0 ? "-" : "";
            amountCell.textContent = `${sign}${transaction.amount} credits`;

            row.appendChild(typeCell);
            row.appendChild(descriptionCell);
            row.appendChild(dateCell);
            row.appendChild(amountCell);

            transactionsList.appendChild(row);
        }
    } catch (error) {
        transactionsMessage.textContent =
            "Could not load activity: " + error.message;
    }
}

refreshBalanceButton.addEventListener("click", loadBalance);
refreshTransactionsButton.addEventListener("click", loadTransactions);

loadProfile();
loadTransactions();