# Secure Zero-Knowledge Personal Password Manager Backend

A robust, production-grade REST API backend built with **Node.js**, **Express.js**, **TypeScript**, **MongoDB**, and **Mongoose**. Built for a zero-knowledge personal password manager where secrets are encrypted on the client using AES-256-GCM before transmission.

---

## 🔒 Security & Architecture Overview

1. **Zero-Knowledge Vault Design**:
   - The backend **never** receives, handles, logs, or stores plaintext credentials, website passwords, recovery codes, or master keys.
   - All sensitive payloads arrive as authenticated AES-256-GCM structures:
     ```json
     {
       "ciphertext": "<Base64>",
       "iv": "<Base64>",
       "authTag": "<Base64>",
       "version": 1
     }
     ```
   - Searches for credentials are only performed over permitted non-secret metadata (`title`, `website`, `categoryId`, `favorite`). Sensitive fields are decrypted only within the client memory.

2. **Argon2id Authentication**:
   - Account login passwords are protected using the state-of-the-art **Argon2id** password hashing algorithm (64MB memory cost, 3 iterations, 4 parallelism threads).
   - Password hashes are never selected by default in queries and are explicitly omitted from all API responses.

3. **Defense in Depth**:
   - **Helmet** security headers with strict CSP.
   - **CORS** locked to authorized client origins with credentials support.
   - **Rate Limiting**: General rate limits + strict rate limits on authentication routes (`/api/auth/register`, `/api/auth/login`) to thwart brute force and credential stuffing.
   - **Input Validation**: Strict Zod schemas validating bodies, query parameters, and URL route parameters (including MongoDB ObjectIds).
   - **Sensitive Data Redaction**: Automatic stripping and redacting of sensitive fields from logging and error outputs.

---

## 📁 Directory Structure

```
server/
├── src/
│   ├── config/
│   │   ├── env.ts              # Zod environment variable parsing & validation
│   │   └── database.ts         # Mongoose connection with reconnection & graceful teardown
│   ├── models/
│   │   ├── User.ts             # User model with vault salts & verifiers
│   │   ├── Credential.ts       # Credential model with encrypted payload
│   │   └── Category.ts         # User-isolated Category model
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── credential.controller.ts
│   │   └── category.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── credential.service.ts
│   │   └── category.service.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── credential.routes.ts
│   │   ├── category.routes.ts
│   │   └── index.ts
│   ├── middleware/
│   │   ├── authenticate.ts     # Cookie/Bearer JWT verification & user existence check
│   │   ├── validate.ts         # Generic Zod middleware
│   │   ├── rateLimiter.ts      # API & Auth rate limiters
│   │   └── errorHandler.ts     # Centralized error handler
│   ├── validators/
│   │   ├── auth.schema.ts
│   │   ├── credential.schema.ts
│   │   └── category.schema.ts
│   ├── utils/
│   │   ├── encryption.ts       # Argon2id and AES-256-GCM utilities
│   │   ├── errors.ts           # AppError, BadRequest, Unauthorized, NotFound
│   │   └── logger.ts           # Redacting logger
│   ├── app.ts                  # Express application factory
│   └── server.ts               # Server entry point with graceful shutdown
├── tests/
│   ├── setup.ts                # In-memory MongoDB testing environment
│   ├── auth.test.ts            # Auth unit & integration tests
│   ├── categories.test.ts      # Category CRUD & user isolation tests
│   ├── credentials.test.ts     # Credential CRUD & search tests
│   └── encryption.test.ts      # Crypto verification & tamper resistance
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js >= 18.x (Tested on Node.js v24.20.0)
- MongoDB instance (Local or MongoDB Atlas)

### 2. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```
Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/password_saver
SESSION_SECRET=your_super_secret_jwt_key_at_least_16_characters
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Running the Server

- **Development Mode** (with hot reload):
  ```bash
  npm run dev
  ```
- **Build TypeScript**:
  ```bash
  npm run build
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

### 5. Running the Tests
Runs 20 automated integration and unit tests against an isolated in-memory MongoDB:
```bash
npm test
```

---

## 📡 REST API Reference

### Authentication (`/api/auth`)

#### 1. Register User
- **Method**: `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "vaultSalt": "bm9uY2Vfc2FsdF8xNmJ5dGVzX2xvbmc=",
    "vaultAuthVerifier": {
      "ciphertext": "base64Ciphertext",
      "iv": "base64Iv123456",
      "authTag": "base64AuthTag1234",
      "version": 1
    }
  }
  ```
- **Response** `(201 Created)`:
  Sets HTTP-only cookie `auth_token` and returns:
  ```json
  {
    "success": true,
    "message": "Account registered successfully.",
    "data": {
      "user": {
        "id": "671a...",
        "email": "user@example.com",
        "vaultSalt": "...",
        "inactivityTimeoutMinutes": 15
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

#### 2. Login
- **Method**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response** `(200 OK)`: Sets HTTP-only cookie and returns user profile + token.

#### 3. Current User
- **Method**: `GET /api/auth/me`
- **Headers**: `Cookie: auth_token=...` or `Authorization: Bearer <token>`
- **Response** `(200 OK)`: User profile and vault encryption metadata.

#### 4. Logout
- **Method**: `POST /api/auth/logout`
- **Response** `(200 OK)`: Clears auth cookie.

---

### Categories (`/api/categories`)

- `GET /api/categories` - List user's categories sorted alphabetically.
- `POST /api/categories` - Create a custom category (`name`, `icon`, `color`).
- `PATCH /api/categories/:id` - Update category name, icon, or color.
- `DELETE /api/categories/:id` - Delete category safely (associated credentials are automatically moved to Uncategorized).

---

### Credentials (`/api/credentials`)

- `GET /api/credentials` - List credentials. Supports:
  - `?search=query`
  - `?categoryId=<id>` (or `categoryId=uncategorized`)
  - `?favorite=true`
  - `?sortBy=updatedAt|title|createdAt|lastUsedAt`
  - `?order=asc|desc`
  - `?page=1&limit=20`
- `GET /api/credentials/:id` - Get single credential (updates `lastUsedAt`).
- `POST /api/credentials` - Create new credential with encrypted secret payload.
- `PATCH /api/credentials/:id` - Update credential.
- `DELETE /api/credentials/:id` - Delete credential.
- `POST /api/credentials/:id/favorite` - Toggle favorite status.
