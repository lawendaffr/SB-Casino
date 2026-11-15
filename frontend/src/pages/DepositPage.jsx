import { useEffect, useState } from "react";
import { apiRequest } from "../api.js";
import { useApp } from "../AppContext.jsx";

function redemptionError(error) {
  if (error.status === 404) return "This code does not exist.";
  if (error.status === 409) return "You have already redeemed this code, or its usage limit has been reached.";
  if (error.status === 400) return "This code is invalid, inactive, or expired.";
  if (error.status === 401) return "Your session has expired. Please log in again.";
  return `Could not redeem code: ${error.message}`;
}

export default function DepositPage() {
  const { balance, setBalance, refreshBalance } = useApp();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { refreshBalance().catch(() => {}); }, [refreshBalance]);

  async function redeem(event) {
    event.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setMessage("Enter a redemption code.");
      return;
    }
    setBusy(true);
    setMessage("Redeeming code...");
    try {
      const result = await apiRequest("/api/codes/redeem", {
        method: "POST",
        body: JSON.stringify({ code: cleanCode })
      });
      setBalance(result.balance);
      setMessage(`Success! ${result.amount} credits added. Your new balance is ${result.balance} credits.`);
      setCode("");
    } catch (error) {
      setMessage(redemptionError(error));
    } finally {
      setBusy(false);
    }
  }

  return <main className="page-main deposit-page">
    <header className="page-heading"><p className="page-eyebrow">PLAYER AREA</p><h1>Redeem credits</h1></header>
    <div className="deposit-layout">
      <section className="panel balance-panel"><p className="page-eyebrow">CURRENT BALANCE</p><h2>{balance == null ? "Loading..." : Number(balance).toLocaleString()} <small>credits</small></h2><button type="button" onClick={() => refreshBalance().catch(() => setMessage("Could not refresh balance."))}>Refresh Balance</button></section>
      <section className="panel redeem-panel"><h2>Enter Your Code</h2><p>Enter a valid credit code to add funds to your balance.</p>
        <form id="redeem-form" onSubmit={redeem}><label htmlFor="code">Redemption code:</label><input id="code" name="code" placeholder="AB12-CD34" maxLength="100" value={code} onChange={(event) => setCode(event.target.value)} required /><button type="submit" id="redeem-button" disabled={busy}>Redeem</button></form>
        <p id="redeem-message" role="status">{message}</p>
      </section>
    </div>
  </main>;
}
