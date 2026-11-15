import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api.js";
import { useApp } from "../AppContext.jsx";

function transactionLabel(type) {
  const labels = { DEPOSIT: "Deposit", GAME_BET: "Game bet", GAME_PAYOUT: "Game winnings", GAME_WIN: "Game winnings", REFUND: "Refund", CODE_REDEMPTION: "Redeemed code" };
  return labels[type] || type.replaceAll("_", " ");
}

export default function DashboardPage() {
  const { user, balance, refreshUser, refreshBalance } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [activityMessage, setActivityMessage] = useState("Loading activity...");
  const [message, setMessage] = useState("");

  const loadTransactions = useCallback(async () => {
    setActivityMessage("Loading activity...");
    try {
      const result = await apiRequest("/api/users/me/transactions");
      setTransactions(Array.isArray(result) ? result : []);
      setActivityMessage(result?.length ? "" : "No activity yet.");
    } catch (error) {
      setTransactions([]);
      setActivityMessage(`Could not load activity: ${error.message}`);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await apiRequest("/api/users/me/stats"));
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    if (!user) refreshUser().catch((error) => setMessage(`Could not load profile: ${error.message}`));
    loadTransactions();
    loadStats();
  }, []);

  async function reloadBalance() {
    setMessage("");
    try { await refreshBalance(); }
    catch (error) { setMessage(`Could not refresh balance: ${error.message}`); }
  }

  const net = stats ? Number(stats.netResult) : 0;

  return <main className="page-main dashboard-page">
    <header className="page-heading"><p className="page-eyebrow">PLAYER AREA</p><h1>Dashboard</h1></header>
    <div className="dashboard-grid">
      <div className="dashboard-side-column">
        <section className="panel dashboard-profile">
          <header className="panel-heading"><h2>Your Profile</h2><button type="button" onClick={reloadBalance}>Refresh</button></header>
          <dl className="profile-details">
            <div><dt>Username</dt><dd>{user?.username || "Loading..."}</dd></div>
            <div className="profile-balance"><dt>Balance</dt><dd>{balance == null ? "Loading..." : Number(balance).toLocaleString()} <small>credits</small></dd></div>
          </dl>
        </section>
        <section className="panel dashboard-stats" aria-labelledby="stats-heading">
          <header className="panel-heading"><h2 id="stats-heading">Your play</h2><Link className="dashboard-games-link" to="/games">Browse games <span aria-hidden="true">↗</span></Link></header>
          <div className="stat-grid">
            <div><span>Games played</span><strong>{stats ? Number(stats.gamesPlayed).toLocaleString() : "—"}</strong></div>
            <div><span>Wins</span><strong>{stats ? Number(stats.wins).toLocaleString() : "—"}</strong></div>
            <div><span>Net result</span><strong className={stats ? net > 0 ? "amount-positive" : net < 0 ? "amount-negative" : "amount-neutral" : ""}>{stats ? `${net > 0 ? "+" : ""}${net.toLocaleString()} credits` : "Unavailable"}</strong></div>
          </div>
        </section>
      </div>
      <section className="panel dashboard-activity">
        <header className="panel-heading"><h2>Recent Activity</h2><button type="button" onClick={loadTransactions}>Refresh</button></header>
        <p id="transactions-message" role="status">{activityMessage}</p>
        <div className="table-wrap"><table>
          <thead><tr><th>Type</th><th>Description</th><th>Date</th><th>Amount</th></tr></thead>
          <tbody>{transactions.map((transaction) => {
            const difference = transaction.balanceAfter - transaction.balanceBefore;
            const amountClass = difference > 0 ? "amount-positive" : difference < 0 ? "amount-negative" : "amount-neutral";
            return <tr key={transaction.id}>
              <td>{transactionLabel(transaction.type)}</td><td>{transaction.description || "-"}</td>
              <td>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : "-"}</td>
              <td className={amountClass}>{difference > 0 ? "+" : difference < 0 ? "−" : ""}{Number(transaction.amount).toLocaleString()} credits</td>
            </tr>;
          })}</tbody>
        </table></div>
      </section>
    </div>
    <p id="dashboard-message" className="page-message" role="status">{message}</p>
  </main>;
}
