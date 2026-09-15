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
  "password": "password123"
}
```

### Validation

| Field      | Requirements               |
| ---------- | -------------------------- |
| `username` | Required, 3–50 characters  |
| `password` | Required, 8–100 characters |

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
