// Mock API adapter used by the shared frontend when ?api=mock is selected.
const DEMO_STORAGE_KEY = "sbCasinoMockBackend";
const DEMO_CODES = { "WELCOME500": 500, "LUCKY250": 250 };

function createDemoState() {
    const now = Date.now();
    return {
        user: { id: 1, username: "admin", email: "admin@sbcasino.local", balance: 10000, role: "ADMIN" },
        users: [
            { id: 1, username: "admin", email: "admin@sbcasino.local", balance: 10000, role: "ADMIN", accountStatus: "ACTIVE", suspendedUntil: null },
            { id: 1042, username: "DemoPlayer", email: "demo@example.com", balance: 1250, role: "USER", accountStatus: "ACTIVE", suspendedUntil: null },
            { id: 1043, username: "HighRoller", email: "vip@example.com", balance: 8400, role: "USER", accountStatus: "ACTIVE", suspendedUntil: null },
            { id: 1044, username: "ModAlex", email: "alex@sbcasino.local", balance: 2500, role: "MODERATOR", accountStatus: "ACTIVE", suspendedUntil: null }
        ],
        codes: [
            { code: "WELCOME500", amount: 500, redemptionPolicy: "ONCE_PER_USER", maxUses: null, expiresAt: null, active: true, createdAt: new Date(now - 86400000 * 3).toISOString(), usedCount: 2 },
            { code: "LUCKY250", amount: 250, redemptionPolicy: "LIMITED_USES", maxUses: 50, expiresAt: null, active: true, createdAt: new Date(now - 86400000).toISOString(), usedCount: 5 }
        ],
        gameCatalog: [
            { gameType: "BLACKJACK", enabled: true, maxBet: 1000000, updatedAt: new Date(now - 86400000).toISOString() }
        ],
        userReports: [
            { id: 1, reporterUserId: 1042, reporterUsername: "DemoPlayer", targetUserId: 1043, targetUsername: "HighRoller", reason: "Suspicious betting pattern in lobby", status: "OPEN", createdAt: new Date(now - 7200000).toISOString() }
        ],
        moderationActions: [],
        notifications: [
            { id: 1, targetUserId: null, actorUsername: "SB-Casino", category: "NEWS", title: "Welcome to SB-Casino!", message: "Check out Blackjack in the Lobby and redeem giftcodes on the Redeem Credits page.", read: false, createdAt: new Date(now - 3600000).toISOString() }
        ],
        auditLogs: [
            { id: 1, actorUserId: 1, actorUsername: "admin", action: "CODE_CREATED", targetType: "DEPOSIT_CODE", targetId: "WELCOME500", details: "amount=500; policy=ONCE_PER_USER", createdAt: new Date(now - 86400000 * 3).toISOString() }
        ],
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
        nextTransactionId: 9006,
        nextUserId: 1045,
        nextAuditId: 2,
        nextModActionId: 1
    };
}

function loadDemoState() {
    try {
        const saved = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY));
        if (saved && saved.user && Array.isArray(saved.users) && Array.isArray(saved.transactions) && Array.isArray(saved.games)) return saved;
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

export async function apiRequest(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};
    let result;

    if (path === "/api/auth/login" && method === "POST") {
        if (!body.username || !body.password) throw mockError(400, "Username and password are required");
        const found = demoState.users.find(u => u.username.toLowerCase() === String(body.username).toLowerCase());
        if (found) {
            if (found.accountStatus === "BANNED") throw mockError(403, "Account is banned");
            demoState.user = { ...found };
        } else {
            const role = String(body.username).toLowerCase() === "admin" ? "ADMIN" : "USER";
            demoState.user = { id: demoState.nextUserId++, username: body.username, email: `${body.username}@example.com`, balance: 1000, role, accountStatus: "ACTIVE", suspendedUntil: null };
            demoState.users.push({ ...demoState.user });
        }
        demoState.loggedOut = false;
        result = { accessToken: "demo-access-token", refreshToken: "demo-refresh-token" };
    } else if (path === "/api/auth/register" && method === "POST") {
        if (!body.username || !body.password || !body.email) throw mockError(400, "Username, email, and password are required");
        const newUser = { id: demoState.nextUserId++, username: body.username, email: body.email, balance: 1000, role: "USER", accountStatus: "ACTIVE", suspendedUntil: null };
        demoState.users.push(newUser);
        demoState.user = { ...newUser };
        demoState.transactions = [];
        demoState.games = [];
        demoState.activeGame = null;
        demoState.redeemedCodes = [];
        demoState.loggedOut = false;
        result = { id: demoState.user.id, username: body.username, email: body.email, balance: demoState.user.balance, role: demoState.user.role };
    } else if (path === "/api/auth/logout") {
        demoState.loggedOut = true;
        result = null;
    } else if (path === "/api/auth/refresh") {
        result = { accessToken: "demo-access-token", refreshToken: "demo-refresh-token" };
    } else if (path === "/api/users/me") {
        result = { ...demoState.user, role: demoState.user.role || "ADMIN" };
    } else if (path === "/api/users/me/balance") {
        result = { balance: demoState.user.balance };
    } else if (path === "/api/users/me/transactions") {
        result = demoState.transactions.map(transaction => ({ ...transaction }));
    } else if (path === "/api/users/me/stats") {
        const completed = demoState.games.filter(game => game.status === "COMPLETED");
        const wins = completed.filter(game => game.result === "PLAYER_WIN" || game.result === "PLAYER_BLACKJACK").length;
        const pushes = completed.filter(game => game.result === "PUSH").length;
        result = {
            gamesPlayed: completed.length,
            wins,
            losses: completed.length - wins - pushes,
            pushes,
            totalBet: completed.reduce((sum, game) => sum + Number(game.bet || 0), 0),
            totalPayout: completed.reduce((sum, game) => sum + Number(game.payout || 0), 0),
            netResult: completed.reduce((sum, game) => sum + Number(game.netResult || 0), 0)
        };
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
        const foundCode = demoState.codes.find(c => c.code === code);
        const amount = foundCode ? foundCode.amount : DEMO_CODES[code];
        if (!amount || (foundCode && !foundCode.active)) throw mockError(404, "Invalid deposit code");
        if (demoState.redeemedCodes.includes(code)) throw mockError(409, "You have already redeemed this code");
        const before = demoState.user.balance;
        demoState.user.balance += amount;
        const u = demoState.users.find(item => item.id === demoState.user.id);
        if (u) u.balance = demoState.user.balance;
        if (foundCode) foundCode.usedCount = (foundCode.usedCount || 0) + 1;
        demoState.redeemedCodes.push(code);
        recordTransaction("DEPOSIT", `Deposit code: ${code}`, amount, before, demoState.user.balance);
        result = { code, amount, balance: demoState.user.balance };
    } else if (path === "/api/moderation/reports" && method === "GET") {
        const completed = demoState.games.filter(g => g.status === "COMPLETED");
        const totalBets = completed.reduce((s, g) => s + Number(g.bet || 0), 0);
        const totalPayouts = completed.reduce((s, g) => s + Number(g.payout || 0), 0);
        result = {
            users: demoState.users.length,
            activeGames: demoState.activeGame ? 1 : 0,
            completedGames: completed.length,
            totalBets,
            totalPayouts,
            netResult: totalPayouts - totalBets
        };
    } else if ((path.startsWith("/api/admin/users") || path.startsWith("/api/moderation/users")) && method === "GET" && !path.includes("/actions")) {
        const query = new URLSearchParams(path.split("?")[1] || "");
        const q = (query.get("q") || "").trim().toLowerCase();
        const page = Math.max(0, Number(query.get("page") || 0));
        const size = Math.min(100, Math.max(1, Number(query.get("size") || 20)));
        const filtered = q ? demoState.users.filter(u => u.username.toLowerCase().includes(q)) : demoState.users;
        result = {
            users: filtered.slice(page * size, (page + 1) * size).map(u => ({ ...u })),
            page,
            pageSize: size,
            totalElements: filtered.length,
            totalPages: Math.max(1, Math.ceil(filtered.length / size))
        };
    } else if (path === "/api/admin/users" && method === "POST") {
        if (!body.username || !body.password) throw mockError(400, "Username and password required");
        if (demoState.users.some(u => u.username.toLowerCase() === String(body.username).toLowerCase())) {
            throw mockError(409, "Username is already in use");
        }
        const created = {
            id: demoState.nextUserId++,
            username: body.username,
            email: body.email || null,
            balance: body.balance ?? 1000,
            role: body.role || "ADMIN",
            accountStatus: "ACTIVE",
            suspendedUntil: null
        };
        demoState.users.push(created);
        demoState.auditLogs.unshift({
            id: demoState.nextAuditId++,
            actorUserId: demoState.user.id,
            actorUsername: demoState.user.username,
            action: "USER_CREATED",
            targetType: "USER",
            targetId: String(created.id),
            details: `username=${created.username}; role=${created.role}; balance=${created.balance}`,
            createdAt: new Date().toISOString()
        });
        result = { ...created };
    } else if (path.match(/^\/api\/admin\/users\/\d+\/balance$/) && method === "PATCH") {
        const targetId = Number(path.split("/")[4]);
        const target = demoState.users.find(u => u.id === targetId);
        if (!target) throw mockError(404, "User not found");
        const amount = Number(body.amount);
        if (!amount || target.balance + amount < 0) throw mockError(400, "Invalid balance adjustment");
        target.balance += amount;
        if (demoState.user.id === target.id) demoState.user.balance = target.balance;
        demoState.notifications = demoState.notifications || [];
        demoState.notifications.unshift({
            id: Date.now(),
            targetUserId: target.id,
            actorUsername: demoState.user.username,
            category: "BALANCE",
            title: amount > 0 ? "Credits Added by Admin" : "Credits Deducted by Admin",
            message: `${amount > 0 ? `+${amount}` : amount} credits (${body.reason || "Admin balance adjustment"}). New balance: ${target.balance} credits.`,
            read: false,
            createdAt: new Date().toISOString()
        });
        demoState.auditLogs.unshift({
            id: demoState.nextAuditId++,
            actorUserId: demoState.user.id,
            actorUsername: demoState.user.username,
            action: "BALANCE_ADJUSTMENT",
            targetType: "USER",
            targetId: String(target.id),
            details: `amount=${amount}; reason=${body.reason || "Admin balance adjustment"}`,
            createdAt: new Date().toISOString()
        });
        result = { ...target };
    } else if (path.match(/^\/api\/admin\/users\/\d+\/role$/) && method === "PATCH") {
        const targetId = Number(path.split("/")[4]);
        const target = demoState.users.find(u => u.id === targetId);
        if (!target) throw mockError(404, "User not found");
        target.role = body.role;
        if (demoState.user.id === target.id) demoState.user.role = target.role;
        demoState.auditLogs.unshift({
            id: demoState.nextAuditId++,
            actorUserId: demoState.user.id,
            actorUsername: demoState.user.username,
            action: "ROLE_CHANGED",
            targetType: "USER",
            targetId: String(target.id),
            details: `newRole=${body.role}`,
            createdAt: new Date().toISOString()
        });
        result = { ...target };
    } else if (path.match(/^\/api\/admin\/users\/\d+\/password$/) && method === "PATCH") {
        const targetId = Number(path.split("/")[4]);
        const target = demoState.users.find(u => u.id === targetId);
        if (!target) throw mockError(404, "User not found");
        demoState.auditLogs.unshift({
            id: demoState.nextAuditId++,
            actorUserId: demoState.user.id,
            actorUsername: demoState.user.username,
            action: "PASSWORD_RESET",
            targetType: "USER",
            targetId: String(target.id),
            details: "Password changed by admin",
            createdAt: new Date().toISOString()
        });
        result = { ...target };
    } else if (path.match(/^\/api\/moderation\/users\/\d+\/(ban|unban|timeout|warn)$/) && method === "POST") {
        const parts = path.split("/");
        const targetId = Number(parts[4]);
        const act = parts[5].toUpperCase();
        const target = demoState.users.find(u => u.id === targetId);
        if (!target) throw mockError(404, "User not found");
        let expiresAt = null;
        if (act === "BAN") {
            target.accountStatus = "BANNED";
            target.suspendedUntil = null;
        } else if (act === "UNBAN") {
            target.accountStatus = "ACTIVE";
            target.suspendedUntil = null;
        } else if (act === "TIMEOUT") {
            expiresAt = new Date(Date.now() + Number(body.hours || 24) * 3600000).toISOString();
            target.suspendedUntil = expiresAt;
        }
        const entry = {
            id: demoState.nextModActionId++,
            actorUserId: demoState.user.id,
            actorUsername: demoState.user.username,
            targetUserId: target.id,
            targetUsername: target.username,
            action: act === "WARN" ? "WARNING" : act,
            reason: body.reason || "Administrative action",
            expiresAt,
            createdAt: new Date().toISOString()
        };
        demoState.moderationActions.unshift(entry);
        if (entry.action === "WARNING" || entry.action === "TIMEOUT" || entry.action === "UNBAN") {
            demoState.notifications = demoState.notifications || [];
            demoState.notifications.unshift({
                id: Date.now(),
                targetUserId: target.id,
                actorUsername: demoState.user.username,
                category: entry.action === "UNBAN" ? "SYSTEM" : "WARNING",
                title: entry.action === "WARNING" ? "Official Moderator Warning" : entry.action === "TIMEOUT" ? "Account Timed Out" : "Account Restrictions Lifted",
                message: entry.reason,
                read: false,
                createdAt: entry.createdAt
            });
        }
        demoState.auditLogs.unshift({
            id: demoState.nextAuditId++,
            actorUserId: demoState.user.id,
            actorUsername: demoState.user.username,
            action: `MODERATION_${entry.action}`,
            targetType: "USER",
            targetId: String(target.id),
            details: entry.reason,
            createdAt: entry.createdAt
        });
        result = entry;
    } else if (path.match(/^\/api\/moderation\/users\/\d+\/actions/) && method === "GET") {
        const targetId = Number(path.split("/")[4]);
        const acts = demoState.moderationActions.filter(a => a.targetUserId === targetId);
        result = { actions: acts, page: 0, pageSize: 20, totalElements: acts.length, totalPages: 1 };
    } else if (path.startsWith("/api/admin/codes") && method === "GET") {
        result = {
            codes: demoState.codes.map(c => ({ ...c })),
            page: 0,
            pageSize: 20,
            totalElements: demoState.codes.length,
            totalPages: 1
        };
    } else if (path === "/api/admin/codes" && method === "POST") {
        const codeStr = body.code ? String(body.code).trim().toUpperCase() : `CAS-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        const created = {
            code: codeStr,
            amount: Number(body.amount),
            redemptionPolicy: body.redemptionPolicy || "ONCE_PER_USER",
            maxUses: body.redemptionPolicy === "ONCE_TOTAL" ? 1 : (body.maxUses ?? null),
            expiresAt: body.expiresAt || null,
            active: true,
            createdAt: new Date().toISOString(),
            usedCount: 0
        };
        demoState.codes.unshift(created);
        demoState.auditLogs.unshift({
            id: demoState.nextAuditId++,
            actorUserId: demoState.user.id,
            actorUsername: demoState.user.username,
            action: "CODE_CREATED",
            targetType: "DEPOSIT_CODE",
            targetId: created.code,
            details: `amount=${created.amount}; policy=${created.redemptionPolicy}`,
            createdAt: created.createdAt
        });
        result = { ...created };
    } else if (path.match(/^\/api\/admin\/codes\/[^/]+\/deactivate$/) && method === "POST") {
        const codeStr = decodeURIComponent(path.split("/")[4]);
        const target = demoState.codes.find(c => c.code === codeStr);
        if (!target) throw mockError(404, "Code not found");
        target.active = false;
        result = { ...target };
    } else if (path === "/api/admin/games" && method === "GET") {
        result = demoState.gameCatalog.map(g => ({ ...g }));
    } else if (path.startsWith("/api/admin/games/") && method === "PATCH") {
        const gameType = decodeURIComponent(path.split("/")[4]).toUpperCase();
        const game = demoState.gameCatalog.find(g => g.gameType === gameType);
        if (!game) throw mockError(404, "Game not found");
        game.enabled = Boolean(body.enabled);
        game.maxBet = Number(body.maxBet);
        game.updatedAt = new Date().toISOString();
        result = { ...game };
    } else if (path.startsWith("/api/moderation/user-reports") && method === "GET") {
        const query = new URLSearchParams(path.split("?")[1] || "");
        const status = query.get("status") || "OPEN";
        const filtered = demoState.userReports.filter(r => r.status === status);
        result = { reports: filtered, page: 0, pageSize: 20, totalElements: filtered.length, totalPages: 1 };
    } else if (path.match(/^\/api\/moderation\/user-reports\/\d+$/) && method === "PATCH") {
        const reportId = Number(path.split("/")[4]);
        const report = demoState.userReports.find(r => r.id === reportId);
        if (!report) throw mockError(404, "Report not found");
        report.status = body.status;
        result = { ...report };
    } else if (path.startsWith("/api/users/me/notifications") && method === "GET") {
        const list = (demoState.notifications || []).filter(n => n.targetUserId == null || n.targetUserId === demoState.user.id);
        const unreadCount = list.filter(n => !n.read).length;
        const unreadWarningsCount = list.filter(n => !n.read && n.category === "WARNING").length;
        result = { notifications: list, unreadCount, unreadWarningsCount };
    } else if (path.match(/^\/api\/users\/me\/notifications\/\d+\/read$/) && method === "POST") {
        const id = Number(path.split("/")[5]);
        const item = (demoState.notifications || []).find(n => n.id === id);
        if (item) item.read = true;
        result = null;
    } else if (path === "/api/users/me/notifications/read-all" && method === "POST") {
        for (const n of (demoState.notifications || [])) {
            if (n.targetUserId == null || n.targetUserId === demoState.user.id) n.read = true;
        }
        result = null;
    } else if (path.startsWith("/api/moderation/notifications") && method === "GET") {
        const list = demoState.notifications || [];
        result = { notifications: list, page: 0, pageSize: 20, totalElements: list.length, totalPages: 1 };
    } else if (path === "/api/moderation/notifications" && method === "POST") {
        demoState.notifications = demoState.notifications || [];
        const created = {
            id: Date.now(),
            targetUserId: body.targetUserId ?? null,
            actorUsername: demoState.user.username,
            category: body.category || "NEWS",
            title: body.title,
            message: body.message,
            read: false,
            createdAt: new Date().toISOString()
        };
        demoState.notifications.unshift(created);
        result = created;
    } else if (path.match(/^\/api\/moderation\/notifications\/\d+$/) && method === "DELETE") {
        const id = Number(path.split("/")[4]);
        demoState.notifications = (demoState.notifications || []).filter(n => n.id !== id);
        result = null;
    } else if (path.startsWith("/api/moderation/games/active") && method === "GET") {
        const toSpectated = (g, isActive) => ({
            gameId: g.id,
            gameType: "BLACKJACK",
            userId: demoState.user.id,
            username: demoState.user.username,
            playerBalance: demoState.user.balance,
            status: isActive ? "ACTIVE" : "FINISHED",
            playerCards: g.playerCards || ["10-SPADES", "8-HEARTS"],
            playerTotal: g.playerCards ? cardTotal(g.playerCards) : 18,
            dealerVisibleCards: g.dealerCards ? g.dealerCards.slice(0, 1) : ["9-CLUBS"],
            dealerAllCards: g.dealerCards || ["9-CLUBS", "8-DIAMONDS"],
            dealerVisibleTotal: g.dealerCards ? cardTotal(g.dealerCards.slice(0, 1)) : 9,
            dealerActualTotal: g.dealerCards ? cardTotal(g.dealerCards) : 17,
            remainingDeckCount: g.deck ? g.deck.length : 48,
            bet: g.bet,
            payout: g.payout || 0,
            result: g.result,
            createdAt: g.createdAt,
            finishedAt: g.finishedAt
        });
        const activeGames = demoState.activeGame ? [toSpectated(demoState.activeGame, true)] : [];
        const recentGames = demoState.games.filter(g => g.status === "COMPLETED").slice(0, 12).map(g => toSpectated(g, false));
        result = { activeGames, recentGames };
    } else if (path.match(/^\/api\/moderation\/games\/(blackjack|users)\/\d+$/) && method === "GET") {
        const g = demoState.activeGame || demoState.games[0];
        if (!g) throw mockError(404, "Game not found");
        const isActive = g.status === "ACTIVE";
        result = {
            gameId: g.id,
            gameType: "BLACKJACK",
            userId: demoState.user.id,
            username: demoState.user.username,
            playerBalance: demoState.user.balance,
            status: isActive ? "ACTIVE" : "FINISHED",
            playerCards: g.playerCards || ["10-SPADES", "8-HEARTS"],
            playerTotal: g.playerCards ? cardTotal(g.playerCards) : 18,
            dealerVisibleCards: g.dealerCards ? g.dealerCards.slice(0, 1) : ["9-CLUBS"],
            dealerAllCards: g.dealerCards || ["9-CLUBS", "8-DIAMONDS"],
            dealerVisibleTotal: g.dealerCards ? cardTotal(g.dealerCards.slice(0, 1)) : 9,
            dealerActualTotal: g.dealerCards ? cardTotal(g.dealerCards) : 17,
            remainingDeckCount: g.deck ? g.deck.length : 48,
            bet: g.bet,
            payout: g.payout || 0,
            result: g.result,
            createdAt: g.createdAt,
            finishedAt: g.finishedAt
        };
    } else if (path.startsWith("/api/admin/logs") && method === "GET") {
        result = {
            logs: demoState.auditLogs.map(l => ({ ...l })),
            page: 0,
            pageSize: 20,
            totalElements: demoState.auditLogs.length,
            totalPages: 1
        };
    } else {
        throw mockError(404, `No mock response configured for ${method} ${path}`);
    }

    saveDemoState();
    return result;
}

export function initialize() {
    // Sign in the sample player so the main navbar exposes player pages.
    if (!localStorage.getItem("accessToken") && !demoState.loggedOut) {
        localStorage.setItem("accessToken", "demo-access-token");
        localStorage.setItem("refreshToken", "demo-refresh-token");
    }
    saveDemoState();
}
