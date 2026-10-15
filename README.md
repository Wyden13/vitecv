# viteCV

Build, match, and edit your resume. Next.js 16 (App Router, Cache Components)
with Firebase Auth and Firestore.

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure Firebase

Create a Firebase project, then copy `.env.example` to `.env` and fill it in.
There are two groups of values:

- **`NEXT_PUBLIC_FIREBASE_*`** — the web app config, from
  *Project settings → General → Your apps*. Not secret; these ship to the browser.
- **`FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`** —
  a service account, from *Project settings → Service accounts → Generate new
  private key*. **These are secrets.** They are used server-side only, to verify
  ID tokens and mint session cookies.

In the console, enable **Authentication → Sign-in method → Google**, and create
a **Firestore** database.

### 3. Deploy security rules

`firestore.rules` scopes every document under `users/{uid}` to that user. Rules
only take effect once deployed — until then the database is open regardless of
what the app code does:

```bash
npx firebase-tools deploy --only firestore:rules
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

## How auth works

1. The browser signs in with Google via the Firebase client SDK.
2. It sends the resulting **ID token** to the `createSession` server action.
3. The server verifies that token with the Admin SDK and exchanges it for a
   signed **session cookie** (`libs/firebase/admin.ts`, `actions/auth-action.ts`).
4. `proxy.ts` does a cheap cookie-presence check to gate routes; `libs/dal.ts`
   does the authoritative `verifySessionCookie` check.

The cookie is signed, so a forged or tampered value fails verification. Note
that Firestore access is authorized separately, by the client SDK's own auth
state against `firestore.rules` — that is the real data boundary.

## Project layout

| Path | Purpose |
|---|---|
| `app/(app)/` | Routes that render inside the app chrome (sidebar) |
| `app/login/` | Sign-in, outside the chrome |
| `actions/` | Server actions |
| `libs/firebase/` | Client SDK (`firebase.ts`) and Admin SDK (`admin.ts`) |
| `libs/dal.ts` | Session verification — the Data Access Layer |
| `libs/resumeSchema.ts` | `ResumeDocument` shape shared by editor and preview |
| `libs/resumeService.ts` | All Firestore reads/writes for resumes |
| `components/resume/` | The two-pane resume editor |
| `proxy.ts` | Optimistic route gate (Next 16 renamed `middleware` → `proxy`) |

## Known gaps

- Uploading extracts text (`libs/extractFile.ts`) but does not parse it into
  sections — the editor starts empty and is filled in by hand.
- Style tab, ATS scoring, "Guide me", Job Match, and Download are laid out but
  not implemented. Printing (`Cmd/Ctrl+P`) produces a correct resume page today.
