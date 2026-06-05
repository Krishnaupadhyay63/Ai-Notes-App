# 🔐 NoteVault – AI Note-Taking App (POC)

A secure note-sharing app with expiring share links, built with Next.js, TypeScript, PostgreSQL, and Prisma.

---

## 🚀 Setup Instructions

### 1. Clone and Install
```bash
git clone <repo-url>
cd ai-note-app
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env
```
Edit `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/ai_notes_db"
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run
```bash
npm run dev
```

Open: http://localhost:3000

---

## 🛠 Tech Stack

| Layer      | Tech                         |
|------------|------------------------------|
| Frontend   | Next.js 15, TypeScript       |
| Styling    | Tailwind CSS, CSS Variables  |
| Backend    | Next.js API Routes           |
| Database   | PostgreSQL                   |
| ORM        | Prisma                       |
| Auth       | JWT (httpOnly cookies)       |
| Passwords  | bcryptjs                     |

---

## 🗄️ Database Schema

```
User
  id, email, name, password, createdAt, updatedAt

Note
  id, title, content, userId → User, createdAt, updatedAt

ShareLink
  id, token (unique), noteId → Note (unique)
  shareType: ONE_TIME | TIME_BASED
  accessType: PUBLIC | PASSWORD
  password (hashed, nullable)
  expiresAt (nullable)
  isRevoked (bool)
  isUsed (bool, for ONE_TIME)
  viewCount (int)
  createdAt, updatedAt
```

---

## 🔗 Share Link Flow

```
1. User creates note (title + content)
2. User selects:
   - Share Type: ONE_TIME or TIME_BASED
   - Access Type: PUBLIC or PASSWORD
   - Expiry date (for TIME_BASED)
3. System generates:
   - Secure random token (32 bytes hex) → /share/{token}
   - If PASSWORD: auto-generates access key (format: xxxx-xxxx-xxxx)
   - Access key is bcrypt-hashed before DB storage
   - Plain key shown to user ONCE, never stored
4. Recipient opens /share/{token}:
   - Validity checks run (revoked / expired / used)
   - PUBLIC: auto-unlocks → view count +1
   - PASSWORD: shows key input → on correct key → view count +1
5. Note content served
```

---

## 🔑 Password / Key Generation Logic

```typescript
// lib/utils.ts
export function generateAccessKey(): string {
  const raw = crypto.randomBytes(6).toString("hex");
  return `${raw.slice(0,4)}-${raw.slice(4,8)}-${raw.slice(8,12)}`;
  // Example: "a3f9-b2c1-d4e5"
}
// Hashed with bcrypt(rounds=10) before DB storage
// Plain key returned ONCE at link creation time
```

---

## ⏰ Expiry Logic

| Type      | Expiry Condition                          |
|-----------|-------------------------------------------|
| ONE_TIME  | `isUsed = true` after first successful view |
| TIME_BASED| `expiresAt < NOW()`                       |

Both are checked on every request before serving content.

---

## 🚫 Revoke / Invalidate Logic

- Owner can click "Revoke" in the sidebar at any time
- Sets `isRevoked = true` in DB
- Revoked links return `410 Gone` immediately
- No further views or unlocks possible

---

## 👁 View Count Logic

| Scenario              | Count Change |
|-----------------------|-------------|
| Public link opened    | +1          |
| Correct password      | +1          |
| Wrong password        | No change   |
| Expired link          | No change   |
| Revoked link          | No change   |
| One-time already used | No change   |

Count is updated with Prisma atomic increment:
```typescript
await prisma.shareLink.update({
  where: { token },
  data: { viewCount: { increment: 1 } }
});
```

---

## ⚡ Race Condition Handling

**Problem:** Two users open a ONE_TIME link simultaneously.

**Solution:** Atomic `updateMany` with conditional WHERE clause:

```typescript
const result = await prisma.shareLink.updateMany({
  where: {
    token,
    isUsed: false,    // ← Only succeeds if NOT already used
    isRevoked: false,
  },
  data: {
    isUsed: true,
    viewCount: { increment: 1 },
  },
});

if (result.count === 0) {
  // Another request beat us — return 410
  return { error: "ALREADY_USED" };
}
```

PostgreSQL guarantees this `WHERE + UPDATE` is atomic. Only one concurrent request can win. All others get `result.count = 0` and receive the "already used" error.

---

## ❓ Brief Answers

### How do you prevent two users from using a one-time link at the same time?
Using an atomic `updateMany` with `WHERE isUsed = false`. PostgreSQL row-level locking ensures only one transaction can update the row. The "loser" gets `count = 0` back and is immediately rejected.

### How do you update view count safely?
Using `{ increment: 1 }` in Prisma, which translates to `SET view_count = view_count + 1` — a single atomic SQL operation. No read-modify-write race condition possible.

### How would this work if 1 million people opened the link?
- Add **Redis** to cache share link metadata (reduce DB reads)
- Use **PgBouncer** or **Prisma Accelerate** for connection pooling
- Move view count increments to a **Redis counter** or **BullMQ queue**, batch-write to Postgres
- Deploy behind a **CDN** (Vercel Edge / Cloudflare)
- Use **read replicas** for validation reads

### How would you prevent brute-force on password-protected links?
- **Rate limiting** by IP: max 5 attempts per 15 minutes (via middleware / Upstash Redis)
- **bcrypt** hashing is intentionally slow (cost=10), making brute force expensive
- **Exponential backoff**: increase delay after each failure
- **Lock link** after N (e.g. 10) failed attempts — set `isRevoked = true`
- **Short access key TTL**: combine with time-based expiry

---

## 🧪 Test Credentials

After running the app, register with:
- Email: `test@example.com`
- Password: `test123`

---

## 📁 Pages

| Route           | Description                     |
|-----------------|---------------------------------|
| `/`             | Landing page                    |
| `/login`        | Sign in                         |
| `/register`     | Create account                  |
| `/notes/new`    | Create note + generate share link |
| `/notes/[id]`   | Note detail + share link info   |
| `/share/[token]`| Public share page (view note)   |
