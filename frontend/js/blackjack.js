const startForm = document.getElementById("start-form");
const betInput = document.getElementById("bet");
const startButton = document.getElementById("start-button");

const hitButton = document.getElementById("hit-button");
const standButton = document.getElementById("stand-button");

const gameMessage = document.getElementById("game-message");
const balanceElement = document.getElementById("balance");
const dealerCardsElement = document.getElementById("dealer-cards");
const dealerTotalElement = document.getElementById("dealer-total");
const playerCardsElement = document.getElementById("player-cards");
const playerTotalElement = document.getElementById("player-total");
const currentBetElement = document.getElementById("current-bet");
const payoutElement = document.getElementById("payout");
const resultElement = document.getElementById("result");
const gameBalanceElement = document.getElementById("game-balance");

let currentGameId = null;
let gameActive = false;
let actionInProgress = false;

function displayCards(cards) {
    if (!cards || cards.length === 0) {
        return "-";
    }

    return cards.join(", ");
}

function displayTotal(total) {
    return total === null || total === undefined ? "Hidden" : total;
}

function setGameControls(active) {
    gameActive = active;

    hitButton.disabled = !active;
    standButton.disabled = !active;
    startButton.disabled = active;
    betInput.disabled = active;
}

function displayGame(game) {
    currentGameId = game.gameId;

    dealerCardsElement.textContent = displayCards(game.dealerCards);
    dealerTotalElement.textContent = displayTotal(game.dealerTotal);

    playerCardsElement.textContent = displayCards(game.playerCards);
    playerTotalElement.textContent = displayTotal(game.playerTotal);

    currentBetElement.textContent = game.bet;
    payoutElement.textContent = game.payout;
    resultElement.textContent = game.result;
    gameBalanceElement.textContent = game.balance;
    balanceElement.textContent = game.balance;

    const active = game.status === "ACTIVE";
    setGameControls(active);

    if (active) {
        gameMessage.textContent = "Round in progress. Choose Hit or Stand.";
    } else {
        gameMessage.textContent = "Round finished.";
    }
}

async function startGame(event) {
    event.preventDefault();

    const bet = Number(betInput.value);

    if (!Number.isInteger(bet) || bet < 1 || bet > 1000000) {
        gameMessage.textContent =
            "Enter a whole-number bet between 1 and 1,000,000.";
        return;
    }

    startButton.disabled = true;
    gameMessage.textContent = "Starting round...";

    try {
        const game = await apiRequest("/api/games/blackjack/start", {
            method: "POST",
            body: JSON.stringify({ bet })
        });

        displayGame(game);
    } catch (error) {
        gameMessage.textContent = "Could not start game: " + error.message;
        setGameControls(false);
    } finally {
        startButton.disabled = gameActive;
    }
}

async function performAction(action) {
    if (!currentGameId || !gameActive || actionInProgress) {
        return;
    }

    actionInProgress = true;
    hitButton.disabled = true;
    standButton.disabled = true;
    gameMessage.textContent = "Processing action...";

    try {
        const game = await apiRequest(
            `/api/games/blackjack/${currentGameId}/action`,
            {
                method: "POST",
                body: JSON.stringify({ action })
            }
        );

        displayGame(game);
    } catch (error) {
        gameMessage.textContent = "Action failed: " + error.message;
        setGameControls(gameActive);
    } finally {
        actionInProgress = false;
    }
}

startForm.addEventListener("submit", startGame);

hitButton.addEventListener("click", () => {
    performAction("HIT");
});

standButton.addEventListener("click", () => {
    performAction("STAND");
});

async function loadGame() {
    try {
        const game = await apiRequest("/api/games/blackjack/active");
        displayGame(game);
    } catch (error) {
        // 404 means the player has no active round.
        if (error.status === 404) {
            setGameControls(false);
            gameMessage.textContent = "No active round. Start a new game.";
            await loadBalance();
            return;
        }

        gameMessage.textContent =
            "Could not restore active game: " + error.message;

        await loadBalance();
    }
}

async function loadBalance() {
    try {
        const data = await apiRequest("/api/users/me/balance");
        balanceElement.textContent = data.balance;
    } catch (error) {
        balanceElement.textContent = "Unavailable";
    }
}

loadGame();