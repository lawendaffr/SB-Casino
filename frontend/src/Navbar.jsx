import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useApp } from "./AppContext.jsx";

const themeKey = "sbCasinoTheme";

function formatNotifTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

function categoryBadgeClass(category) {
  if (category === "WARNING") return "notif-badge notif-badge-warning";
  if (category === "BALANCE") return "notif-badge notif-badge-balance";
  if (category === "NEWS") return "notif-badge notif-badge-news";
  return "notif-badge notif-badge-system";
}

export default function Navbar() {
  const {
    user,
    balance,
    isAuthenticated,
    notifications,
    unreadCount,
    unreadWarningsCount,
    markNotificationRead,
    markAllNotificationsRead,
    refreshNotifications,
    logout
  } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState("ALL");
  const [theme, setTheme] = useState(() =>
    localStorage.getItem(themeKey) === "light" ? "light" : "dark"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(themeKey, theme);
  }, [theme]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.body.classList.toggle("menu-open", menuOpen);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const playerTarget = isAuthenticated ? "/dashboard" : "/login";
  const isStaff = isAuthenticated && (user?.role === "ADMIN" || user?.role === "MODERATOR");

  const activeUnreadWarnings = isAuthenticated
    ? notifications.filter((n) => !n.read && n.category === "WARNING")
    : [];

  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === "ALL") return true;
    return n.category === notifFilter;
  });

  return (
    <div id="navbar">
      <div className="nav-shell">
        <nav id="main-navbar" aria-label="Main navigation">
          <Link className="nav-home" to="/">
            SB-Casino
          </Link>
          <div className="player-summary">
            {isStaff && (
              <Link className="nav-admin-link" to="/admin">
                Admin Panel
              </Link>
            )}

            {isAuthenticated && (
              <div className="notif-wrapper">
                <button
                  type="button"
                  className={`notif-trigger ${unreadWarningsCount > 0 ? "has-warning" : unreadCount > 0 ? "has-unread" : ""}`}
                  aria-label="Open notifications"
                  aria-expanded={notifOpen}
                  onClick={() => {
                    const next = !notifOpen;
                    setNotifOpen(next);
                    if (next) refreshNotifications();
                  }}
                >
                  <span className="notif-bell-icon" aria-hidden="true">
                    🔔
                  </span>
                  {unreadCount > 0 && (
                    <span className={`notif-count-badge ${unreadWarningsCount > 0 ? "is-warning" : ""}`}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    <button
                      type="button"
                      className="notif-backdrop"
                      aria-label="Close notifications"
                      onClick={() => setNotifOpen(false)}
                    />
                    <section className="notif-dropdown" aria-label="Notifications">
                      <header className="notif-dropdown-header">
                        <div>
                          <h3>Notifications</h3>
                          <span>{unreadCount} unread</span>
                        </div>
                        <div className="notif-header-actions">
                          {unreadCount > 0 && (
                            <button type="button" onClick={markAllNotificationsRead}>
                              Mark all read
                            </button>
                          )}
                          <button type="button" onClick={() => setNotifOpen(false)}>
                            ×
                          </button>
                        </div>
                      </header>

                      <div className="notif-filter-bar">
                        {["ALL", "WARNING", "NEWS", "BALANCE"].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            aria-pressed={notifFilter === cat}
                            onClick={() => setNotifFilter(cat)}
                          >
                            {cat === "ALL"
                              ? "All"
                              : cat === "WARNING"
                              ? "Warnings"
                              : cat === "NEWS"
                              ? "News"
                              : "Balance"}
                          </button>
                        ))}
                      </div>

                      <div className="notif-list">
                        {filteredNotifications.length === 0 ? (
                          <p className="notif-empty">No notifications in this category.</p>
                        ) : (
                          filteredNotifications.map((item) => (
                            <article
                              key={item.id}
                              className={`notif-item ${!item.read ? "is-unread" : ""} ${
                                item.category === "WARNING" ? "is-warning-item" : ""
                              }`}
                            >
                              <div className="notif-item-top">
                                <span className={categoryBadgeClass(item.category)}>
                                  {item.category}
                                </span>
                                <span className="notif-time">{formatNotifTime(item.createdAt)}</span>
                              </div>
                              <h4>{item.title}</h4>
                              <p>{item.message}</p>
                              <div className="notif-item-footer">
                                <small>From {item.actorUsername || "SB-Casino"}</small>
                                {!item.read && (
                                  <button
                                    type="button"
                                    onClick={() => markNotificationRead(item.id)}
                                  >
                                    {item.category === "WARNING" ? "Acknowledge" : "Mark read"}
                                  </button>
                                )}
                              </div>
                            </article>
                          ))
                        )}
                      </div>
                    </section>
                  </>
                )}
              </div>
            )}

            <Link
              className="player-profile-link"
              to={playerTarget}
              aria-label={isAuthenticated ? "Open player dashboard" : "Log in to your account"}
            >
              <span className="player-avatar" aria-hidden="true">
                {user?.username?.slice(0, 1).toUpperCase() || (isAuthenticated ? "P" : "G")}
              </span>
              <span className="player-name">{user?.username || (isAuthenticated ? "Player" : "Guest")}</span>
            </Link>
            {isAuthenticated && balance != null && (
              <span className="player-balance">{Number(balance).toLocaleString()} credits</span>
            )}
          </div>
          <button
            className="menu-toggle"
            type="button"
            aria-label="Open menu"
            aria-controls="side-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>

        {/* Active Unread Moderator Warning Banner so warned users see it immediately */}
        {activeUnreadWarnings.length > 0 && (
          <div className="global-warning-strip" role="alert">
            <div className="global-warning-inner">
              <div>
                <strong>⚠️ {activeUnreadWarnings[0].title}:</strong>{" "}
                <span>{activeUnreadWarnings[0].message}</span>
                <small style={{ marginLeft: ".5rem", opacity: 0.8 }}>
                  (Issued by {activeUnreadWarnings[0].actorUsername})
                </small>
              </div>
              <div style={{ display: "flex", gap: ".45rem", alignItems: "center" }}>
                {activeUnreadWarnings.length > 1 && (
                  <button type="button" onClick={() => setNotifOpen(true)}>
                    +{activeUnreadWarnings.length - 1} more
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => markNotificationRead(activeUnreadWarnings[0].id)}
                >
                  Acknowledge Warning
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          className="menu-backdrop"
          type="button"
          aria-label="Close menu"
          hidden={!menuOpen}
          onClick={closeMenu}
        />
        <aside
          id="side-menu"
          className="side-menu"
          aria-label="Site menu"
          aria-hidden={!menuOpen}
          hidden={!menuOpen}
        >
          <div className="side-menu-heading">
            <div>
              <p className="menu-eyebrow">SB-CASINO</p>
              <h2>Menu</h2>
            </div>
            <button className="menu-close" type="button" aria-label="Close menu" onClick={closeMenu}>
              ×
            </button>
          </div>
          <nav className="side-menu-links" aria-label="Pages">
            <NavLink to="/games" id="games-link" onClick={closeMenu}>
              Games <span>→</span>
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/dashboard" id="dashboard-link" onClick={closeMenu}>
                  Dashboard <span>→</span>
                </NavLink>
                <NavLink to="/history" id="history-link" onClick={closeMenu}>
                  Game history <span>→</span>
                </NavLink>
                <NavLink to="/deposit" id="deposit-link" onClick={closeMenu}>
                  Redeem credits <span>→</span>
                </NavLink>
                {isStaff && (
                  <NavLink to="/admin" id="admin-link" onClick={closeMenu}>
                    Admin Panel <span>→</span>
                  </NavLink>
                )}
              </>
            )}
            {!isAuthenticated && (
              <NavLink to="/login" id="login-link" onClick={closeMenu}>
                Login / Register <span>→</span>
              </NavLink>
            )}
          </nav>
          <div className="side-menu-bottom">
            <button
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              Switch to {theme === "dark" ? "light" : "dark"} mode
            </button>
            {isAuthenticated && (
              <button
                className="logout-button"
                type="button"
                onClick={async () => {
                  await logout();
                  closeMenu();
                  navigate("/");
                }}
              >
                Log out
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
