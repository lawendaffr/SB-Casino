// Browser-only replacement for the production API client.
// The page scripts remain the same as ../frontend/js/*.js and call this
// apiRequest function with the same endpoint paths and request bodies.
const DEMO_STORAGE_KEY = "sbCasinoMockBackend";
const DEMO_CODES = { "WELCOME500": 500, "LUCKY250": 250 };

function createDemoState() {
    const now = Date.now();
    return {
        user: { id: 1042, username: "DemoPlayer", email: "demo@example.com", balance: 1250 },
        transactions: [
            { id: 9005, type: "GAME_WIN", description: "Blackjack payout", amount: 200, balanceBefore: 1050, balanceAfter: 1250, createdAt: new Date(now - 3600000).toISOString() },
            { id: 9004, type: "GAME_BET", description: "Blackjack bet", amount: 100, balanceBefore: 1150, balanceAfter: 1050, createdAt: new Date(now - 3900000).toISOString() },
            { id: 9003, type: "DEPOSIT", description: "Welcome credits", amount: 500, balanceBefore: 650, balanceAfter: 1150, createdAt: new Date(now - 86400000).toISOString() },
            { id: 9002, type: "GAME_BET", description: "Blackjack bet", amount: 50, balanceBefore: 700, balanceAfter: 650, createdAt: new Date(now - 172800000).toISOString() }
        ],
        games: [
            { id: 781, gameType: "BLACKJACK", status: "COMPLETED", bet: 100, payout: 200, netResult: 100, result: "PLAYER_WIN", createdAt: new Date(now - 3600000).toISOString(), finishedAt: new Date(now - 3480000).toISOString() },
            { id: 780, gameType: "BLACKJACK", status: "COMPLETED", bet: 50, payout: 0, netResult: -50, result: "PLAYER_BUST", createdAt: new Date(now - 86400000).toISOString(), finishedAt: new Date(now - 86200000).toISOString() },
            { id: 779, gameType: "BLACKJACK", status: "COMPLETED", bet: 200, payout: 200, netResult: 0, result: "PUSH", createdAt: new Date(now - 172800000).toISOString(), finishedAt: new Date(now - 171900000).toISOString() },
            { id: 778, gameType: "BLACKJACK", status: "COMPLETED", bet: 75, payout: 150, netResult: 75, result: "PLAYER_WIN", createdAt: new Date(now - 259200000).toISOString(), finishedAt: new Date(now - 259000000).toISOString() },
            { id: 777, gameType: "BLACKJACK", status: "COMPLETED", bet: 25, payout: 0, netResult: -25, result: "DEALER_WIN", createdAt: new Date(now - 345600000).toISOString(), finishedAt: new Date(now - 345400000).toISOString() },
            { id: 776, gameType: "BLACKJACK", status: "COMPLETED", bet: 100, payout: 200, netResult: 100, result: "PLAYER_WIN", createdAt: new Date(now - 432000000).toISOString(), finishedAt: new Date(now - 431800000).toISOString() }
        ],
        activeGame: null,
        redeemedCodes: [],
        loggedOut: false,
        nextGameId: 782,
        nextTransactionId: 9006
    };
}

function loadDemoState() {
    try {
        const saved = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY));
        if (saved && saved.user && Array.isArray(saved.transactions) && Array.isArray(saved.games)) return saved;
    } catch { /* Restore clean sample data below. */ }
    return createDemoState();
}

let demoState = loadDemoState();

function saveDemoState() {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoState));
}

function mockError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function recordTransaction(type, description, amount, balanceBefore, balanceAfter) {
    demoState.transactions.unshift({
        id: demoState.nextTransactionId++, type, description, amount,
        balanceBefore, balanceAfter, createdAt: new Date().toISOString()
    });
}

function cardTotal(cards) {
    let total = 0;
    let aces = 0;
    for (const card of cards) {
        const rank = card.split("-")[0];
        if (rank === "A") { total += 11; aces++; }
        else total += ["K", "Q", "J"].includes(rank) ? 10 : Number(rank);
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function blackjackResponse(game) {
    const active = game.status === "ACTIVE";
    return {
        gameId: game.id,
        status: game.status,
        playerCards: [...game.playerCards],
        dealerCards: active ? game.dealerCards.slice(0, 1) : [...game.dealerCards],
        playerTotal: cardTotal(game.playerCards),
        dealerTotal: active ? null : cardTotal(game.dealerCards),
        bet: game.bet,
        payout: game.payout,
        result: game.result,
        balance: demoState.user.balance
    };
}

function finishBlackjack(game, result, payout) {
    const before = demoState.user.balance;
    game.status = "FINISHED";
    game.result = result;
    game.payout = payout;
    game.finishedAt = new Date().toISOString();
    demoState.user.balance += payout;
    if (payout > 0) recordTransaction("GAME_WIN", "Blackjack payout", payout, before, demoState.user.balance);
    const history = demoState.games.find(item => item.id === game.id);
    Object.assign(history, {
        status: "COMPLETED", payout, netResult: payout - game.bet,
        result, finishedAt: game.finishedAt
    });
    demoState.activeGame = null;
}

function startBlackjack(bet) {
    if (demoState.activeGame) throw mockError(409, "Finish your active Blackjack game before starting another");
    if (!Number.isInteger(bet) || bet < 1 || bet > 1000000) throw mockError(400, "Invalid bet");
    if (bet > demoState.user.balance) throw mockError(400, "Insufficient balance");

    const before = demoState.user.balance;
    demoState.user.balance -= bet;
    recordTransaction("GAME_BET", "Blackjack bet", bet, before, demoState.user.balance);
    const now = new Date().toISOString();
    const game = {
        id: demoState.nextGameId++, status: "ACTIVE", bet, payout: 0, result: "IN_PROGRESS",
        playerCards: ["10-SPADES", "7-HEARTS"], dealerCards: ["10-CLUBS", "6-DIAMONDS"],
        deck: ["2-CLUBS", "4-SPADES", "K-HEARTS", "3-DIAMONDS"],
        createdAt: now, finishedAt: null
    };
    demoState.activeGame = game;
    demoState.games.unshift({
        id: game.id, gameType: "BLACKJACK", status: "ACTIVE", bet,
        payout: 0, netResult: null, result: "IN_PROGRESS", createdAt: now, finishedAt: null
    });
    return blackjackResponse(game);
}

function blackjackAction(gameId, action) {
    const game = demoState.activeGame;
    if (!game || game.id !== Number(gameId)) throw mockError(404, "Game not found");
    if (game.status !== "ACTIVE") throw mockError(409, "This game has already finished");
    if (action === "HIT") {
        game.playerCards.push(game.deck.shift() || "5-HEARTS");
        if (cardTotal(game.playerCards) > 21) finishBlackjack(game, "PLAYER_BUST", 0);
    } else if (action === "STAND") {
        while (cardTotal(game.dealerCards) < 17) game.dealerCards.push(game.deck.shift() || "5-HEARTS");
        const player = cardTotal(game.playerCards), dealer = cardTotal(game.dealerCards);
        if (dealer > 21 || player > dealer) finishBlackjack(game, "PLAYER_WIN", game.bet * 2);
        else if (player === dealer) finishBlackjack(game, "PUSH", game.bet);
        else finishBlackjack(game, "DEALER_WIN", 0);
    } else {
        throw mockError(400, "Action must be HIT or STAND");
    }
    return blackjackResponse(game);
}

async function apiRequest(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};
    let result;

    if (path === "/api/auth/login" && method === "POST") {
        if (!body.username || !body.password) throw mockError(400, "Username and password are required");
        demoState.user.username = body.username;
        demoState.loggedOut = false;
        result = { accessToken: "demo-access-token", refreshToken: "demo-refresh-token" };
    } else if (path === "/api/auth/register" && method === "POST") {
        if (!body.username || !body.password || !body.email) throw mockError(400, "Username, email, and password are required");
        demoState.user = { id: 2000, username: body.username, email: body.email, balance: 1000 };
        demoState.transactions = [];
        demoState.games = [];
        demoState.activeGame = null;
        demoState.redeemedCodes = [];
        demoState.loggedOut = false;
        result = { id: demoState.user.id, username: body.username, email: body.email, balance: demoState.user.balance };
    } else if (path === "/api/auth/logout") {
        demoState.loggedOut = true;
        result = null;
    } else if (path === "/api/auth/refresh") {
        result = { accessToken: "demo-access-token", refreshToken: "demo-refresh-token" };
    } else if (path === "/api/users/me") {
        result = { ...demoState.user };
    } else if (path === "/api/users/me/balance") {
        result = { balance: demoState.user.balance };
    } else if (path === "/api/users/me/transactions") {
        result = demoState.transactions.map(transaction => ({ ...transaction }));
    } else if (path === "/api/games/blackjack/active") {
        if (!demoState.activeGame) throw mockError(404, "No active Blackjack game");
        result = blackjackResponse(demoState.activeGame);
    } else if (path === "/api/games/blackjack/start" && method === "POST") {
        result = startBlackjack(Number(body.bet));
    } else if (path.match(/^\/api\/games\/blackjack\/\d+\/action$/) && method === "POST") {
        const gameId = path.split("/")[4];
        result = blackjackAction(gameId, body.action);
    } else if (path.startsWith("/api/users/me/games")) {
        const query = new URLSearchParams(path.split("?")[1] || "");
        const page = Math.max(0, Number(query.get("page") || 0));
        const size = Math.min(100, Math.max(1, Number(query.get("size") || 20)));
        const games = demoState.games;
        result = {
            games: games.slice(page * size, (page + 1) * size).map(game => ({ ...game })),
            page, size, totalElements: games.length, totalPages: Math.ceil(games.length / size)
        };
    } else if (path === "/api/codes/redeem" && method === "POST") {
        const code = String(body.code || "").trim().toUpperCase();
        if (!code) throw mockError(400, "Code is required");
        if (!Object.hasOwn(DEMO_CODES, code)) throw mockError(404, "Invalid deposit code");
        if (demoState.redeemedCodes.includes(code)) throw mockError(409, "You have already redeemed this code");
        const before = demoState.user.balance;
        const amount = DEMO_CODES[code];
        demoState.user.balance += amount;
        demoState.redeemedCodes.push(code);
        recordTransaction("DEPOSIT", `Deposit code: ${code}`, amount, before, demoState.user.balance);
        result = { code, amount, balance: demoState.user.balance };
    } else {
        throw mockError(404, `No mock response configured for ${method} ${path}`);
    }

    saveDemoState();
    return result;
}

// Start with the sample player signed in so the production navbar exposes
// every player page immediately. Logout still works and stays logged out.
if (!localStorage.getItem("accessToken") && !demoState.loggedOut) {
    localStorage.setItem("accessToken", "demo-access-token");
    localStorage.setItem("refreshToken", "demo-refresh-token");
}
saveDemoState();
