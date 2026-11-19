import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiReady, apiRequest, clearAuthTokens, getAccessToken, getRefreshToken } from "./api.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [balance, setBalanceState] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadWarningsCount, setUnreadWarningsCount] = useState(0);

  const setBalance = useCallback((value) => {
    setBalanceState(value);
    setUser((current) => (current ? { ...current, balance: value } : current));
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!getAccessToken()) {
      setNotifications([]);
      setUnreadCount(0);
      setUnreadWarningsCount(0);
      return null;
    }
    try {
      const data = await apiRequest("/api/users/me/notifications?limit=40");
      const list = Array.isArray(data?.notifications) ? data.notifications : [];
      setNotifications(list);
      setUnreadCount(Number(data?.unreadCount ?? list.filter((n) => !n.read).length));
      setUnreadWarningsCount(
        Number(
          data?.unreadWarningsCount ??
            list.filter((n) => !n.read && n.category === "WARNING").length
        )
      );
      return data;
    } catch {
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setBalanceState(null);
      setIsAuthenticated(false);
      setNotifications([]);
      setUnreadCount(0);
      setUnreadWarningsCount(0);
      return null;
    }
    const current = await apiRequest("/api/users/me");
    setUser(current);
    setBalanceState(current.balance);
    setIsAuthenticated(true);
    refreshNotifications();
    return current;
  }, [refreshNotifications]);

  const refreshBalance = useCallback(async () => {
    const current = await apiRequest("/api/users/me");
    setUser(current);
    setBalanceState(current.balance);
    setIsAuthenticated(true);
    return current.balance;
  }, []);

  const markNotificationRead = useCallback(
    async (notificationId) => {
      try {
        await apiRequest(`/api/users/me/notifications/${notificationId}/read`, {
          method: "POST"
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        await refreshNotifications();
      } catch (error) {
        console.warn("Could not mark notification read:", error);
      }
    },
    [refreshNotifications]
  );

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await apiRequest("/api/users/me/notifications/read-all", {
        method: "POST"
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      setUnreadWarningsCount(0);
    } catch (error) {
      console.warn("Could not mark all notifications read:", error);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await apiRequest(
          "/api/auth/logout",
          {
            method: "POST",
            body: JSON.stringify({ refreshToken })
          },
          false
        );
      }
    } catch (error) {
      console.warn("Logout request failed:", error);
    }
    clearAuthTokens();
    setUser(null);
    setBalanceState(null);
    setIsAuthenticated(false);
    setNotifications([]);
    setUnreadCount(0);
    setUnreadWarningsCount(0);
  }, []);

  useEffect(() => {
    let current = true;
    apiReady.then(async () => {
      if (!current) return;
      const authenticated = Boolean(getAccessToken());
      setIsAuthenticated(authenticated);
      if (authenticated) {
        try {
          await refreshUser();
        } catch {
          if (current) setIsAuthenticated(false);
        }
      }
    });
    return () => {
      current = false;
    };
  }, [refreshUser]);

  // Real-time background sync for user balance, role, and notifications (warnings, news, balance updates)
  useEffect(() => {
    if (!isAuthenticated) return;

    const syncNow = () => {
      if (!getAccessToken()) return;
      refreshUser().catch(() => {});
    };

    const intervalId = window.setInterval(syncNow, 2500);
    const onFocus = () => syncNow();
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncNow();
    };
    const onDataSync = () => syncNow();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("casino:data-sync", onDataSync);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("casino:data-sync", onDataSync);
    };
  }, [isAuthenticated, refreshUser]);

  useEffect(() => {
    const expire = () => {
      setUser(null);
      setBalanceState(null);
      setIsAuthenticated(false);
      setNotifications([]);
      setUnreadCount(0);
      setUnreadWarningsCount(0);
    };
    window.addEventListener("casino:auth-expired", expire);
    return () => window.removeEventListener("casino:auth-expired", expire);
  }, []);

  const value = useMemo(
    () => ({
      user,
      balance,
      setBalance,
      isAuthenticated,
      setIsAuthenticated,
      refreshUser,
      refreshBalance,
      notifications,
      unreadCount,
      unreadWarningsCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      logout
    }),
    [
      user,
      balance,
      setBalance,
      isAuthenticated,
      refreshUser,
      refreshBalance,
      notifications,
      unreadCount,
      unreadWarningsCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      logout
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
