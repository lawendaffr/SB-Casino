const usernameElement = document.getElementById("username");
const balanceElement = document.getElementById("balance");
const messageElement = document.getElementById("dashboard-message");

const refreshBalanceButton = document.getElementById("refresh-balance");
const refreshTransactionsButton =
    document.getElementById("refresh-transactions");

const transactionsMessage = document.getElementById("transactions-message");
const transactionsList = document.getElementById("transactions-list");
const gamesPlayedElement = document.getElementById("games-played");
const gamesWonElement = document.getElementById("games-won");
const netResultElement = document.getElementById("net-result");

async function loadProfile() {
    try {
        messageElement.textContent = "Loading profile...";

        const user = await apiRequest("/api/users/me");

        usernameElement.textContent = user.username;
        balanceElement.textContent = user.balance;
        window.updatePlayerBalance?.(user.balance);

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
        window.updatePlayerBalance?.(result.balance);
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
            amountCell.classList.add(difference > 0 ? "amount-positive" : difference < 0 ? "amount-negative" : "amount-neutral");

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

async function loadStatistics() {
    try {
        const stats = await apiRequest("/api/users/me/stats");
        gamesPlayedElement.textContent = Number(stats.gamesPlayed).toLocaleString();
        gamesWonElement.textContent = Number(stats.wins).toLocaleString();
        const net = Number(stats.netResult);
        netResultElement.textContent = `${net > 0 ? "+" : ""}${net.toLocaleString()} credits`;
        netResultElement.classList.toggle("amount-positive", net > 0);
        netResultElement.classList.toggle("amount-negative", net < 0);
        netResultElement.classList.toggle("amount-neutral", net === 0);
    } catch (error) {
        gamesPlayedElement.textContent = "—";
        gamesWonElement.textContent = "—";
        netResultElement.textContent = "Unavailable";
    }
}

refreshBalanceButton.addEventListener("click", loadBalance);
refreshTransactionsButton.addEventListener("click", loadTransactions);

loadProfile();
loadTransactions();
loadStatistics();
