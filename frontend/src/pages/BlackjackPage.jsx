import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api.js";
import { useApp } from "../AppContext.jsx";

const suits = { SPADES: "♠", CLUBS: "♣", HEARTS: "♥", DIAMONDS: "♦" };
const winningResults = new Set(["PLAYER_WIN", "PLAYER_BLACKJACK"]);
const resultLabels = {
  PLAYER_WIN: "You win",
  PLAYER_BLACKJACK: "Blackjack!",
  DEALER_BLACKJACK: "Dealer blackjack",
  DEALER_WIN: "Dealer wins",
  PLAYER_BUST: "Bust",
  PUSH: "Push",
  IN_PROGRESS: "In progress"
};

function Card({ value, hidden = false }) {
  if (hidden) return <span className="playing-card card-face-down" aria-label="Face-down dealer card">SB</span>;
  const [rank, suit] = String(value).split("-");
  const red = suit === "HEARTS" || suit === "DIAMONDS";
  return <span className={`playing-card${red ? " card-red" : ""}`} role="img" aria-label={`${rank} of ${String(suit || "unknown").toLowerCase()}`}>
    <span className="card-index">{rank}</span><span className="card-suit">{suits[suit] || "•"}</span><span className="card-index card-index-bottom">{rank}</span>
  </span>;
}

function Confetti({ id }) {
  const colors = ["#8fffe0", "#7bd4ff", "#ffe17b", "#ff8fb8", "#c9a2ff", "#ffffff"];
  return <div className="win-celebration" aria-hidden="true" key={id}>{Array.from({ length: 28 }, (_, index) => <i className="win-confetti" key={`${id}-${index}`} style={{
    "--x": `${Math.random() * 100}%`,
    "--fall": `${950 + Math.random() * 700}ms`,
    "--delay": `${Math.random() * 260}ms`,
    "--drift": `${Math.floor(Math.random() * 120) - 60}px`,
    "--spin": `${Math.floor(Math.random() * 1000) - 500}deg`,
    "--particle-color": colors[index % colors.length]
  }} />)}</div>;
}

export default function BlackjackPage() {
  const { setBalance } = useApp();
  const [game, setGame] = useState(null);
  const [balance, setLocalBalance] = useState(null);
  const [bet, setBet] = useState("100");
  const [message, setMessage] = useState("Start a round to play.");
  const [busy, setBusy] = useState(false);
  const [celebrationId, setCelebrationId] = useState(0);
  const [confettiVisible, setConfettiVisible] = useState(false);

  const applyGame = useCallback((nextGame) => {
    setGame(nextGame);
    setLocalBalance(nextGame.balance);
    setBalance(nextGame.balance);
    const active = nextGame.status === "ACTIVE";
    if (active) {
      setMessage("Round in progress. Choose Hit or Stand.");
      return;
    }
    const outcome = String(nextGame.result || "").toUpperCase();
    if (winningResults.has(outcome)) {
      setMessage(outcome === "PLAYER_BLACKJACK" ? "Blackjack! You won this round." : "You won this round.");
      setCelebrationId((id) => id + 1);
      setConfettiVisible(true);
    } else if (outcome === "PUSH") {
      setMessage("Push. Your bet is returned.");
      setConfettiVisible(false);
    } else {
      setMessage("Round lost.");
      setConfettiVisible(false);
    }
  }, [setBalance]);

  const loadBalance = useCallback(async () => {
    try {
      const data = await apiRequest("/api/users/me/balance");
      setLocalBalance(data.balance);
      setBalance(data.balance);
    } catch {
      setLocalBalance(null);
    }
  }, [setBalance]);

  useEffect(() => {
    let current = true;
    apiRequest("/api/games/blackjack/active")
      .then((activeGame) => { if (current) applyGame(activeGame); })
      .catch(async (error) => {
        if (!current) return;
        if (error.status === 404) setMessage("No active round. Start a new game.");
        else setMessage(`Could not restore active game: ${error.message}`);
        await loadBalance();
      });
    return () => { current = false; };
  }, [applyGame, loadBalance]);

  useEffect(() => {
    if (!confettiVisible) return undefined;
    const timer = window.setTimeout(() => setConfettiVisible(false), 2100);
    return () => window.clearTimeout(timer);
  }, [confettiVisible, celebrationId]);

  async function startGame(event) {
    event.preventDefault();
    const value = Number(bet);
    if (!Number.isInteger(value) || value < 1 || value > 1000000) {
      setMessage("Enter a whole-number bet between 1 and 1,000,000.");
      return;
    }
    setBusy(true);
    setMessage("Starting round...");
    try {
      applyGame(await apiRequest("/api/games/blackjack/start", {
        method: "POST",
        body: JSON.stringify({ bet: value })
      }));
    } catch (error) {
      setMessage(`Could not start game: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function performAction(action) {
    if (!game?.gameId || game.status !== "ACTIVE" || busy) return;
    setBusy(true);
    setMessage("Processing action...");
    try {
      applyGame(await apiRequest(`/api/games/blackjack/${game.gameId}/action`, {
        method: "POST",
        body: JSON.stringify({ action })
      }));
    } catch (error) {
      setMessage(`Action failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  const active = game?.status === "ACTIVE";
  const outcome = String(game?.result || "").toUpperCase();
  const outcomeClass = active ? "" : winningResults.has(outcome) ? "outcome-win" : outcome === "PUSH" ? "outcome-push" : game ? "outcome-loss" : "";
  const amountClass = winningResults.has(outcome) ? "amount-positive" : outcome === "PUSH" ? "amount-neutral" : "amount-negative";

  return <main className="page-main blackjack-page">
    <header className="page-heading"><p className="page-eyebrow">TABLE 01</p><h1>Blackjack</h1></header>
    <div className="blackjack-layout">
      <section className="panel bet-panel">
        <h2>Start a Round</h2><p className="balance-line">Your balance <strong>{balance == null ? "Unavailable" : `${Number(balance).toLocaleString()} credits`}</strong></p>
        <form id="start-form" onSubmit={startGame}>
          <label htmlFor="bet">Bet:</label><input type="number" id="bet" min="1" max="1000000" step="1" value={bet} onChange={(event) => setBet(event.target.value)} required />
          <button type="submit" id="start-button" disabled={active || busy}>Start Game</button>
        </form>
      </section>
      <section className={`panel game-panel ${outcomeClass}`}>
        <h2>Game</h2><p id="game-message" className={active ? "" : amountClass} role="status">{message}</p>
        <div className="hand-grid">
          <div className="hand-card dealer-hand"><h3>Dealer</h3><div className="card-hand" aria-label="Dealer cards">{game?.dealerCards?.length ? game.dealerCards.map((card, index) => <Card value={card} key={`${card}-${index}`} />) : <span className="empty-card-slot">Cards are dealt here</span>}{active && <Card hidden />}</div><p>Total <strong>{game?.dealerTotal ?? (active ? "Hidden" : "-")}</strong></p></div>
          <div className="hand-card player-hand"><h3>You</h3><div className="card-hand" aria-label="Your cards">{game?.playerCards?.length ? game.playerCards.map((card, index) => <Card value={card} key={`${card}-${index}`} />) : <span className="empty-card-slot">Cards are dealt here</span>}</div><p>Total <strong>{game?.playerTotal ?? "-"}</strong></p></div>
        </div>
        <div className="game-actions"><button id="hit-button" disabled={!active || busy} onClick={() => performAction("HIT")}>Hit</button><button id="stand-button" disabled={!active || busy} onClick={() => performAction("STAND")}>Stand</button></div>
        <div className="round-summary"><p>Bet <strong>{game?.bet ?? "-"}</strong></p><p>Payout <strong>{game?.payout ?? "-"}</strong></p><p>Result <strong className={game && !active ? amountClass : ""}>{resultLabels[game?.result] || game?.result || "-"}</strong></p><p>Balance <strong>{game?.balance ?? "-"}</strong></p></div>
        {confettiVisible && <Confetti id={celebrationId} />}
      </section>
    </div>
  </main>;
}
