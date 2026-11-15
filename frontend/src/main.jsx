import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./AppContext.jsx";
import App from "./App.jsx";
import "../css/base.css";
import "../css/home.css";
import "../css/games.css";
import "../css/auth.css";
import "../css/dashboard.css";
import "../css/blackjack.css";
import "../css/history.css";
import "../css/deposit.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider><App /></AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
