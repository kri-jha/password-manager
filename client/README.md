# Aegis Vault Frontend

A modern, responsive, zero-knowledge personal password manager interface built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Key Features

1. **Zero-Knowledge Web Crypto Encryption**:
   - Master Password derives a 256-bit AES-GCM key inside the browser using **PBKDF2** (SHA-256, 100,000 iterations).
   - Sensitive credentials (passwords, recovery emails, recovery codes, 2FA notes, custom fields) are encrypted before submission.
   - Master passwords and decrypted keys are held **strictly in React in-memory state** and are never saved to `localStorage`, `sessionStorage`, or transmitted to any server.

2. **Credential Management**:
   - Store titles, URLs, usernames, masked passwords, 2FA notes, recovery codes, and custom key-value fields.
   - Multiple accounts per service (e.g. personal, work, and student accounts).
   - Instant copy buttons with auto-clearing clipboard after 30 seconds for passwords.
   - Show/Hide password toggles and explicit recovery code reveal toggles.

3. **Built-in Password Generator**:
   - Powered by `window.crypto.getRandomValues()` (never `Math.random()`).
   - Customizable length (8-64), character sets (uppercase, lowercase, numbers, symbols), and option to exclude ambiguous characters.

4. **Security Health & Vault Audit**:
   - Local scanning for weak, short, and reused passwords.
   - Visual password strength indicators and entropy calculations.

5. **Inactivity Auto-Lock & Key Re-Encryption**:
   - Auto-locks vault after user-specified idle duration (5m, 15m, 30m, 1h, Never).
   - Master password change flow that automatically decrypts all existing vault items in memory, generates a new salt, re-encrypts all items, and syncs with the backend.

6. **Custom Categories**:
   - Create, edit, and color-code categories with custom icons.
   - Add categories on the fly directly inside the credential creation form.

7. **Themes & Design**:
   - Modern dark and light themes with smooth glassmorphism and Tailwind CSS variables.
   - Responsive layout designed for desktop, tablet, and mobile.

---

## 🛠️ Setup & Running

### 1. Environment Configuration
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Ensure the API base URL matches your backend:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```
Outputs optimized production assets to `dist/`.
