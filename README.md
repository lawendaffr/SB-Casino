# Casino Project

## Requirements

- Git
- Docker Desktop
- Python (optional, for frontend-only work)

## Setup

### 1. Clone

git clone ...
cd SB-Casino
### 2. Create .env
copy .env.example
rename to .env
change values to your liking

### 3. Start app

docker compose up --build -d

### 4. View app

localhost:8080  

happi

## Frontend files

The editable frontend is in the repository-root `frontend/` directory. Docker Compose mounts it into the backend container, and Spring serves it at `http://localhost:8080`. Frontend file edits are picked up without rebuilding the image; rebuild after backend changes with `docker compose up --build -d`.

Use the same frontend with mock data without Docker or a backend:

```powershell
cd frontend
python -m http.server 5500
```

Open `http://localhost:5500/?api=mock`. The choice is saved in this browser, and sample account, balance, game, and transaction data are stored in local storage. To switch back to the real backend, open `http://localhost:8080/?api=live` while Compose is running. These mode links also work when the frontend is served by Spring.

When running Spring Boot from IntelliJ, set the working directory to `kasynobackend`; Spring will resolve the default `../frontend/` location from there.

## Frontend stylesheets

Shared theme tokens, navigation, controls, and tables live in `frontend/css/base.css`. Each page loads its own stylesheet alongside it: `home.css`, `auth.css`, `dashboard.css`, `blackjack.css`, `history.css`, or `deposit.css`. Put new page-only layout rules in that page's stylesheet so the shared base stays small.
