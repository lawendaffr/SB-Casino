# API Documentation

## Base URL

```text
http://localhost:8080
```

All API endpoints are prefixed with `/api`.

---

## Authentication

The API uses:

* **JWT access tokens** for authenticated requests
* **Refresh tokens** for obtaining new access tokens
* **BCrypt** for password hashing

### Access token

After logging in, the server returns an access token.

Send it with authenticated requests using:

```http
Authorization: Bearer <access-token>
```

Access tokens expire after **15 minutes**.

### Refresh token

Refresh tokens are long-lived tokens stored as SHA-256 hashes in the database.

The current refresh token is invalidated whenever it is used to obtain a new one. The server returns a replacement refresh token.

Refresh tokens expire after **30 days**.

---

# Auth API

## Register

Creates a new user account.

### Request

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "username": "testuser",
  "password": "password123",
  "email": "testuser@example.com"
}
```

### Validation

| Field      | Requirements               |
| ---------- | -------------------------- |
| `username` | Required, 3–50 characters  |
| `password` | Required, 8–100 characters |
| `email`    | Optional, valid email address |

New users:

* receive the `USER` role
* start with **1000 credits**
* have their password stored as a BCrypt hash

The client cannot choose the user's role.

### Response

**201 Created**

```json
{
  "id": 1,
  "username": "testuser",
  "balance": 1000
}
```

### Errors

**400 Bad Request**

Invalid or missing fields.

**409 Conflict**

Username is already in use.

---

## Login

Authenticates an existing user.

### Request

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "username": "testuser",
  "password": "password123"
}
```

### Response

**200 OK**

```json
{
  "accessToken": "<jwt-access-token>",
  "refreshToken": "<refresh-token>"
}
```

The access token contains the user's ID and username.

The user's role is loaded from the database when the access token is used rather than stored in the JWT.

### Errors

**400 Bad Request**

Invalid or missing fields.

**401 Unauthorized**

Invalid username or password.

---

## Refresh Access Token

Obtains a new access token using a valid refresh token.

The old refresh token is invalidated and replaced with a new refresh token.

### Request

```http
POST /api/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "<refresh-token>"
}
```

### Response

**200 OK**

```json
{
  "accessToken": "<new-jwt-access-token>",
  "refreshToken": "<new-refresh-token>"
}
```

The previous refresh token can no longer be used after successful rotation.

### Errors

**400 Bad Request**

Refresh token is missing or empty.

**401 Unauthorized**

The refresh token is invalid or expired.

---

## Logout

Revokes the supplied refresh token.

### Request

```http
POST /api/auth/logout
Content-Type: application/json
```

```json
{
  "refreshToken": "<refresh-token>"
}
```

### Response

**204 No Content**

No response body is returned.

### Errors

**400 Bad Request**

Refresh token is missing or empty.

---

# Authorization

The API currently defines three user roles:

```text
USER
MODERATOR
ADMIN
```

Roles are stored in the database.
### Current access rules

| Endpoint        | Access              |
| --------------- | ------------------- |
| `/api/auth/**`  | Public              |
| `/api/test/**`  | Public              |
| `/api/admin/**` | `ADMIN` only        |
| `/api/moderation/**` | `MODERATOR` or `ADMIN` |
| Other endpoints | Authenticated users |

Requests without a valid access token receive:

```text
401 Unauthorized
```

Authenticated users without sufficient permissions receive:

```text
403 Forbidden
```

---

# User endpoints

The following endpoints require an access token in the `Authorization: Bearer <access-token>` header unless the endpoint is explicitly marked public.

## Current user and balance

`GET /api/users/me` returns the signed-in user's ID, username, and current credit balance:

```http
GET /api/users/me
Authorization: Bearer <access-token>
```

```json
{
  "id": 12,
  "username": "player1",
  "balance": 1000
}
```

`GET /api/users/me/balance` returns just the current balance:

```json
{
  "balance": 1000
}
```

Both endpoints return data for the authenticated user; the client does not send a user ID.

## Transaction history

`GET /api/users/me/transactions` returns the signed-in user's balance transactions, newest first. Amounts are non-negative; use `type`, `balanceBefore`, and `balanceAfter` to understand whether the transaction added or removed credits.

```json
[
  {
    "id": 81,
    "type": "GAME_BET",
    "amount": 100,
    "balanceBefore": 1000,
    "balanceAfter": 900,
    "description": "BLACKJACK bet",
    "createdAt": "2026-10-14T13:10:00"
  }
]
```

## Account management

* `GET /api/users/me/account` returns the current username and email (use `GET /api/users/me` when you also need the balance).
* `PATCH /api/users/me/account` can update `username`, `email`, or `newPassword`. To change a password, send `currentPassword` and `newPassword` together. Changing the password revokes refresh tokens.
* `DELETE /api/users/me` permanently deletes the account and its balance transactions, game history, and refresh tokens. Send `{"currentPassword":"..."}` to confirm. The final admin account cannot delete itself.
* `GET /api/users/me/moderation-actions?page=0&size=20` shows warnings and other moderation actions on the current account.

## Find and report users

* `GET /api/users/search?q=name&page=0&size=20` searches public usernames.
* `GET /api/users/{userId}/profile` returns a public profile with completed-game statistics.
* `POST /api/users/reports` submits a report: `{"targetUserId": 12, "reason": "..."}`. Self-reports are rejected.

## List your games

Returns game records across all game types, newest first. Active games are included.

```http
GET /api/users/me/games?page=0&size=20
Authorization: Bearer <access-token>
```

`page` is zero-based. `size` defaults to 20 and must be between 1 and 100.

```json
{
  "games": [
    {
      "id": 42,
      "gameType": "BLACKJACK",
      "status": "COMPLETED",
      "bet": 100,
      "payout": 200,
      "netResult": 100,
      "result": "PLAYER_WIN",
      "createdAt": "2026-10-14T13:10:00",
      "finishedAt": "2026-10-14T13:12:00"
    }
  ],
  "page": 0,
  "pageSize": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

`payout` is the total amount returned to the player; `netResult` is `payout - bet` for completed games and `null` while active. Active games have a `null` `finishedAt`.

Invalid pagination values receive `400 Bad Request`.

## Player statistics

`GET /api/users/me/stats` returns totals from completed shared game records:

```json
{
  "gamesPlayed": 8,
  "wins": 4,
  "losses": 3,
  "pushes": 1,
  "totalBet": 800,
  "totalPayout": 900,
  "netResult": 100
}
```

## Leaderboard

`GET /api/users/leaderboard?page=0&size=20` is available to authenticated users. It is paginated and ranks users by completed-game net result, highest first.

## Moderation reports

`GET /api/moderation/reports` is available to moderators and admins. It summarizes user count and active/completed game counts, total bets, payouts, and net result. Monetary totals use completed shared game records.

`GET /api/moderation/users?page=0&size=20` lists user accounts for moderators and admins without exposing password hashes.

Moderators and admins can also search users with `GET /api/moderation/users?q=name&page=0&size=20`. They can review user-submitted reports with `GET /api/moderation/user-reports?status=OPEN&page=0&size=20` and update a report using `PATCH /api/moderation/user-reports/{reportId}` with `{"status":"REVIEWED"}` or `{"status":"DISMISSED"}`.

Enforcement endpoints are `POST /api/moderation/users/{userId}/warn`, `/timeout`, `/ban`, and `/unban`. Each takes a reason; timeout also takes `hours` from 1 to 720. Bans and active timeouts block login and reject requests using existing access tokens. Moderators can act on player accounts; only admins can moderate moderator/admin accounts. Action history is available at `GET /api/moderation/users/{userId}/actions?page=0&size=20`.

## Admin user management

These endpoints require the `ADMIN` role:

* `GET /api/admin/users?page=0&size=20` lists users without exposing password hashes.
* `PATCH /api/admin/users/{userId}/balance` adjusts a balance. Send a signed non-zero `amount` and optional reason, for example `{"amount": 250, "reason": "Support correction"}`. Negative adjustments cannot reduce a balance below zero.
* `PATCH /api/admin/users/{userId}/role` changes a role, for example `{"role": "MODERATOR"}`.
* `GET /api/admin/logs?page=0&size=20` lists audited staff actions.
* `GET /api/admin/codes?page=0&size=20` lists deposit codes; existing create and deactivate endpoints remain available.
* `GET /api/admin/games` lists configured games. `PATCH /api/admin/games/{gameType}` updates availability and maximum bet, for example `{"enabled":false,"maxBet":100000}`. The current Blackjack maximum is capped at 1,000,000 credits.

Players can see currently enabled games at `GET /api/games`.

Paginated endpoints use page zero by default and accept sizes from 1 to 100. API errors use a JSON object with `timestamp`, `status`, `error`, `message`, and `path` fields.

---

# Example Authentication Flow

### 1. Register

```http
POST /api/auth/register
```

```json
{
  "username": "testuser",
  "password": "password123"
}
```

### 2. Login

```http
POST /api/auth/login
```

```json
{
  "username": "testuser",
  "password": "password123"
}
```

The server returns:

```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

### 3. Access a protected endpoint

```http
GET /api/some-protected-endpoint
Authorization: Bearer <access-token>
```

### 4. Refresh when the access token expires

```http
POST /api/auth/refresh
```

```json
{
  "refreshToken": "<refresh-token>"
}
```

The server returns a new access token and refresh token.

### 5. Logout

```http
POST /api/auth/logout
```

```json
{
  "refreshToken": "<refresh-token>"
}
```

The refresh token is revoked.

---

# Security Notes

* Passwords are never stored in plaintext.
* Refresh tokens are never stored in plaintext.
* Access tokens are short-lived.
* Refresh tokens are rotated after use.
* Refresh token reuse is rejected.
* User roles are loaded from the database on authenticated requests.
* Balance changes must be performed server-side and must not trust values supplied by the frontend.
