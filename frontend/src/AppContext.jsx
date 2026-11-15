import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiReady, apiRequest } from "./api.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [balance, setBalanceState] = useState(null);

  const setBalance = useCallback((value) => {
    setBalanceState(value);
    setUser((current) => current ? { ...current, balance: value } : current);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem("accessToken")) {
      setUser(null);
      setBalanceState(null);
      setIsAuthenticated(false);
      return null;
    }
    const current = await apiRequest("/api/users/me");
    setUser(current);
    setBalanceState(current.balance);
    setIsAuthenticated(true);
    return current;
  }, []);

  const refreshBalance = useCallback(async () => {
    const current = await apiRequest("/api/users/me/balance");
    setBalance(current.balance);
    return current.balance;
  }, [setBalance]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (refreshToken) {
        await apiRequest("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken })
        }, false);
      }
    } catch (error) {
      console.warn("Logout request failed:", error);
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setBalanceState(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    let current = true;
    apiReady.then(async () => {
      if (!current) return;
      const authenticated = Boolean(localStorage.getItem("accessToken"));
      setIsAuthenticated(authenticated);
      if (authenticated) {
        try { await refreshUser(); }
        catch { if (current) setIsAuthenticated(false); }
      }
    });
    return () => { current = false; };
  }, [refreshUser]);

  useEffect(() => {
    const expire = () => {
      setUser(null);
      setBalanceState(null);
      setIsAuthenticated(false);
    };
    window.addEventListener("casino:auth-expired", expire);
    return () => window.removeEventListener("casino:auth-expired", expire);
  }, []);

  const value = useMemo(() => ({
    user, balance, setBalance, isAuthenticated, setIsAuthenticated,
    refreshUser, refreshBalance, logout
  }), [user, balance, setBalance, isAuthenticated, refreshUser, refreshBalance, logout]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
