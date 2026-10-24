# 🛡️ Aegis Vault — Personal Password Manager

A complete, production-grade, end-to-end encrypted personal password manager built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express**, and **MongoDB**.

Featuring a strict **Zero-Knowledge Architecture** where credential secrets are encrypted client-side using authenticated **AES-256-GCM** before transmission, and account passwords are protected on the server using **Argon2id**.

---

## 📁 Project Architecture & Folder Structure

```
password-saver/
├── client/                     # Frontend Application (React + Vite + TypeScript + Tailwind)
│   ├── src/
│   │   ├── components/         # UI components, layout, credentials, generator, vault
│   │   ├── context/            # AuthContext, VaultContext, ThemeContext, ToastContext
│   │   ├── crypto/             # Web Crypto AES-256-GCM & PBKDF2 key derivation
│   │   ├── hooks/              # useClipboard (auto-clearing), useInactivityTimeout
│   │   ├── pages/              # Dashboard, AllItems, Favorites, Categories, Security, Settings, Auth
│   │   ├── services/           # Centralized Axios client & REST services
│   │   └── types/              # TypeScript interfaces
│   ├── .env.example            # VITE_API_BASE_URL=http://localhost:5000/api
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Backend REST API (Node.js + Express + TypeScript + Mongoose)
│   ├── src/
│   │   ├── config/             # Zod environment validation & Mongoose connection
│   │   ├── controllers/        # Auth, Category, and Credential controllers
│   │   ├── middleware/         # Cookie/JWT auth, rate limiter, error handler, Zod validator
│   │   ├── models/             # User, Credential, Category Mongoose schemas
│   │   ├── routes/             # REST API routes
│   │   ├── services/           # Business logic & safe category deletion handling
│   │   ├── utils/              # Argon2id, AES-256-GCM, redaction logger
│   │   └── server.ts           # Server entry point with graceful teardown
│   ├── tests/                  # Automated integration tests (Vitest + in-memory MongoDB)
│   ├── .env.example            # PORT, MONGODB_URI, SESSION_SECRET, CLIENT_ORIGIN
│   └── package.json
├── docker-compose.yml          # Optional local MongoDB container setup
├── package.json                # Monorepo runner scripts
└── README.md                   # Complete documentation
```

---

## 🔒 Cryptographic Architecture & Zero-Knowledge Contract

### 1. Two-Tier Password Model
- **Account Login Password**:
  - Sent to the server over HTTPS/TLS to authenticate user sessions.
  - Hashed on the backend using **Argon2id** (64MB memory cost, 3 iterations, 4 parallelism threads).
  - Password hashes are never returned in any API responses.
- **Vault Master Password**:
  - **NEVER sent to the backend**.
  - Derives a 256-bit AES-GCM encryption key (`CryptoKey`) strictly within the browser memory using the standard **Web Crypto API** (`PBKDF2`, `SHA-256`, 100,000 iterations, unique random salt).
  - Stored only in React component memory state while the vault is unlocked; automatically wiped when locking or during inactivity.

### 2. Client/Server Data Contract
When creating or editing a credential, the client encrypts the sensitive JSON payload:
```typescript
interface DecryptedSecretData {
  username?: string;
  password?: string;
  recoveryEmail?: string;
  recoveryPhone?: string;
  twoFactorNotes?: string;
  recoveryCodes?: string[];
  securityNotes?: string;
  customFields?: { label: string; value: string; isSecret?: boolean }[];
}
```
Into an authenticated AES-256-GCM payload:
```json
{
  "title": "Personal Gmail",
  "website": "https://mail.google.com",
  "categoryId": "671a5c...",
  "encryptedSecretPayload": {
    "ciphertext": "pL8e4mN...",
    "iv": "3mN2kL...",
    "authTag": "8jK2xP...",
    "version": 1
  },
  "encryptionVersion": 1,
  "favorite": true
}
```
The backend validates the structure, length, and user ownership, storing the encrypted ciphertext in MongoDB without ever having access to the decryption key.

---

## 🚀 Quick Start Guide

### Step 1: Clone & Install Dependencies

1. **Install backend dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Install frontend dependencies**:
   ```bash
   cd ../client
   npm install
   ```

---

### Step 2: Configure Environment Variables

1. **Backend Environment** (`server/.env`):
   ```bash
   cd server
   cp .env.example .env
   ```
   Configure your MongoDB connection and secrets in `server/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/password_saver
   SESSION_SECRET=super_secret_session_key_minimum_16_characters!
   CLIENT_ORIGIN=http://localhost:5173
   ```
   *(If you have Docker installed, you can start a local MongoDB instance with: `docker compose up -d`)*

2. **Frontend Environment** (`client/.env`):
   ```bash
   cd ../client
   cp .env.example .env
   ```
   Ensure `client/.env` points to the backend API:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

---

### Step 3: Run the Application

You can run both services concurrently from the root directory or in separate terminals:

#### Terminal 1 — Start the Backend Server:
```bash
cd server
npm run dev
```
*Backend runs at [http://localhost:5000](http://localhost:5000) (REST API at `http://localhost:5000/api`)*

#### Terminal 2 — Start the Frontend Development Server:
```bash
cd client
npm run dev
```
*Frontend runs at [http://localhost:5173](http://localhost:5173)*

Open your browser to [http://localhost:5173](http://localhost:5173) to create your account and explore your vault!

---

## 🧪 Testing the Backend

The backend includes a comprehensive Vitest suite covering authentication, Argon2id hashing, zero-knowledge payload validation, category isolation, credential CRUD, and tamper detection against an isolated in-memory MongoDB:

```bash
cd server
npm test
```
**Test Results:**
```
 ✓ tests/encryption.test.ts (4 tests)
 ✓ tests/auth.test.ts (6 tests)
 ✓ tests/categories.test.ts (4 tests)
 ✓ tests/credentials.test.ts (6 tests)
 Test Files  4 passed (4)
      Tests  20 passed (20)
```

---

## 🛠️ Security Highlights

- **Hardware-backed Randomness**: Passwords generated using `window.crypto.getRandomValues()` with ambiguous character exclusion.
- **Inactivity Auto-Lock**: Automatically purges in-memory keys after an idle interval (configured in Settings: 5m, 15m, 30m, 1h, Never).
- **Clipboard Security**: Passwords copied to clipboard are automatically purged from the clipboard buffer after 30 seconds.
- **Client-Side Master Password Migration**: When changing your Master Password, the frontend decrypts all items with the old key, generates a new salt, re-encrypts every credential under the new key, and updates the backend.
- **Sensitive Logging Redaction**: The backend automatically redacts passwords, tokens, cookies, recovery codes, and ciphertexts from logs.
