# Frontend demo

This folder mirrors the current `frontend/` HTML, components, and page scripts. The account, dashboard, Blackjack, history, and redeem pages use the same HTML and page scripts as the real frontend. `js/api.js` provides local mock API responses; `js/navbar.js` inserts the same navbar markup locally so it does not depend on a component fetch. No backend is contacted. The home page intentionally has no navbar, and the demo navbar keeps all player page links visible for styling.

There is no stylesheet or styling in this demo. The pages use the same unstyled HTML as the current frontend so you can build the presentation yourselves.

## Run

Start a static file server from this folder, for example:

```powershell
python -m http.server 5500
```

Open `http://localhost:5500`. The demo starts with its sample player signed in so every page is visible in the top navbar. Use any username and password on the account page to simulate signing in, or use the register form to create a local mock account.

Try redeeming `WELCOME500` or `LUCKY250`. Blackjack rounds, account balance, transactions, game history, and redeemed codes are stored in local storage. To reset the mock data, run `localStorage.removeItem("sbCasinoMockBackend")` in the browser console for the demo page. You can also clear `accessToken` and `refreshToken` there to reset the mock login.
