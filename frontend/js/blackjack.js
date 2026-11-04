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

const CARD_SUITS = {
    SPADES: "♠",
    CLUBS: "♣",
    HEARTS: "♥",
    DIAMONDS: "♦"
};
const WINNING_RESULTS = new Set(["PLAYER_WIN", "PLAYER_BLACKJACK"]);

function isWinningResult(result) {
    return WINNING_RESULTS.has(String(result || "").toUpperCase());
}

function celebrateWin(gamePanel) {
    gamePanel.querySelector(".win-celebration")?.remove();
    const celebration = document.createElement("div");
    celebration.className = "win-celebration";
    celebration.setAttribute("aria-hidden", "true");
    const colors = ["#8fffe0", "#7bd4ff", "#ffe17b", "#ff8fb8", "#c9a2ff", "#ffffff"];

    for (let index = 0; index < 28; index++) {
        const piece = document.createElement("i");
        piece.className = "win-confetti";
        piece.style.setProperty("--x", `${Math.random() * 100}%`);
        piece.style.setProperty("--fall", `${950 + Math.random() * 700}ms`);
        piece.style.setProperty("--delay", `${Math.random() * 260}ms`);
        piece.style.setProperty("--drift", `${Math.floor(Math.random() * 120) - 60}px`);
        piece.style.setProperty("--spin", `${Math.floor(Math.random() * 1000) - 500}deg`);
        piece.style.setProperty("--particle-color", colors[index % colors.length]);
        celebration.appendChild(piece);
    }

    gamePanel.appendChild(celebration);
    window.setTimeout(() => celebration.remove(), 2100);
}

function renderCards(container, cards) {
    container.replaceChildren();

    if (!cards || cards.length === 0) {
        const empty = document.createElement("span");
        empty.className = "empty-card-slot";
        empty.textContent = "Cards are dealt here";
        container.appendChild(empty);
        return;
    }

    for (const value of cards) {
        const [rank, suit] = String(value).split("-");
        const symbol = CARD_SUITS[suit] || "•";
        const card = document.createElement("span");
        card.className = `playing-card${suit === "HEARTS" || suit === "DIAMONDS" ? " card-red" : ""}`;
        card.setAttribute("role", "img");
        card.setAttribute("aria-label", `${rank} of ${String(suit || "unknown").toLowerCase()}`);

        const top = document.createElement("span");
        top.className = "card-index";
        top.textContent = rank;

        const center = document.createElement("span");
        center.className = "card-suit";
        center.textContent = symbol;

        const bottom = document.createElement("span");
        bottom.className = "card-index card-index-bottom";
        bottom.textContent = rank;

        card.append(top, center, bottom);
        container.appendChild(card);
    }
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
    document.querySelector(".game-panel .win-celebration")?.remove();

    renderCards(dealerCardsElement, game.dealerCards);
    if (game.status === "ACTIVE") {
        const hiddenCard = document.createElement("span");
        hiddenCard.className = "playing-card card-face-down";
        hiddenCard.setAttribute("aria-label", "Face-down dealer card");
        hiddenCard.textContent = "SB";
        dealerCardsElement.appendChild(hiddenCard);
    }
    dealerTotalElement.textContent = displayTotal(game.dealerTotal);

    renderCards(playerCardsElement, game.playerCards);
    playerTotalElement.textContent = displayTotal(game.playerTotal);

    currentBetElement.textContent = game.bet;
    payoutElement.textContent = game.payout;
    const resultLabels = {
        PLAYER_WIN: "You win",
        PLAYER_BLACKJACK: "Blackjack!",
        DEALER_BLACKJACK: "Dealer blackjack",
        DEALER_WIN: "Dealer wins",
        PLAYER_BUST: "Bust",
        PUSH: "Push",
        IN_PROGRESS: "In progress"
    };
    resultElement.textContent = resultLabels[game.result] || game.result || "-";
    gameBalanceElement.textContent = game.balance;
    balanceElement.textContent = game.balance;
    window.updatePlayerBalance?.(game.balance);

    const active = game.status === "ACTIVE";
    setGameControls(active);

    const outcomeClasses = ["outcome-win", "outcome-loss", "outcome-push"];
    const gamePanel = document.querySelector(".game-panel");
    gamePanel.classList.remove(...outcomeClasses);
    resultElement.classList.remove("amount-positive", "amount-negative", "amount-neutral");
    if (!active) {
        const outcome = String(game.result || "").toUpperCase();
        const won = isWinningResult(outcome);
        const outcomeClass = won
            ? "outcome-win"
            : outcome === "PUSH" ? "outcome-push" : "outcome-loss";
        const amountClass = won
            ? "amount-positive"
            : outcome === "PUSH" ? "amount-neutral" : "amount-negative";
        void gamePanel.offsetWidth;
        gamePanel.classList.add(outcomeClass);
        resultElement.classList.add(amountClass);
        if (won) celebrateWin(gamePanel);
    }

    gameMessage.classList.remove("amount-positive", "amount-negative", "amount-neutral");
    if (active) {
        gameMessage.textContent = "Round in progress. Choose Hit or Stand.";
    } else if (isWinningResult(game.result)) {
        gameMessage.textContent = game.result === "PLAYER_BLACKJACK" ? "Blackjack! You won this round." : "You won this round.";
        gameMessage.classList.add("amount-positive");
    } else if (game.result === "PUSH") {
        gameMessage.textContent = "Push. Your bet is returned.";
        gameMessage.classList.add("amount-neutral");
    } else {
        gameMessage.textContent = "Round lost.";
        gameMessage.classList.add("amount-negative");
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
        window.updatePlayerBalance?.(data.balance);
    } catch (error) {
        balanceElement.textContent = "Unavailable";
    }
}

loadGame();
