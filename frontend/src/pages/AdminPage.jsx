import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";
import { useApp } from "../AppContext.jsx";

const cardSuits = { SPADES: "♠", CLUBS: "♣", HEARTS: "♥", DIAMONDS: "♦" };
const blackjackResultLabels = {
  PLAYER_WIN: "Player Win",
  PLAYER_BLACKJACK: "Player Blackjack!",
  DEALER_BLACKJACK: "Dealer Blackjack",
  DEALER_WIN: "Dealer Wins",
  PLAYER_BUST: "Player Bust",
  PUSH: "Push (Tie)",
  IN_PROGRESS: "Round In Progress"
};

function SpectatorCard({ value, hidden = false, xray = false }) {
  if (hidden) {
    return (
      <span className="playing-card card-face-down" aria-label="Face-down dealer card">
        SB
      </span>
    );
  }
  const [rank, suit] = String(value || "").split("-");
  const red = suit === "HEARTS" || suit === "DIAMONDS";
  return (
    <span
      className={`playing-card${red ? " card-red" : ""}${xray ? " card-xray" : ""}`}
      role="img"
      aria-label={`${rank} of ${String(suit || "unknown").toLowerCase()}`}
      title={xray ? "Dealer hole card (Staff X-Ray)" : undefined}
    >
      <span className="card-index">{rank}</span>
      <span className="card-suit">{cardSuits[suit] || "•"}</span>
      <span className="card-index card-index-bottom">{rank}</span>
    </span>
  );
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function isUserTimedOut(user) {
  if (!user?.suspendedUntil) return false;
  return new Date(user.suspendedUntil).getTime() > Date.now();
}

function UserStatusBadge({ user }) {
  if (!user) return null;
  if (user.accountStatus === "BANNED") {
    return <span className="status-badge status-banned">Banned</span>;
  }
  if (isUserTimedOut(user)) {
    return (
      <span className="status-badge status-timeout" title={`Until ${formatDateTime(user.suspendedUntil)}`}>
        Timed out
      </span>
    );
  }
  return <span className="status-badge status-active">Active</span>;
}

function RoleBadge({ role }) {
  const normalized = (role || "USER").toUpperCase();
  const cls =
    normalized === "ADMIN"
      ? "role-admin"
      : normalized === "MODERATOR"
      ? "role-moderator"
      : "role-user";
  return <span className={`role-badge ${cls}`}>{normalized}</span>;
}

function CodeStatusBadge({ code }) {
  const expired = code.expiresAt && new Date(code.expiresAt).getTime() <= Date.now();
  const exhausted = code.maxUses != null && Number(code.usedCount || 0) >= Number(code.maxUses);
  if (!code.active) return <span className="status-badge status-inactive">Inactive</span>;
  if (expired) return <span className="status-badge status-timeout">Expired</span>;
  if (exhausted) return <span className="status-badge status-timeout">Exhausted</span>;
  return <span className="status-badge status-active">Active</span>;
}

export default function AdminPage() {
  const { user, isAuthenticated, refreshUser, refreshBalance, refreshNotifications, logout } = useApp();
  const navigate = useNavigate();

  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const [activeTab, setActiveTab] = useState("users");
  const [banner, setBanner] = useState({ text: "", type: "info" });
  const [busy, setBusy] = useState(false);

  // Overview stats (/api/moderation/reports)
  const [overview, setOverview] = useState(null);

  // Users state (/api/admin/users or /api/moderation/users)
  const [usersPage, setUsersPage] = useState({
    users: [],
    page: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0
  });
  const [userSearchInput, setUserSearchInput] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Selected user inspector forms
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [roleInput, setRoleInput] = useState("USER");
  const [modReason, setModReason] = useState("");
  const [timeoutHours, setTimeoutHours] = useState("24");
  const [userModActions, setUserModActions] = useState([]);

  // Create user / admin account form
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createRole, setCreateRole] = useState("ADMIN");
  const [createBalance, setCreateBalance] = useState("1000");

  // Giftcodes state (/api/admin/codes)
  const [codesPage, setCodesPage] = useState({
    codes: [],
    page: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0
  });
  const [codeCustomName, setCodeCustomName] = useState("");
  const [codeAmount, setCodeAmount] = useState("500");
  const [codePolicy, setCodePolicy] = useState("ONCE_PER_USER");
  const [codeMaxUses, setCodeMaxUses] = useState("");
  const [codeExpiresAt, setCodeExpiresAt] = useState("");
  const [lastCreatedCode, setLastCreatedCode] = useState(null);

  // News & Notifications state (/api/moderation/notifications)
  const [notifsPage, setNotifsPage] = useState({
    notifications: [],
    page: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0
  });
  const [notifCategory, setNotifCategory] = useState("NEWS");
  const [notifTargetUserId, setNotifTargetUserId] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");

  // Games management state (/api/admin/games)
  const [gamesConfig, setGamesConfig] = useState([]);
  const [gameEdits, setGameEdits] = useState({});

  // User reports state (/api/moderation/user-reports)
  const [reportStatusFilter, setReportStatusFilter] = useState("OPEN");
  const [reportsPage, setReportsPage] = useState({
    reports: [],
    page: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0
  });

  // Audit logs state (/api/admin/logs)
  const [logsPage, setLogsPage] = useState({
    logs: [],
    page: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0
  });

  // Live Game Spectating state (/api/moderation/games/active)
  const [spectateOverview, setSpectateOverview] = useState({
    activeGames: [],
    recentGames: []
  });
  const [spectatedGameId, setSpectatedGameId] = useState(null);
  const [spectatedUserId, setSpectatedUserId] = useState(null);
  const [spectatedGameDetail, setSpectatedGameDetail] = useState(null);
  const [revealHoleCard, setRevealHoleCard] = useState(true);
  const [autoFollowPlayer, setAutoFollowPlayer] = useState(true);

  const showMessage = useCallback((text, type = "info") => {
    setBanner({ text, type });
  }, []);

  const selectedUser =
    usersPage.users.find((u) => u.id === selectedUserId) || usersPage.users[0] || null;

  useEffect(() => {
    if (selectedUser && selectedUser.id !== selectedUserId) {
      setSelectedUserId(selectedUser.id);
    }
  }, [selectedUser, selectedUserId]);

  useEffect(() => {
    if (selectedUser) {
      setRoleInput(selectedUser.role || "USER");
    }
  }, [selectedUser?.id, selectedUser?.role]);

  const loadOverview = useCallback(async () => {
    if (!isStaff) return;
    try {
      const data = await apiRequest("/api/moderation/reports");
      setOverview(data);
    } catch {
      // Ignore silent overview error
    }
  }, [isStaff]);

  const loadUsers = useCallback(
    async (page = 0, query = userSearchQuery, silent = false) => {
      if (!isStaff) return;
      const endpoint = isAdmin ? "/api/admin/users" : "/api/moderation/users";
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (query && query.trim()) params.set("q", query.trim());
      try {
        const data = await apiRequest(`${endpoint}?${params.toString()}`);
        setUsersPage({
          users: Array.isArray(data?.users) ? data.users : [],
          page: data?.page ?? 0,
          pageSize: data?.pageSize ?? 20,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0
        });
      } catch (error) {
        if (!silent) showMessage(`Could not load users: ${error.message}`, "error");
      }
    },
    [isAdmin, isStaff, showMessage, userSearchQuery]
  );

  const loadUserModerationHistory = useCallback(
    async (targetId) => {
      if (!targetId || !isStaff) {
        setUserModActions([]);
        return;
      }
      try {
        const data = await apiRequest(`/api/moderation/users/${targetId}/actions?page=0&size=15`);
        setUserModActions(Array.isArray(data?.actions) ? data.actions : []);
      } catch {
        setUserModActions([]);
      }
    },
    [isStaff]
  );

  const loadCodes = useCallback(
    async (page = 0, silent = false) => {
      if (!isAdmin) return;
      try {
        const data = await apiRequest(`/api/admin/codes?page=${page}&size=20`);
        setCodesPage({
          codes: Array.isArray(data?.codes) ? data.codes : [],
          page: data?.page ?? 0,
          pageSize: data?.pageSize ?? 20,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0
        });
      } catch (error) {
        if (!silent) showMessage(`Could not load giftcodes: ${error.message}`, "error");
      }
    },
    [isAdmin, showMessage]
  );

  const loadModerationNotifications = useCallback(
    async (page = 0, silent = false) => {
      if (!isStaff) return;
      try {
        const data = await apiRequest(`/api/moderation/notifications?page=${page}&size=20`);
        setNotifsPage({
          notifications: Array.isArray(data?.notifications) ? data.notifications : [],
          page: data?.page ?? 0,
          pageSize: data?.pageSize ?? 20,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0
        });
      } catch (error) {
        if (!silent) showMessage(`Could not load notifications: ${error.message}`, "error");
      }
    },
    [isStaff, showMessage]
  );

  const loadGames = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const list = await apiRequest("/api/admin/games");
      const arr = Array.isArray(list) ? list : [];
      setGamesConfig(arr);
      const edits = {};
      for (const g of arr) {
        edits[g.gameType] = { enabled: Boolean(g.enabled), maxBet: String(g.maxBet) };
      }
      setGameEdits(edits);
    } catch (error) {
      showMessage(`Could not load games configuration: ${error.message}`, "error");
    }
  }, [isAdmin, showMessage]);

  const loadReports = useCallback(
    async (page = 0, status = reportStatusFilter, silent = false) => {
      if (!isStaff) return;
      try {
        const data = await apiRequest(
          `/api/moderation/user-reports?status=${encodeURIComponent(status)}&page=${page}&size=20`
        );
        setReportsPage({
          reports: Array.isArray(data?.reports) ? data.reports : [],
          page: data?.page ?? 0,
          pageSize: data?.pageSize ?? 20,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0
        });
      } catch (error) {
        if (!silent) showMessage(`Could not load player reports: ${error.message}`, "error");
      }
    },
    [isStaff, reportStatusFilter, showMessage]
  );

  const loadLogs = useCallback(
    async (page = 0, silent = false) => {
      if (!isAdmin) return;
      try {
        const data = await apiRequest(`/api/admin/logs?page=${page}&size=20`);
        setLogsPage({
          logs: Array.isArray(data?.logs) ? data.logs : [],
          page: data?.page ?? 0,
          pageSize: data?.pageSize ?? 20,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0
        });
      } catch (error) {
        if (!silent) showMessage(`Could not load audit logs: ${error.message}`, "error");
      }
    },
    [isAdmin, showMessage]
  );

  const loadSpectateData = useCallback(
    async (silent = false) => {
      if (!isStaff) return;
      try {
        const data = await apiRequest("/api/moderation/games/active?recentLimit=15");
        const activeList = Array.isArray(data?.activeGames) ? data.activeGames : [];
        const recentList = Array.isArray(data?.recentGames) ? data.recentGames : [];
        setSpectateOverview({ activeGames: activeList, recentGames: recentList });

        // Determine which game to show in the spectator table
        let targetGame = null;
        if (autoFollowPlayer && spectatedUserId) {
          const activeForUser = activeList.find((g) => g.userId === spectatedUserId);
          if (activeForUser) {
            targetGame = activeForUser;
            if (activeForUser.gameId !== spectatedGameId) {
              setSpectatedGameId(activeForUser.gameId);
            }
          }
        }
        if (!targetGame && spectatedGameId) {
          targetGame =
            activeList.find((g) => g.gameId === spectatedGameId) ||
            recentList.find((g) => g.gameId === spectatedGameId) ||
            null;
          if (!targetGame) {
            try {
              targetGame = await apiRequest(`/api/moderation/games/blackjack/${spectatedGameId}`);
            } catch {
              targetGame = null;
            }
          }
        }
        if (!targetGame) {
          targetGame = activeList[0] || recentList[0] || null;
          if (targetGame) {
            setSpectatedGameId(targetGame.gameId);
            setSpectatedUserId(targetGame.userId);
          }
        }
        setSpectatedGameDetail(targetGame);
      } catch (error) {
        if (!silent) showMessage(`Could not load ongoing games: ${error.message}`, "error");
      }
    },
    [autoFollowPlayer, isStaff, showMessage, spectatedGameId, spectatedUserId]
  );

  useEffect(() => {
    if (isAuthenticated && !user) {
      refreshUser().catch(() => {});
    }
  }, [isAuthenticated, user, refreshUser]);

  useEffect(() => {
    if (!isStaff) return;
    loadOverview();
    loadUsers(0, userSearchQuery);
  }, [isStaff, loadOverview, loadUsers, userSearchQuery]);

  useEffect(() => {
    if (selectedUser?.id) {
      loadUserModerationHistory(selectedUser.id);
    }
  }, [selectedUser?.id, loadUserModerationHistory]);

  useEffect(() => {
    if (!isStaff) return;
    if (activeTab === "spectate") loadSpectateData();
    if (activeTab === "codes" && isAdmin) loadCodes(0);
    if (activeTab === "notifications") loadModerationNotifications(0);
    if (activeTab === "games" && isAdmin) loadGames();
    if (activeTab === "reports") loadReports(0, reportStatusFilter);
    if (activeTab === "logs" && isAdmin) loadLogs(0);
  }, [
    activeTab,
    isAdmin,
    isStaff,
    loadCodes,
    loadGames,
    loadLogs,
    loadModerationNotifications,
    loadReports,
    loadSpectateData,
    reportStatusFilter
  ]);

  // Fast 1-second polling when spectating live games
  useEffect(() => {
    if (!isStaff || activeTab !== "spectate") return;
    const fastInterval = window.setInterval(() => {
      loadSpectateData(true);
    }, 1000);
    return () => window.clearInterval(fastInterval);
  }, [activeTab, isStaff, loadSpectateData]);

  // Live background sync so player balance changes (Blackjack, code redemptions) sync immediately to Admin Panel
  useEffect(() => {
    if (!isStaff) return;

    const syncAdminData = () => {
      loadOverview();
      loadUsers(usersPage.page, userSearchQuery, true);
      loadSpectateData(true);
      if (activeTab === "codes" && isAdmin) loadCodes(codesPage.page, true);
      if (activeTab === "notifications") loadModerationNotifications(notifsPage.page, true);
      if (activeTab === "reports") loadReports(reportsPage.page, reportStatusFilter, true);
      if (activeTab === "logs" && isAdmin) loadLogs(logsPage.page, true);
    };

    const intervalId = window.setInterval(syncAdminData, 2500);
    const onFocus = () => syncAdminData();
    const onDataSync = () => syncAdminData();

    window.addEventListener("focus", onFocus);
    window.addEventListener("casino:data-sync", onDataSync);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("casino:data-sync", onDataSync);
    };
  }, [
    activeTab,
    codesPage.page,
    isAdmin,
    isStaff,
    loadCodes,
    loadLogs,
    loadModerationNotifications,
    loadOverview,
    loadReports,
    loadUsers,
    logsPage.page,
    notifsPage.page,
    reportStatusFilter,
    reportsPage.page,
    userSearchQuery,
    usersPage.page
  ]);

  function updateUserInList(updated) {
    if (!updated) return;
    setUsersPage((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
    }));
    if (updated.id === user?.id) {
      refreshUser().catch(() => {});
      refreshBalance().catch(() => {});
    }
  }

  async function applyBalanceDelta(targetUser, delta, customReason = "") {
    if (!targetUser) return;
    if (!Number.isInteger(delta) || delta === 0) {
      showMessage("Balance change amount must be a non-zero integer.", "error");
      return;
    }
    if (Number(targetUser.balance) + delta < 0) {
      showMessage(
        `Cannot remove ${Math.abs(delta).toLocaleString()} credits from ${targetUser.username} (current balance is ${Number(
          targetUser.balance
        ).toLocaleString()} credits).`,
        "error"
      );
      return;
    }
    setSelectedUserId(targetUser.id);
    setBusy(true);
    try {
      const reasonText =
        customReason.trim() ||
        balanceReason.trim() ||
        (delta > 0 ? "Credits added by admin" : "Credits removed by admin");
      const updated = await apiRequest(`/api/admin/users/${targetUser.id}/balance`, {
        method: "PATCH",
        body: JSON.stringify({
          amount: delta,
          reason: reasonText
        })
      });
      updateUserInList(updated);
      await loadUsers(usersPage.page, userSearchQuery, true);
      setBalanceAmount("");
      setBalanceReason("");
      showMessage(
        `Updated ${updated.username}'s balance (${delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()} credits → ${Number(
          updated.balance
        ).toLocaleString()} credits).`,
        "success"
      );
    } catch (error) {
      showMessage(`Could not modify balance: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleBalanceAction(mode) {
    if (!selectedUser) return;
    const raw = Number(balanceAmount);
    if (!Number.isFinite(raw) || !Number.isInteger(raw) || raw < 0) {
      showMessage("Enter a valid positive whole number of credits.", "error");
      return;
    }
    let delta = 0;
    let defaultReason = "Admin balance adjustment";
    if (mode === "add") {
      if (raw === 0) {
        showMessage("Enter a credit amount greater than 0 to add.", "error");
        return;
      }
      delta = Math.abs(raw);
      defaultReason = "Credits added by admin";
    } else if (mode === "remove") {
      if (raw === 0) {
        showMessage("Enter a credit amount greater than 0 to remove.", "error");
        return;
      }
      delta = -Math.abs(raw);
      defaultReason = "Credits removed by admin";
    } else if (mode === "set") {
      delta = raw - Number(selectedUser.balance);
      if (delta === 0) {
        showMessage(`${selectedUser.username}'s balance is already ${raw.toLocaleString()} credits.`, "info");
        return;
      }
      defaultReason = `Balance set to ${raw} by admin`;
    }
    await applyBalanceDelta(selectedUser, delta, balanceReason.trim() || defaultReason);
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    if (!selectedUser) return;
    if (!newPasswordInput || newPasswordInput.length < 8) {
      showMessage("New password must be at least 8 characters.", "error");
      return;
    }
    setBusy(true);
    try {
      const updated = await apiRequest(`/api/admin/users/${selectedUser.id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ newPassword: newPasswordInput })
      });
      updateUserInList(updated);
      setNewPasswordInput("");
      showMessage(`Password changed for ${selectedUser.username}.`, "success");
    } catch (error) {
      showMessage(`Could not change password: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleUpdate(event) {
    event.preventDefault();
    if (!selectedUser) return;
    setBusy(true);
    try {
      const updated = await apiRequest(`/api/admin/users/${selectedUser.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: roleInput })
      });
      updateUserInList(updated);
      showMessage(`Updated ${updated.username}'s role to ${updated.role}.`, "success");
    } catch (error) {
      showMessage(`Could not update role: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleModerationAction(actionType, targetUser = selectedUser, customReason = null) {
    if (!targetUser) return;
    setSelectedUserId(targetUser.id);
    const reasonText =
      (customReason ?? modReason).trim() ||
      (actionType === "unban"
        ? "Account reinstated by admin"
        : actionType === "warn"
        ? "Please follow SB-Casino community and fair-play rules."
        : "Administrative moderation action");
    const payload = { reason: reasonText };
    if (actionType === "timeout") {
      const hours = Number(timeoutHours);
      if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
        showMessage("Timeout duration must be between 1 and 720 hours.", "error");
        return;
      }
      payload.hours = hours;
    }

    setBusy(true);
    try {
      await apiRequest(`/api/moderation/users/${targetUser.id}/${actionType}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setModReason("");
      await loadUsers(usersPage.page, userSearchQuery, true);
      await loadUserModerationHistory(targetUser.id);
      refreshNotifications();
      const label =
        actionType === "warn"
          ? `Sent official warning to ${targetUser.username} (delivered to their notifications).`
          : `Applied ${actionType.toUpperCase()} to ${targetUser.username}.`;
      showMessage(label, "success");
    } catch (error) {
      showMessage(`Moderation action failed: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const created = await apiRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: createUsername.trim(),
          password: createPassword,
          email: createEmail.trim() || null,
          role: createRole,
          balance: createBalance === "" ? 1000 : Number(createBalance)
        })
      });
      setCreateUsername("");
      setCreatePassword("");
      setCreateEmail("");
      setCreateRole("ADMIN");
      setCreateBalance("1000");
      await loadUsers(0, "");
      await loadOverview();
      setSelectedUserId(created.id);
      showMessage(
        `Created ${created.role} account "${created.username}" (#${created.id}) with ${Number(
          created.balance
        ).toLocaleString()} credits.`,
        "success"
      );
    } catch (error) {
      showMessage(`Could not create account: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateCode(event) {
    event.preventDefault();
    const amountNum = Number(codeAmount);
    if (!Number.isInteger(amountNum) || amountNum < 1) {
      showMessage("Credit amount must be a positive integer.", "error");
      return;
    }
    const payload = {
      amount: amountNum,
      redemptionPolicy: codePolicy
    };
    if (codeCustomName.trim()) {
      payload.code = codeCustomName.trim().toUpperCase();
    }
    if (codePolicy === "LIMITED_USES") {
      const max = Number(codeMaxUses);
      if (!Number.isInteger(max) || max < 1) {
        showMessage("Limited uses policy requires a positive Max Uses value.", "error");
        return;
      }
      payload.maxUses = max;
    } else if (codePolicy === "ONCE_PER_USER" && codeMaxUses.trim() !== "") {
      const max = Number(codeMaxUses);
      if (!Number.isInteger(max) || max < 1) {
        showMessage("Max uses must be a positive integer or left empty.", "error");
        return;
      }
      payload.maxUses = max;
    }
    if (codeExpiresAt) {
      payload.expiresAt = codeExpiresAt.length === 16 ? `${codeExpiresAt}:00` : codeExpiresAt;
    }

    setBusy(true);
    try {
      const created = await apiRequest("/api/admin/codes", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setLastCreatedCode(created);
      setCodeCustomName("");
      setCodeMaxUses("");
      setCodeExpiresAt("");
      await loadCodes(0);
      showMessage(`Created giftcode ${created.code} for ${Number(created.amount).toLocaleString()} credits.`, "success");
    } catch (error) {
      showMessage(`Could not create giftcode: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivateCode(codeStr) {
    setBusy(true);
    try {
      await apiRequest(`/api/admin/codes/${encodeURIComponent(codeStr)}/deactivate`, {
        method: "POST"
      });
      await loadCodes(codesPage.page);
      showMessage(`Deactivated giftcode ${codeStr}.`, "success");
    } catch (error) {
      showMessage(`Could not deactivate code: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyCode(codeStr) {
    try {
      await navigator.clipboard.writeText(codeStr);
      showMessage(`Copied code ${codeStr} to clipboard.`, "success");
    } catch {
      showMessage(`Code: ${codeStr}`, "info");
    }
  }

  async function handlePublishNotification(event) {
    event.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showMessage("Title and message are required.", "error");
      return;
    }
    setBusy(true);
    try {
      const targetId = notifTargetUserId === "" ? null : Number(notifTargetUserId);
      const created = await apiRequest("/api/moderation/notifications", {
        method: "POST",
        body: JSON.stringify({
          targetUserId: targetId,
          category: notifCategory,
          title: notifTitle.trim(),
          message: notifMessage.trim()
        })
      });
      setNotifTitle("");
      setNotifMessage("");
      await loadModerationNotifications(0);
      refreshNotifications();
      showMessage(
        `Published ${created.category} notification "${created.title}" (${
          targetId ? `User #${targetId}` : "Broadcast to all players"
        }).`,
        "success"
      );
    } catch (error) {
      showMessage(`Could not publish notification: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteNotification(id) {
    setBusy(true);
    try {
      await apiRequest(`/api/moderation/notifications/${id}`, { method: "DELETE" });
      await loadModerationNotifications(notifsPage.page);
      refreshNotifications();
      showMessage(`Deleted notification #${id}.`, "success");
    } catch (error) {
      showMessage(`Could not delete notification: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveGameConfig(gameType) {
    const edit = gameEdits[gameType];
    if (!edit) return;
    const maxBetNum = Number(edit.maxBet);
    if (!Number.isInteger(maxBetNum) || maxBetNum < 1 || maxBetNum > 1000000) {
      showMessage("Maximum bet must be between 1 and 1,000,000 credits.", "error");
      return;
    }
    setBusy(true);
    try {
      const updated = await apiRequest(`/api/admin/games/${encodeURIComponent(gameType)}`, {
        method: "PATCH",
        body: JSON.stringify({
          enabled: Boolean(edit.enabled),
          maxBet: maxBetNum
        })
      });
      setGamesConfig((prev) => prev.map((g) => (g.gameType === updated.gameType ? updated : g)));
      showMessage(
        `Saved ${updated.gameType} settings (${updated.enabled ? "Enabled" : "Disabled"}, max bet ${Number(
          updated.maxBet
        ).toLocaleString()} credits).`,
        "success"
      );
    } catch (error) {
      showMessage(`Could not update game settings: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateReportStatus(reportId, status) {
    setBusy(true);
    try {
      await apiRequest(`/api/moderation/user-reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadReports(reportsPage.page, reportStatusFilter);
      showMessage(`Marked report #${reportId} as ${status}.`, "success");
    } catch (error) {
      showMessage(`Could not update report: ${error.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  function jumpToModerateUser(targetUserId, targetUsername) {
    setActiveTab("users");
    setUserSearchInput(targetUsername || "");
    setUserSearchQuery(targetUsername || "");
    if (targetUserId) setSelectedUserId(targetUserId);
  }

  async function jumpToSpectateUser(targetUser) {
    if (!targetUser) return;
    setSpectatedUserId(targetUser.id);
    setAutoFollowPlayer(true);
    setActiveTab("spectate");
    try {
      const latest = await apiRequest(`/api/moderation/games/users/${targetUser.id}`);
      setSpectatedGameId(latest.gameId);
      setSpectatedGameDetail(latest);
    } catch {
      setSpectatedGameId(null);
      setSpectatedGameDetail(null);
      showMessage(`No active or past Blackjack rounds found for ${targetUser.username} yet. Watching for their next round...`, "info");
    }
    loadSpectateData(true);
  }

  if (!isAuthenticated) {
    return (
      <main className="page-main admin-page">
        <header className="page-heading">
          <p className="page-eyebrow">ADMINISTRATION</p>
          <h1>Admin Panel</h1>
        </header>
        <section className="panel">
          <h2>Authentication Required</h2>
          <p>Please log in with an administrator account to access the SB-Casino Admin Panel.</p>
          <Link
            className="button-primary"
            style={{ display: "inline-block", padding: ".55rem 1rem", borderRadius: "7px", textDecoration: "none" }}
            to="/login"
          >
            Go to Login →
          </Link>
        </section>
      </main>
    );
  }

  if (user && !isStaff) {
    return (
      <main className="page-main admin-page">
        <header className="page-heading">
          <p className="page-eyebrow">ADMINISTRATION</p>
          <h1>Admin Panel</h1>
        </header>
        <section className="panel">
          <h2>Access Restricted (403)</h2>
          <p>
            You are signed in as <strong>{user.username}</strong> (<RoleBadge role={user.role} />). Administrator or
            Moderator privileges are required to view this page.
          </p>
          <button
            type="button"
            className="button-primary"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            Log out &amp; Switch Account
          </button>
        </section>
      </main>
    );
  }

  const houseNet = overview ? Number(overview.totalBets || 0) - Number(overview.totalPayouts || 0) : 0;
  const playerNet = overview ? Number(overview.netResult || 0) : 0;

  return (
    <main className="page-main admin-page">
      <header className="admin-header">
        <div>
          <p className="page-eyebrow">ADMINISTRATION &amp; MODERATION</p>
          <h1>Admin Control Panel</h1>
        </div>
        <div className="admin-header-actions">
          <span className="admin-role-pill">
            {user?.username} · {user?.role || "ADMIN"}
          </span>
          <button
            type="button"
            onClick={() => {
              loadOverview();
              if (activeTab === "users") loadUsers(usersPage.page, userSearchQuery);
              if (activeTab === "codes" && isAdmin) loadCodes(codesPage.page);
              if (activeTab === "notifications") loadModerationNotifications(notifsPage.page);
              if (activeTab === "games" && isAdmin) loadGames();
              if (activeTab === "reports") loadReports(reportsPage.page, reportStatusFilter);
              if (activeTab === "logs" && isAdmin) loadLogs(logsPage.page);
            }}
          >
            Refresh All
          </button>
        </div>
      </header>

      {/* Platform Overview Metrics from GET /api/moderation/reports */}
      <section className="admin-metrics-grid" aria-label="Casino overview statistics">
        <div className="admin-metric-card">
          <span>Total Users</span>
          <strong>{overview ? Number(overview.users).toLocaleString() : "—"}</strong>
          <small>Registered accounts</small>
        </div>
        <div
          className="admin-metric-card"
          style={{ cursor: "pointer" }}
          title="Click to spectate ongoing games"
          onClick={() => setActiveTab("spectate")}
        >
          <span>Active Games</span>
          <strong>{overview ? Number(overview.activeGames).toLocaleString() : "—"}</strong>
          <small>Click to spectate live →</small>
        </div>
        <div className="admin-metric-card">
          <span>Completed Games</span>
          <strong>{overview ? Number(overview.completedGames).toLocaleString() : "—"}</strong>
          <small>Settled rounds</small>
        </div>
        <div className="admin-metric-card">
          <span>Total Bets</span>
          <strong>{overview ? Number(overview.totalBets).toLocaleString() : "—"}</strong>
          <small>Credits wagered</small>
        </div>
        <div className="admin-metric-card">
          <span>Total Payouts</span>
          <strong>{overview ? Number(overview.totalPayouts).toLocaleString() : "—"}</strong>
          <small>Credits won by players</small>
        </div>
        <div className="admin-metric-card">
          <span>House Net</span>
          <strong className={houseNet > 0 ? "amount-positive" : houseNet < 0 ? "amount-negative" : ""}>
            {overview ? `${houseNet > 0 ? "+" : ""}${houseNet.toLocaleString()}` : "—"}
          </strong>
          <small>Player net: {overview ? `${playerNet > 0 ? "+" : ""}${playerNet.toLocaleString()}` : "—"}</small>
        </div>
      </section>

      {/* Tabs navigation */}
      <nav className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "users"}
          onClick={() => setActiveTab("users")}
        >
          Users &amp; Admins ({usersPage.totalElements})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "spectate"}
          onClick={() => setActiveTab("spectate")}
        >
          Live Spectate ({spectateOverview.activeGames.length} active)
        </button>
        {isAdmin && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "codes"}
            onClick={() => setActiveTab("codes")}
          >
            Giftcodes
          </button>
        )}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "notifications"}
          onClick={() => setActiveTab("notifications")}
        >
          News &amp; Notifications
        </button>
        {isAdmin && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "games"}
            onClick={() => setActiveTab("games")}
          >
            Games &amp; Limits
          </button>
        )}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "reports"}
          onClick={() => setActiveTab("reports")}
        >
          Player Reports
        </button>
        {isAdmin && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "logs"}
            onClick={() => setActiveTab("logs")}
          >
            Audit Logs
          </button>
        )}
      </nav>

      {banner.text && (
        <div
          className={`admin-banner ${
            banner.type === "error" ? "is-error" : banner.type === "success" ? "is-success" : ""
          }`}
          role="status"
        >
          <span>{banner.text}</span>
          <button type="button" onClick={() => setBanner({ text: "", type: "info" })}>
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: USERS & ADMINS */}
      {activeTab === "users" && (
        <div className="admin-two-col">
          <div className="admin-stack">
            <section className="panel admin-table-panel">
              <header className="panel-heading" style={{ marginBottom: ".85rem" }}>
                <div>
                  <h2>Manage Existing Users</h2>
                  <p style={{ margin: ".2rem 0 0", fontSize: ".75rem" }}>
                    Click any user row to manage their balance, password, role, or moderation status. Balances sync
                    live every 2.5s.
                  </p>
                </div>
                <button type="button" onClick={() => loadUsers(usersPage.page, userSearchQuery)}>
                  Refresh
                </button>
              </header>

              <form
                className="admin-toolbar"
                onSubmit={(e) => {
                  e.preventDefault();
                  setUserSearchQuery(userSearchInput);
                  loadUsers(0, userSearchInput);
                }}
              >
                <input
                  type="search"
                  placeholder="Search users by username..."
                  aria-label="Search users by username"
                  value={userSearchInput}
                  onChange={(e) => setUserSearchInput(e.target.value)}
                />
                <button type="submit">Search</button>
                {userSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserSearchInput("");
                      setUserSearchQuery("");
                      loadUsers(0, "");
                    }}
                  >
                    Clear
                  </button>
                )}
              </form>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Role</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersPage.users.length === 0 ? (
                      <tr>
                        <td colSpan={6}>No users found.</td>
                      </tr>
                    ) : (
                      usersPage.users.map((u) => {
                        const isSelected = selectedUser?.id === u.id;
                        const isSelf = u.id === user?.id;
                        const banned = u.accountStatus === "BANNED";
                        return (
                          <tr
                            key={u.id}
                            className={`admin-user-row ${isSelected ? "is-selected" : ""}`}
                            onClick={() => setSelectedUserId(u.id)}
                            style={{ cursor: "pointer" }}
                          >
                            <td>#{u.id}</td>
                            <td>
                              <span className="user-cell-primary">
                                {u.username}
                                {isSelf && <small style={{ color: "var(--accent)" }}>(You)</small>}
                              </span>
                              {u.email && <span className="user-cell-sub">{u.email}</span>}
                            </td>
                            <td>
                              <RoleBadge role={u.role} />
                            </td>
                            <td style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
                              {Number(u.balance).toLocaleString()} cr
                            </td>
                            <td>
                              <UserStatusBadge user={u} />
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className={isSelected ? "button-primary" : ""}
                                  onClick={() => setSelectedUserId(u.id)}
                                >
                                  {isSelected ? "Selected ✓" : "Select"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => jumpToSpectateUser(u)}
                                >
                                  Spectate
                                </button>
                                {!isSelf && (
                                  banned ? (
                                    <button
                                      type="button"
                                      className="button-success"
                                      disabled={busy}
                                      onClick={() => handleModerationAction("unban", u, "Unbanned from user list")}
                                    >
                                      Unban
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="button-danger"
                                      disabled={busy}
                                      onClick={() => handleModerationAction("ban", u, "Banned by administrator")}
                                    >
                                      Ban
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <footer className="history-pagination" style={{ paddingBottom: 0 }}>
                <p>
                  Page {usersPage.totalPages === 0 ? 0 : usersPage.page + 1} of {usersPage.totalPages} (
                  {usersPage.totalElements} users)
                </p>
                <div>
                  <button
                    type="button"
                    disabled={usersPage.page <= 0}
                    onClick={() => loadUsers(usersPage.page - 1, userSearchQuery)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={usersPage.page + 1 >= usersPage.totalPages}
                    onClick={() => loadUsers(usersPage.page + 1, userSearchQuery)}
                  >
                    Next
                  </button>
                </div>
              </footer>
            </section>

            {/* Create New Account / Add Admin Account */}
            {isAdmin && (
              <section className="panel">
                <header className="panel-heading" style={{ marginBottom: ".6rem" }}>
                  <h2>Add Admin or Create User Account</h2>
                </header>
                <p style={{ marginTop: 0, fontSize: ".78rem" }}>
                  Create a new administrator, moderator, or player account directly with custom initial credits.
                </p>
                <form onSubmit={handleCreateUser}>
                  <div className="form-row-2">
                    <div>
                      <label htmlFor="create-user-username">Username (3–50 chars)</label>
                      <input
                        id="create-user-username"
                        value={createUsername}
                        onChange={(e) => setCreateUsername(e.target.value)}
                        minLength={3}
                        maxLength={50}
                        placeholder="newadmin"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="create-user-password">Password (min 8 chars)</label>
                      <input
                        id="create-user-password"
                        type="password"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        minLength={8}
                        maxLength={100}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div>
                      <label htmlFor="create-user-role">Account Role</label>
                      <select
                        id="create-user-role"
                        value={createRole}
                        onChange={(e) => setCreateRole(e.target.value)}
                      >
                        <option value="ADMIN">ADMIN (Full Admin Panel access)</option>
                        <option value="MODERATOR">MODERATOR (Moderation &amp; Reports)</option>
                        <option value="USER">USER (Standard Player)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="create-user-balance">Initial Balance (credits)</label>
                      <input
                        id="create-user-balance"
                        type="number"
                        min={0}
                        step={1}
                        value={createBalance}
                        onChange={(e) => setCreateBalance(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="create-user-email">Email (optional)</label>
                    <input
                      id="create-user-email"
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="admin2@sbcasino.local"
                    />
                  </div>
                  <button type="submit" disabled={busy}>
                    Create {createRole} Account
                  </button>
                </form>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: SELECTED USER INSPECTOR */}
          <section className="panel" aria-label="Selected user management">
            {!selectedUser ? (
              <p>Select a user from the table to manage their account.</p>
            ) : (
              <>
                <header className="inspector-header">
                  <div>
                    <p className="page-eyebrow">MANAGING USER #{selectedUser.id}</p>
                    <h2>{selectedUser.username}</h2>
                    <div className="inspector-meta">
                      <RoleBadge role={selectedUser.role} />
                      <UserStatusBadge user={selectedUser} />
                      {selectedUser.email && (
                        <span style={{ color: "var(--text-muted)", fontSize: ".72rem" }}>{selectedUser.email}</span>
                      )}
                    </div>
                  </div>
                  <div className="inspector-balance-box">
                    <span>Current Balance</span>
                    <strong>{Number(selectedUser.balance).toLocaleString()} cr</strong>
                  </div>
                </header>

                {/* 1. Modify Balance */}
                {isAdmin && (
                  <div className="inspector-section">
                    <h3>Modify Balance — {selectedUser.username}</h3>
                    <p style={{ margin: "0 0 .55rem", fontSize: ".73rem" }}>
                      Click a quick button to immediately add or remove credits, or enter a custom amount below:
                    </p>
                    <div className="quick-chips">
                      {[100, 500, 1000, 5000].map((amt) => (
                        <button
                          key={`add-${amt}`}
                          type="button"
                          className="button-success"
                          disabled={busy}
                          onClick={() => applyBalanceDelta(selectedUser, amt, `Quick +${amt} credits`)}
                        >
                          +{amt.toLocaleString()}
                        </button>
                      ))}
                      {[-100, -500, -1000].map((amt) => (
                        <button
                          key={`sub-${amt}`}
                          type="button"
                          className="button-danger"
                          disabled={busy || Number(selectedUser.balance) + amt < 0}
                          onClick={() => applyBalanceDelta(selectedUser, amt, `Quick ${amt} credits`)}
                        >
                          {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "grid", gap: ".6rem" }}>
                      <div className="form-row-2">
                        <div>
                          <label htmlFor="admin-balance-amount">Credit Amount</label>
                          <input
                            id="admin-balance-amount"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="e.g. 500"
                            value={balanceAmount}
                            onChange={(e) => setBalanceAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="admin-balance-reason">Reason (optional)</label>
                          <input
                            id="admin-balance-reason"
                            placeholder="Bonus / Correction"
                            maxLength={200}
                            value={balanceReason}
                            onChange={(e) => setBalanceReason(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="moderation-buttons">
                        <button
                          type="button"
                          className="button-success"
                          disabled={busy || !balanceAmount}
                          onClick={() => handleBalanceAction("add")}
                        >
                          + Add Credits
                        </button>
                        <button
                          type="button"
                          className="button-danger"
                          disabled={busy || !balanceAmount}
                          onClick={() => handleBalanceAction("remove")}
                        >
                          − Remove Credits
                        </button>
                        <button
                          type="button"
                          className="button-primary"
                          disabled={busy || balanceAmount === ""}
                          onClick={() => handleBalanceAction("set")}
                        >
                          = Set Exact Balance
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Change Password */}
                {isAdmin && (
                  <div className="inspector-section">
                    <h3>Change Password — {selectedUser.username}</h3>
                    <form onSubmit={handlePasswordReset}>
                      <label htmlFor="admin-reset-password">New Password (min 8 characters)</label>
                      <div className="form-row-2">
                        <input
                          id="admin-reset-password"
                          type="password"
                          minLength={8}
                          maxLength={100}
                          placeholder="Min 8 characters"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          required
                        />
                        <button type="submit" disabled={busy}>
                          Change Password
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 3. Role & Admin Privileges */}
                {isAdmin && (
                  <div className="inspector-section">
                    <h3>Role &amp; Admin Privileges</h3>
                    <form onSubmit={handleRoleUpdate}>
                      <div className="form-row-2">
                        <select
                          aria-label="Select user role"
                          value={roleInput}
                          onChange={(e) => setRoleInput(e.target.value)}
                        >
                          <option value="USER">USER (Player)</option>
                          <option value="MODERATOR">MODERATOR</option>
                          <option value="ADMIN">ADMIN (Administrator)</option>
                        </select>
                        <button type="submit" disabled={busy || roleInput === selectedUser.role}>
                          Update Role
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 4. Ban, Timeout & Moderation */}
                <div className="inspector-section">
                  <h3>Ban, Timeout &amp; Moderator Warnings</h3>
                  {selectedUser.id === user?.id ? (
                    <p style={{ margin: 0, fontSize: ".76rem" }}>
                      You cannot apply moderation actions (ban/timeout/warn) to your own account.
                    </p>
                  ) : (
                    <div>
                      <div className="form-row-2" style={{ marginBottom: ".6rem" }}>
                        <div>
                          <label htmlFor="mod-reason">Warning / Moderation Message</label>
                          <input
                            id="mod-reason"
                            placeholder="Reason sent to user's notifications..."
                            value={modReason}
                            maxLength={500}
                            onChange={(e) => setModReason(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="mod-timeout-hours">Timeout Duration (1–720 hrs)</label>
                          <input
                            id="mod-timeout-hours"
                            type="number"
                            min={1}
                            max={720}
                            value={timeoutHours}
                            onChange={(e) => setTimeoutHours(e.target.value)}
                          />
                        </div>
                      </div>

                      {isUserTimedOut(selectedUser) && (
                        <p style={{ margin: "0 0 .5rem", color: "#f5b95f", fontSize: ".74rem" }}>
                          Currently timed out until {formatDateTime(selectedUser.suspendedUntil)}.
                        </p>
                      )}

                      <div className="moderation-buttons">
                        <button
                          type="button"
                          className="button-primary"
                          disabled={busy}
                          onClick={() => handleModerationAction("warn")}
                        >
                          ⚠️ Send Warning to {selectedUser.username}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleModerationAction("timeout")}
                        >
                          Timeout ({timeoutHours || 24}h)
                        </button>

                        {selectedUser.accountStatus !== "BANNED" && (
                          <button
                            type="button"
                            className="button-danger"
                            disabled={busy}
                            onClick={() => handleModerationAction("ban")}
                          >
                            Ban Account
                          </button>
                        )}

                        {(selectedUser.accountStatus === "BANNED" || isUserTimedOut(selectedUser)) && (
                          <button
                            type="button"
                            className="button-success"
                            disabled={busy}
                            onClick={() => handleModerationAction("unban")}
                          >
                            Unban / Lift Restriction
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Moderation Action History for Selected User */}
                <div className="inspector-section">
                  <h3>Moderation History ({userModActions.length})</h3>
                  {userModActions.length === 0 ? (
                    <p style={{ margin: 0, fontSize: ".75rem" }}>No moderation actions recorded for this user.</p>
                  ) : (
                    <ul className="moderation-history-list">
                      {userModActions.map((act) => (
                        <li key={act.id} className="moderation-history-item">
                          <div className="moderation-history-top">
                            <strong>{act.action}</strong>
                            <span style={{ color: "var(--text-muted)", fontSize: ".68rem" }}>
                              {formatDateTime(act.createdAt)}
                            </span>
                          </div>
                          <div style={{ color: "var(--text-secondary)" }}>{act.reason || "No reason specified"}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: ".67rem", marginTop: ".2rem" }}>
                            By {act.actorUsername}
                            {act.expiresAt ? ` · Expires ${formatDateTime(act.expiresAt)}` : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* TAB: LIVE SPECTATE (for Moderators & Admins) */}
      {activeTab === "spectate" && (
        <div className="admin-two-col">
          <div className="admin-stack">
            <section className="panel admin-table-panel">
              <header className="panel-heading" style={{ marginBottom: ".75rem" }}>
                <div>
                  <h2>
                    <span className="live-dot" aria-hidden="true" /> Ongoing Active Games (
                    {spectateOverview.activeGames.length})
                  </h2>
                  <p style={{ margin: ".2rem 0 0", fontSize: ".75rem" }}>
                    Live feed updates every 1s. Select any active game to watch the table in real time.
                  </p>
                </div>
                <button type="button" onClick={() => loadSpectateData()}>
                  Refresh
                </button>
              </header>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Game</th>
                      <th>Player</th>
                      <th>Bet</th>
                      <th>Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spectateOverview.activeGames.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          No active rounds right now. Start a Blackjack hand in another tab or pick a recent round
                          below to auto-follow that player!
                        </td>
                      </tr>
                    ) : (
                      spectateOverview.activeGames.map((g) => {
                        const isWatching = spectatedGameDetail?.gameId === g.gameId;
                        return (
                          <tr
                            key={g.gameId}
                            className={`admin-user-row ${isWatching ? "is-selected" : ""}`}
                            onClick={() => {
                              setSpectatedGameId(g.gameId);
                              setSpectatedUserId(g.userId);
                              setSpectatedGameDetail(g);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <td>
                              <strong>#{g.gameId}</strong>
                              <span className="user-cell-sub">{g.gameType}</span>
                            </td>
                            <td>
                              <span className="user-cell-primary">{g.username}</span>
                              <span className="user-cell-sub">#{g.userId}</span>
                            </td>
                            <td style={{ fontWeight: 700 }}>{Number(g.bet).toLocaleString()} cr</td>
                            <td>
                              Player <strong>{g.playerTotal}</strong> vs Dealer{" "}
                              <strong>{revealHoleCard ? g.dealerActualTotal : g.dealerVisibleTotal ?? "?"}</strong>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={isWatching ? "button-primary button-sm" : "button-sm"}
                                onClick={() => {
                                  setSpectatedGameId(g.gameId);
                                  setSpectatedUserId(g.userId);
                                  setSpectatedGameDetail(g);
                                }}
                              >
                                {isWatching ? "Watching ●" : "Watch Live"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel admin-table-panel">
              <header className="panel-heading" style={{ marginBottom: ".75rem" }}>
                <div>
                  <h2>Recently Finished Rounds</h2>
                  <p style={{ margin: ".2rem 0 0", fontSize: ".75rem" }}>
                    Inspect settled hands or click &ldquo;Follow Player&rdquo; to automatically spectate their next
                    round.
                  </p>
                </div>
              </header>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Game</th>
                      <th>Player</th>
                      <th>Bet / Payout</th>
                      <th>Outcome</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spectateOverview.recentGames.length === 0 ? (
                      <tr>
                        <td colSpan={5}>No completed rounds recorded yet.</td>
                      </tr>
                    ) : (
                      spectateOverview.recentGames.map((g) => {
                        const isWatching = spectatedGameDetail?.gameId === g.gameId;
                        const net = Number(g.payout || 0) - Number(g.bet || 0);
                        return (
                          <tr
                            key={g.gameId}
                            className={`admin-user-row ${isWatching ? "is-selected" : ""}`}
                            onClick={() => {
                              setSpectatedGameId(g.gameId);
                              setSpectatedUserId(g.userId);
                              setSpectatedGameDetail(g);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <td>#{g.gameId}</td>
                            <td>
                              <strong>{g.username}</strong>{" "}
                              <small style={{ color: "var(--text-muted)" }}>(#{g.userId})</small>
                            </td>
                            <td>
                              {Number(g.bet).toLocaleString()} →{" "}
                              <strong className={net > 0 ? "amount-positive" : net < 0 ? "amount-negative" : ""}>
                                {Number(g.payout).toLocaleString()} cr
                              </strong>
                            </td>
                            <td>
                              <span className="policy-badge">{g.result}</span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={isWatching ? "button-primary button-sm" : "button-sm"}
                                onClick={() => {
                                  setSpectatedGameId(g.gameId);
                                  setSpectatedUserId(g.userId);
                                  setSpectatedGameDetail(g);
                                }}
                              >
                                {isWatching ? "Viewing ✓" : "Inspect / Follow"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: LIVE BLACKJACK SPECTATOR TABLE */}
          <section className="panel spectator-table-panel" aria-label="Live game spectator view">
            {!spectatedGameDetail ? (
              <div>
                <h2>Live Spectator Table</h2>
                <p>No round selected or no games have been played yet. Select an ongoing or recent game on the left.</p>
              </div>
            ) : (
              <>
                <header className="inspector-header">
                  <div>
                    <p className="page-eyebrow">
                      {spectatedGameDetail.gameType} · ROUND #{spectatedGameDetail.gameId}
                    </p>
                    <h2 style={{ display: "flex", alignItems: "center", gap: ".55rem" }}>
                      <span>Spectating {spectatedGameDetail.username}</span>
                      {spectatedGameDetail.status === "ACTIVE" ? (
                        <span className="status-badge status-active">
                          <span className="live-dot" aria-hidden="true" /> LIVE
                        </span>
                      ) : (
                        <span className="status-badge status-timeout">FINISHED</span>
                      )}
                    </h2>
                    <div className="inspector-meta">
                      <span>User #{spectatedGameDetail.userId}</span>
                      <span>·</span>
                      <span>
                        Balance: <strong>{Number(spectatedGameDetail.playerBalance).toLocaleString()} cr</strong>
                      </span>
                      <span>·</span>
                      <span>Shoe: {spectatedGameDetail.remainingDeckCount} cards left</span>
                    </div>
                  </div>
                  <div className="inspector-balance-box">
                    <span>Round Bet</span>
                    <strong>{Number(spectatedGameDetail.bet).toLocaleString()} cr</strong>
                  </div>
                </header>

                {/* Staff Spectator Controls */}
                <div className="spectator-controls-bar">
                  <label className="checkbox-row" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={revealHoleCard}
                      onChange={(e) => setRevealHoleCard(e.target.checked)}
                    />
                    <span>Reveal Dealer Hole Card (Staff X-Ray)</span>
                  </label>

                  <label className="checkbox-row" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={autoFollowPlayer}
                      onChange={(e) => setAutoFollowPlayer(e.target.checked)}
                    />
                    <span>Auto-follow {spectatedGameDetail.username}&apos;s next round</span>
                  </label>

                  <button
                    type="button"
                    className="button-sm"
                    onClick={() =>
                      jumpToModerateUser(spectatedGameDetail.userId, spectatedGameDetail.username)
                    }
                  >
                    Moderate {spectatedGameDetail.username} →
                  </button>
                </div>

                {/* Visual Blackjack Hands */}
                <div className="hand-grid" style={{ marginTop: "1rem" }}>
                  <div className="hand-card dealer-hand">
                    <h3>
                      Dealer{" "}
                      {spectatedGameDetail.status === "ACTIVE" && revealHoleCard && (
                        <small style={{ color: "var(--accent)", fontWeight: 800 }}>(X-RAY)</small>
                      )}
                    </h3>
                    <div className="card-hand" aria-label="Spectated dealer cards">
                      {spectatedGameDetail.status === "ACTIVE" && !revealHoleCard ? (
                        <>
                          {(spectatedGameDetail.dealerVisibleCards || []).map((card, idx) => (
                            <SpectatorCard value={card} key={`dv-${card}-${idx}`} />
                          ))}
                          <SpectatorCard hidden />
                        </>
                      ) : (
                        (spectatedGameDetail.dealerAllCards || []).map((card, idx) => (
                          <SpectatorCard
                            value={card}
                            key={`da-${card}-${idx}`}
                            xray={spectatedGameDetail.status === "ACTIVE" && idx > 0}
                          />
                        ))
                      )}
                    </div>
                    <p>
                      Total{" "}
                      <strong>
                        {spectatedGameDetail.status === "ACTIVE" && !revealHoleCard
                          ? `${spectatedGameDetail.dealerVisibleTotal ?? "?"} (+ hidden)`
                          : spectatedGameDetail.dealerActualTotal}
                      </strong>
                    </p>
                  </div>

                  <div className="hand-card player-hand">
                    <h3>{spectatedGameDetail.username}&apos;s Hand</h3>
                    <div className="card-hand" aria-label="Spectated player cards">
                      {(spectatedGameDetail.playerCards || []).map((card, idx) => (
                        <SpectatorCard value={card} key={`p-${card}-${idx}`} />
                      ))}
                    </div>
                    <p>
                      Total <strong>{spectatedGameDetail.playerTotal}</strong>
                    </p>
                  </div>
                </div>

                {/* Round Summary Telemetry */}
                <div className="round-summary" style={{ marginTop: "1rem" }}>
                  <p>
                    Status <strong>{spectatedGameDetail.status}</strong>
                  </p>
                  <p>
                    Bet <strong>{Number(spectatedGameDetail.bet).toLocaleString()} credits</strong>
                  </p>
                  <p>
                    Payout <strong>{Number(spectatedGameDetail.payout).toLocaleString()} credits</strong>
                  </p>
                  <p>
                    Result{" "}
                    <strong
                      className={
                        spectatedGameDetail.status === "ACTIVE"
                          ? ""
                          : spectatedGameDetail.payout > spectatedGameDetail.bet
                          ? "amount-positive"
                          : spectatedGameDetail.payout === spectatedGameDetail.bet
                          ? "amount-neutral"
                          : "amount-negative"
                      }
                    >
                      {blackjackResultLabels[spectatedGameDetail.result] || spectatedGameDetail.result}
                    </strong>
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: ".5rem",
                    marginTop: ".9rem",
                    paddingTop: ".75rem",
                    borderTop: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontSize: ".7rem"
                  }}
                >
                  <span>Started: {formatDateTime(spectatedGameDetail.createdAt)}</span>
                  <span>
                    {spectatedGameDetail.finishedAt
                      ? `Finished: ${formatDateTime(spectatedGameDetail.finishedAt)}`
                      : "Waiting for player action (Hit / Stand)..."}
                  </span>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: GIFTCODES */}
      {activeTab === "codes" && isAdmin && (
        <div className="admin-two-col">
          <section className="panel admin-table-panel">
            <header className="panel-heading" style={{ marginBottom: ".85rem" }}>
              <h2>Existing Giftcodes</h2>
              <button type="button" onClick={() => loadCodes(codesPage.page)}>
                Refresh
              </button>
            </header>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Amount</th>
                    <th>Policy</th>
                    <th>Uses</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {codesPage.codes.length === 0 ? (
                    <tr>
                      <td colSpan={7}>No giftcodes created yet.</td>
                    </tr>
                  ) : (
                    codesPage.codes.map((c) => (
                      <tr key={c.code}>
                        <td>
                          <span className="code-pill">{c.code}</span>
                        </td>
                        <td className="amount-positive">+{Number(c.amount).toLocaleString()} cr</td>
                        <td>
                          <span className="policy-badge">{c.redemptionPolicy}</span>
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {Number(c.usedCount || 0).toLocaleString()} /{" "}
                          {c.maxUses != null ? Number(c.maxUses).toLocaleString() : "∞"}
                        </td>
                        <td>{c.expiresAt ? formatDateTime(c.expiresAt) : "Never"}</td>
                        <td>
                          <CodeStatusBadge code={c} />
                        </td>
                        <td>
                          <div className="row-actions">
                            <button type="button" onClick={() => handleCopyCode(c.code)}>
                              Copy
                            </button>
                            {c.active && (
                              <button
                                type="button"
                                className="button-danger"
                                disabled={busy}
                                onClick={() => handleDeactivateCode(c.code)}
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <footer className="history-pagination" style={{ paddingBottom: 0 }}>
              <p>
                Page {codesPage.totalPages === 0 ? 0 : codesPage.page + 1} of {codesPage.totalPages} (
                {codesPage.totalElements} codes)
              </p>
              <div>
                <button
                  type="button"
                  disabled={codesPage.page <= 0}
                  onClick={() => loadCodes(codesPage.page - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={codesPage.page + 1 >= codesPage.totalPages}
                  onClick={() => loadCodes(codesPage.page + 1)}
                >
                  Next
                </button>
              </div>
            </footer>
          </section>

          <section className="panel">
            <h2>Create Giftcode</h2>
            <p style={{ marginTop: "-.35rem", fontSize: ".78rem" }}>
              Generate a credit redemption code for players. Leave the code name empty to auto-generate a secure{" "}
              <code>CAS-...</code> code.
            </p>

            <div className="quick-chips">
              {[100, 250, 500, 1000, 5000, 10000].map((preset) => (
                <button key={preset} type="button" onClick={() => setCodeAmount(String(preset))}>
                  {preset.toLocaleString()} cr
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateCode}>
              <div>
                <label htmlFor="giftcode-custom">Custom Code Name (optional, 3–32 chars)</label>
                <input
                  id="giftcode-custom"
                  placeholder="Leave blank to auto-generate (e.g. WELCOME500)"
                  maxLength={32}
                  value={codeCustomName}
                  onChange={(e) => setCodeCustomName(e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-row-2">
                <div>
                  <label htmlFor="giftcode-amount">Credit Amount</label>
                  <input
                    id="giftcode-amount"
                    type="number"
                    min={1}
                    max={1000000000}
                    value={codeAmount}
                    onChange={(e) => setCodeAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="giftcode-policy">Redemption Policy</label>
                  <select
                    id="giftcode-policy"
                    value={codePolicy}
                    onChange={(e) => {
                      setCodePolicy(e.target.value);
                      if (e.target.value === "ONCE_TOTAL") setCodeMaxUses("1");
                    }}
                  >
                    <option value="ONCE_PER_USER">ONCE_PER_USER (1 per player)</option>
                    <option value="LIMITED_USES">LIMITED_USES (Capped total uses)</option>
                    <option value="ONCE_TOTAL">ONCE_TOTAL (Single use total)</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div>
                  <label htmlFor="giftcode-max-uses">
                    Max Total Uses {codePolicy === "LIMITED_USES" ? "(required)" : "(optional)"}
                  </label>
                  <input
                    id="giftcode-max-uses"
                    type="number"
                    min={1}
                    disabled={codePolicy === "ONCE_TOTAL"}
                    placeholder={codePolicy === "ONCE_TOTAL" ? "1" : "Unlimited"}
                    value={codePolicy === "ONCE_TOTAL" ? "1" : codeMaxUses}
                    onChange={(e) => setCodeMaxUses(e.target.value)}
                    required={codePolicy === "LIMITED_USES"}
                  />
                </div>
                <div>
                  <label htmlFor="giftcode-expires">Expires At (optional)</label>
                  <input
                    id="giftcode-expires"
                    type="datetime-local"
                    value={codeExpiresAt}
                    onChange={(e) => setCodeExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" disabled={busy}>
                Create Giftcode
              </button>
            </form>

            {lastCreatedCode && (
              <div className="created-code-highlight">
                <div>
                  <span style={{ display: "block", fontSize: ".68rem", color: "var(--text-muted)" }}>
                    LATEST CREATED GIFTCODE
                  </span>
                  <strong className="code-pill" style={{ marginTop: ".25rem" }}>
                    {lastCreatedCode.code}
                  </strong>{" "}
                  <span className="amount-positive" style={{ fontSize: ".8rem", marginLeft: ".4rem" }}>
                    +{Number(lastCreatedCode.amount).toLocaleString()} credits
                  </span>
                </div>
                <button type="button" onClick={() => handleCopyCode(lastCreatedCode.code)}>
                  Copy Code
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: NEWS & NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="admin-two-col">
          <section className="panel admin-table-panel">
            <header className="panel-heading" style={{ marginBottom: ".85rem" }}>
              <div>
                <h2>Published News, Warnings &amp; Notifications</h2>
                <p style={{ margin: ".2rem 0 0", fontSize: ".75rem" }}>
                  All broadcasts and user notifications delivered to players&apos; notification bells.
                </p>
              </div>
              <button type="button" onClick={() => loadModerationNotifications(notifsPage.page)}>
                Refresh
              </button>
            </header>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Audience</th>
                    <th>Title &amp; Message</th>
                    <th>From</th>
                    <th>Sent</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notifsPage.notifications.length === 0 ? (
                    <tr>
                      <td colSpan={7}>No notifications published yet.</td>
                    </tr>
                  ) : (
                    notifsPage.notifications.map((n) => (
                      <tr key={n.id}>
                        <td>#{n.id}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              n.category === "WARNING"
                                ? "status-banned"
                                : n.category === "BALANCE"
                                ? "status-active"
                                : "status-timeout"
                            }`}
                          >
                            {n.category}
                          </span>
                        </td>
                        <td>
                          {n.targetUserId == null ? (
                            <strong>All Players</strong>
                          ) : (
                            <span>User #{n.targetUserId}</span>
                          )}
                        </td>
                        <td style={{ maxWidth: "340px", whiteSpace: "normal" }}>
                          <strong style={{ color: "var(--text-primary)", display: "block" }}>{n.title}</strong>
                          <span>{n.message}</span>
                        </td>
                        <td>{n.actorUsername}</td>
                        <td>{formatDateTime(n.createdAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="button-danger button-sm"
                            disabled={busy}
                            onClick={() => handleDeleteNotification(n.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <h2>Send News, Warning or Announcement</h2>
            <p style={{ marginTop: "-.35rem", fontSize: ".78rem" }}>
              Broadcast casino news to every player or send a direct warning/notification to a specific account.
            </p>
            <form onSubmit={handlePublishNotification}>
              <div className="form-row-2">
                <div>
                  <label htmlFor="notif-category">Category</label>
                  <select
                    id="notif-category"
                    value={notifCategory}
                    onChange={(e) => setNotifCategory(e.target.value)}
                  >
                    <option value="NEWS">NEWS (Casino News &amp; Promos)</option>
                    <option value="WARNING">WARNING (Urgent Alert / Warning)</option>
                    <option value="SYSTEM">SYSTEM (Maintenance / System Update)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="notif-audience">Recipient</label>
                  <select
                    id="notif-audience"
                    value={notifTargetUserId}
                    onChange={(e) => setNotifTargetUserId(e.target.value)}
                  >
                    <option value="">All Players (Global Broadcast)</option>
                    {usersPage.users.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {u.username} (#{u.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="notif-title">Headline / Title</label>
                <input
                  id="notif-title"
                  maxLength={140}
                  placeholder="e.g. Weekend Blackjack Bonus Event!"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="notif-message">Message Content</label>
                <textarea
                  id="notif-message"
                  rows={4}
                  maxLength={1000}
                  placeholder="Write your news announcement or warning message..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={busy}>
                Publish Notification
              </button>
            </form>
          </section>
        </div>
      )}

      {/* TAB 4: GAMES & LIMITS (from AdminGameController /api/admin/games) */}
      {activeTab === "games" && isAdmin && (
        <section className="panel">
          <header className="panel-heading" style={{ marginBottom: "1rem" }}>
            <div>
              <h2>Game Catalog &amp; Betting Limits</h2>
              <p style={{ margin: ".25rem 0 0", fontSize: ".78rem" }}>
                Enable or disable games across the casino and configure maximum single-round bet limits.
              </p>
            </div>
            <button type="button" onClick={loadGames}>
              Refresh
            </button>
          </header>

          <div className="games-admin-grid">
            {gamesConfig.length === 0 ? (
              <p>No configured games found.</p>
            ) : (
              gamesConfig.map((g) => {
                const edit = gameEdits[g.gameType] || { enabled: g.enabled, maxBet: String(g.maxBet) };
                return (
                  <article key={g.gameType} className="panel game-admin-card" style={{ background: "var(--bg-subtle)" }}>
                    <header className="panel-heading">
                      <div>
                        <p className="page-eyebrow">GAME TYPE</p>
                        <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{g.gameType}</h3>
                      </div>
                      <span className={`status-badge ${g.enabled ? "status-active" : "status-inactive"}`}>
                        {g.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </header>

                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={Boolean(edit.enabled)}
                        onChange={(e) =>
                          setGameEdits((prev) => ({
                            ...prev,
                            [g.gameType]: { ...edit, enabled: e.target.checked }
                          }))
                        }
                      />
                      <span>Allow players to start new {g.gameType} rounds</span>
                    </label>

                    <div>
                      <label htmlFor={`max-bet-${g.gameType}`}>Maximum Bet (1 – 1,000,000 credits)</label>
                      <input
                        id={`max-bet-${g.gameType}`}
                        type="number"
                        min={1}
                        max={1000000}
                        value={edit.maxBet}
                        onChange={(e) =>
                          setGameEdits((prev) => ({
                            ...prev,
                            [g.gameType]: { ...edit, maxBet: e.target.value }
                          }))
                        }
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: ".5rem"
                      }}
                    >
                      <small style={{ color: "var(--text-muted)", fontSize: ".68rem" }}>
                        Updated: {formatDateTime(g.updatedAt)}
                      </small>
                      <button
                        type="button"
                        className="button-primary"
                        disabled={busy}
                        onClick={() => handleSaveGameConfig(g.gameType)}
                      >
                        Save Settings
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* TAB 5: PLAYER REPORTS (from ModerationController /api/moderation/user-reports) */}
      {activeTab === "reports" && (
        <section className="panel admin-table-panel">
          <header className="panel-heading" style={{ marginBottom: "1rem" }}>
            <div>
              <h2>Player Reports Queue</h2>
              <p style={{ margin: ".25rem 0 0", fontSize: ".78rem" }}>
                Review misconduct reports submitted by players and take moderation action.
              </p>
            </div>
            <div className="admin-toolbar" style={{ marginBottom: 0 }}>
              <select
                aria-label="Filter reports by status"
                value={reportStatusFilter}
                onChange={(e) => {
                  setReportStatusFilter(e.target.value);
                  loadReports(0, e.target.value);
                }}
              >
                <option value="OPEN">OPEN Reports</option>
                <option value="REVIEWED">REVIEWED Reports</option>
                <option value="DISMISSED">DISMISSED Reports</option>
              </select>
              <button type="button" onClick={() => loadReports(reportsPage.page, reportStatusFilter)}>
                Refresh
              </button>
            </div>
          </header>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Reported User</th>
                  <th>Reporter</th>
                  <th>Reason</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportsPage.reports.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No {reportStatusFilter.toLowerCase()} player reports.</td>
                  </tr>
                ) : (
                  reportsPage.reports.map((r) => (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td>
                        <strong>{r.targetUsername}</strong>{" "}
                        {r.targetUserId && <small style={{ color: "var(--text-muted)" }}>(#{r.targetUserId})</small>}
                      </td>
                      <td>{r.reporterUsername}</td>
                      <td style={{ maxWidth: "320px", whiteSpace: "normal" }}>{r.reason}</td>
                      <td>{formatDateTime(r.createdAt)}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            r.status === "OPEN"
                              ? "status-timeout"
                              : r.status === "REVIEWED"
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            onClick={() => jumpToModerateUser(r.targetUserId, r.targetUsername)}
                          >
                            Moderate User
                          </button>
                          {r.status !== "REVIEWED" && (
                            <button
                              type="button"
                              className="button-success"
                              disabled={busy}
                              onClick={() => handleUpdateReportStatus(r.id, "REVIEWED")}
                            >
                              Mark Reviewed
                            </button>
                          )}
                          {r.status !== "DISMISSED" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleUpdateReportStatus(r.id, "DISMISSED")}
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="history-pagination" style={{ paddingBottom: 0 }}>
            <p>
              Page {reportsPage.totalPages === 0 ? 0 : reportsPage.page + 1} of {reportsPage.totalPages} (
              {reportsPage.totalElements} reports)
            </p>
            <div>
              <button
                type="button"
                disabled={reportsPage.page <= 0}
                onClick={() => loadReports(reportsPage.page - 1, reportStatusFilter)}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={reportsPage.page + 1 >= reportsPage.totalPages}
                onClick={() => loadReports(reportsPage.page + 1, reportStatusFilter)}
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      )}

      {/* TAB 6: AUDIT LOGS (from AdminAuditController /api/admin/logs) */}
      {activeTab === "logs" && isAdmin && (
        <section className="panel admin-table-panel">
          <header className="panel-heading" style={{ marginBottom: "1rem" }}>
            <div>
              <h2>Staff Audit Logs</h2>
              <p style={{ margin: ".25rem 0 0", fontSize: ".78rem" }}>
                Complete audit trail of administrative and moderation actions.
              </p>
            </div>
            <button type="button" onClick={() => loadLogs(logsPage.page)}>
              Refresh
            </button>
          </header>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logsPage.logs.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No audit log entries recorded yet.</td>
                  </tr>
                ) : (
                  logsPage.logs.map((log) => (
                    <tr key={log.id}>
                      <td>#{log.id}</td>
                      <td>{formatDateTime(log.createdAt)}</td>
                      <td>
                        <strong>{log.actorUsername}</strong>{" "}
                        <small style={{ color: "var(--text-muted)" }}>(#{log.actorUserId})</small>
                      </td>
                      <td>
                        <span className="policy-badge">{log.action}</span>
                      </td>
                      <td>
                        {log.targetType} {log.targetId ? `#${log.targetId}` : ""}
                      </td>
                      <td style={{ maxWidth: "380px", whiteSpace: "normal" }}>{log.details || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="history-pagination" style={{ paddingBottom: 0 }}>
            <p>
              Page {logsPage.totalPages === 0 ? 0 : logsPage.page + 1} of {logsPage.totalPages} (
              {logsPage.totalElements} events)
            </p>
            <div>
              <button
                type="button"
                disabled={logsPage.page <= 0}
                onClick={() => loadLogs(logsPage.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={logsPage.page + 1 >= logsPage.totalPages}
                onClick={() => loadLogs(logsPage.page + 1)}
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      )}
    </main>
  );
}
