import { useEffect, useState } from "react";
import { apiRequest } from "../api.js";

const pageSize = 20;

function resultClass(result) {
  const value = String(result || "").toLowerCase();
  if (value.includes("win") || value.includes("blackjack")) return "amount-positive";
  if (value === "push") return "amount-neutral";
  return "amount-negative";
}

function formatDate(date) {
  return date ? new Date(date).toLocaleString() : "-";
}

export default function HistoryPage() {
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("Loading games...");

  useEffect(() => {
    let current = true;
    setMessage("Loading games...");
    apiRequest(`/api/users/me/games?page=${page}&size=${pageSize}`)
      .then((result) => {
        if (!current) return;
        setData(result);
        setMessage(result.games.length ? "" : "No games found.");
      })
      .catch((error) => {
        if (!current) return;
        setData(null);
        setMessage(`Could not load games: ${error.message}`);
      });
    return () => { current = false; };
  }, [page, refreshKey]);

  const games = data?.games || [];
  const totalPages = data?.totalPages || 0;
  const pageNumber = totalPages === 0 ? 0 : (data?.page ?? page) + 1;

  return <main className="page-main history-page">
    <header className="page-heading history-heading"><div><p className="page-eyebrow">PLAYER AREA</p><h1>Game History</h1></div><button type="button" onClick={() => setRefreshKey((key) => key + 1)}>Refresh</button></header>
    <section className="panel history-panel">
      <p id="games-message" role="status">{message}</p>
      <div className="table-wrap"><table>
        <thead><tr><th>ID</th><th>Game</th><th>Status</th><th>Bet</th><th>Payout</th><th>Net Result</th><th>Result</th><th>Started</th><th>Finished</th></tr></thead>
        <tbody>{games.map((game) => <tr key={game.id}>
          <td>{game.id}</td><td>{game.gameType}</td><td className={`status-${String(game.status).toLowerCase()}`}>{game.status}</td>
          <td>{game.bet}</td><td>{game.payout ?? "-"}</td>
          <td className={typeof game.netResult === "number" ? game.netResult > 0 ? "amount-positive" : game.netResult < 0 ? "amount-negative" : "amount-neutral" : ""}>{game.netResult == null ? "-" : `${game.netResult > 0 ? "+" : ""}${game.netResult}`}</td>
          <td className={game.result ? resultClass(game.result) : ""}>{game.result || "-"}</td>
          <td>{formatDate(game.createdAt)}</td><td>{formatDate(game.finishedAt)}</td>
        </tr>)}</tbody>
      </table></div>
      <div className="history-pagination"><p id="page-info">Page {pageNumber} of {totalPages} | Total games: {data?.totalElements ?? 0}</p>
        <div><button type="button" disabled={page <= 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>
      </div>
    </section>
  </main>;
}
