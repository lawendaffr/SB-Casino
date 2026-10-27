const gamesList = document.getElementById("games-list");
const gamesMessage = document.getElementById("games-message");
const pageInfo = document.getElementById("page-info");

const previousButton = document.getElementById("previous-page");
const nextButton = document.getElementById("next-page");
const refreshButton = document.getElementById("refresh-games");

let currentPage = 0;
const pageSize = 20;
let totalPages = 0;

function formatDate(date) {
    if (!date) {
        return "-";
    }

    return new Date(date).toLocaleString();
}

async function loadGames() {
    gamesMessage.textContent = "Loading games...";
    gamesList.replaceChildren();

    previousButton.disabled = true;
    nextButton.disabled = true;

    try {
        const data = await apiRequest(
            `/api/users/me/games?page=${currentPage}&size=${pageSize}`
        );

        totalPages = data.totalPages;

        if (data.games.length === 0) {
            gamesMessage.textContent = "No games found.";
        } else {
            gamesMessage.textContent = "";

            for (const game of data.games) {
                const row = document.createElement("tr");

                const values = [
                    game.id,
                    game.gameType,
                    game.status,
                    game.bet,
                    game.payout ?? "-",
                    game.netResult ?? "-",
                    game.result ?? "-",
                    formatDate(game.createdAt),
                    formatDate(game.finishedAt)
                ];

                for (const value of values) {
                    const cell = document.createElement("td");
                    cell.textContent = value;
                    row.appendChild(cell);
                }

                gamesList.appendChild(row);
            }
        }

        pageInfo.textContent =
            `Page ${data.totalPages === 0 ? 0 : data.page + 1} of ${data.totalPages} ` +
            `| Total games: ${data.totalElements}`;

        previousButton.disabled = currentPage <= 0;
        nextButton.disabled =
            currentPage + 1 >= totalPages;

    } catch (error) {
        gamesMessage.textContent =
            "Could not load games: " + error.message;

        pageInfo.textContent = "";
    }
}

previousButton.addEventListener("click", () => {
    if (currentPage > 0) {
        currentPage--;
        loadGames();
    }
});

nextButton.addEventListener("click", () => {
    if (currentPage + 1 < totalPages) {
        currentPage++;
        loadGames();
    }
});

refreshButton.addEventListener("click", loadGames);

loadGames();
