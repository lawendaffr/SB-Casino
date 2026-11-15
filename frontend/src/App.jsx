import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import { GamesPage, HomePage } from "./games.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import BlackjackPage from "./pages/BlackjackPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DepositPage from "./pages/DepositPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";

function RouteShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const pageClasses = {
      "/": "home-page",
      "/games": "games-page page-games",
      "/login": "page-auth",
      "/dashboard": "page-dashboard",
      "/blackjack": "page-blackjack",
      "/history": "page-history",
      "/deposit": "page-deposit"
    };
    document.body.className = pageClasses[pathname] || "page-not-found";
    document.title = `${pathname === "/" ? "Home" : pathname.slice(1).replace(/^./, (letter) => letter.toUpperCase())} - SB-Casino`;
  }, [pathname]);

  useEffect(() => {
    const handleExpiredSession = () => navigate("/login");
    window.addEventListener("casino:auth-expired", handleExpiredSession);
    return () => window.removeEventListener("casino:auth-expired", handleExpiredSession);
  }, [navigate]);

  return <>
    <Navbar />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/games" element={<GamesPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/blackjack" element={<BlackjackPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/deposit" element={<DepositPage />} />
      <Route path="*" element={<main className="page-main"><h1>Page not found</h1></main>} />
    </Routes>
  </>;
}

export default function App() {
  return <RouteShell />;
}
