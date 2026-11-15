import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useApp } from "./AppContext.jsx";

const themeKey = "sbCasinoTheme";

export default function Navbar() {
  const { user, balance, isAuthenticated, logout } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem(themeKey) === "light" ? "light" : "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(themeKey, theme);
  }, [theme]);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && setMenuOpen(false);
    document.body.classList.toggle("menu-open", menuOpen);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const playerTarget = isAuthenticated ? "/dashboard" : "/login";

  return <div id="navbar">
    <div className="nav-shell">
      <nav id="main-navbar" aria-label="Main navigation">
        <Link className="nav-home" to="/">SB-Casino</Link>
        <div className="player-summary">
          <Link className="player-profile-link" to={playerTarget} aria-label={isAuthenticated ? "Open player dashboard" : "Log in to your account"}>
            <span className="player-avatar" aria-hidden="true">{user?.username?.slice(0, 1).toUpperCase() || (isAuthenticated ? "P" : "G")}</span>
            <span className="player-name">{user?.username || (isAuthenticated ? "Player" : "Guest")}</span>
          </Link>
          {isAuthenticated && balance != null && <span className="player-balance">{Number(balance).toLocaleString()} credits</span>}
        </div>
        <button className="menu-toggle" type="button" aria-label="Open menu" aria-controls="side-menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><span /><span /><span /></button>
      </nav>
      <button className="menu-backdrop" type="button" aria-label="Close menu" hidden={!menuOpen} onClick={closeMenu} />
      <aside id="side-menu" className="side-menu" aria-label="Site menu" aria-hidden={!menuOpen} hidden={!menuOpen}>
        <div className="side-menu-heading"><div><p className="menu-eyebrow">SB-CASINO</p><h2>Menu</h2></div><button className="menu-close" type="button" aria-label="Close menu" onClick={closeMenu}>×</button></div>
        <nav className="side-menu-links" aria-label="Pages">
          <NavLink to="/games" id="games-link" onClick={closeMenu}>Games <span>→</span></NavLink>
          {isAuthenticated && <>
            <NavLink to="/dashboard" id="dashboard-link" onClick={closeMenu}>Dashboard <span>→</span></NavLink>
            <NavLink to="/history" id="history-link" onClick={closeMenu}>Game history <span>→</span></NavLink>
            <NavLink to="/deposit" id="deposit-link" onClick={closeMenu}>Redeem credits <span>→</span></NavLink>
          </>}
          {!isAuthenticated && <NavLink to="/login" id="login-link" onClick={closeMenu}>Login / Register <span>→</span></NavLink>}
        </nav>
        <div className="side-menu-bottom">
          <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>Switch to {theme === "dark" ? "light" : "dark"} mode</button>
          {isAuthenticated && <button className="logout-button" type="button" onClick={async () => { await logout(); closeMenu(); navigate("/"); }}>Log out</button>}
        </div>
      </aside>
    </div>
  </div>;
}
