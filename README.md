# Casino Project

## Requirements

- Git
- Docker Desktop for the full app
- Node.js 20+ and npm for frontend-only development

## Setup

### 1. Clone

git clone ...
cd SB-Casino
### 2. Create .env

Copy `.env.example` to `.env` and adjust the values if needed.

### 3. Start the app

```sh
docker compose up --build -d
```

### 4. Open the app

Open `http://localhost:8080`. Nginx serves the React frontend and forwards `/api` requests to Spring. The backend API is also available at `http://localhost:8081` for local frontend development.

## Frontend development

The React app lives in the repository-root `frontend/` directory. From that directory run:

```sh
npm install
npm run dev
```

Vite opens at `http://localhost:5173` and proxies API requests to the Compose backend on port `8081`. Override the target with `VITE_DEV_API_TARGET` if the backend is running elsewhere. For UI work without Docker or a backend, open `http://localhost:5173/?api=mock`; mock account, balance, history, and Blackjack data are saved in browser local storage. Use `?api=live` to switch back to the backend.

## Project structure

- `frontend/src/` — React app, routes, shared components, and API client
- `frontend/css/` — shared and page-specific styles
- `kasynobackend/` — Spring API and PostgreSQL integration
- `docker-compose.yml` — PostgreSQL, Spring API, and Nginx frontend services
