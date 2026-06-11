## GDPR Compliance Plan

You selected all four areas. The frontend pieces I can ship inside Lovable today. The backend pieces live in your external Node.js/MySQL API (`VITE_API_URL`) — I'll wire the UI to call new endpoints and give you the exact spec to implement server-side.

---

### 1. Cookie / Consent Banner v2 (frontend)

Replace `src/components/ConsentBanner.tsx` (currently a single "Got it" dismiss) with a GDPR-grade banner:

- **Three actions:** `Accept all`, `Reject all`, `Customize`.
- **Categories** (toggles in Customize panel):
  - Strictly necessary — always on, not toggleable (auth JWT, `cira_device_id`, consent record itself).
  - Analytics — Google Analytics. Off by default.
  - Functional — language preference, UI prefs. Off by default.
  - We have no marketing/ad cookies, so that category is omitted.
- **Storage:** new `src/lib/consent.ts` exposing `getConsent()`, `setConsent({analytics, functional})`, `hasDecided()`, plus a `consent-changed` event.
- **Versioned record:** `cira_consent_v2 = { version: 2, decidedAt, analytics: bool, functional: bool }`. Bumping the version re-prompts users.
- **GA gating:** load `gtag` only when `analytics === true`. Unload / set `'consent', 'update'` denied if user revokes. Update `src/lib/audit.ts` and any GA call sites.
- **Re-open from anywhere:** add "Cookie preferences" link in the footer that re-opens the banner.
- **Withdraw consent:** same link works from Profile page.

### 2. Data Subject Rights UI (frontend + backend contract)

New section on `src/pages/Profile.tsx` → "Privacy & Data":

- **Export my data** button → calls `GET /api/user/gdpr/export` (JWT) → downloads `cira-data-export-<userId>-<date>.json`. Frontend just streams the blob.
- **Delete my account** button → opens a confirm dialog (typed "DELETE" confirmation) → `DELETE /api/user/gdpr/account` → on 200, clears local storage, logs out, redirects to `/` with a toast.
- **Withdraw consent** link → opens consent banner in edit mode.
- **Download my reports** → already exists, keep as-is.

**Backend spec for you to implement (Node/MySQL):**

```
GET    /api/user/gdpr/export       → 200 JSON { profile, vitalsScans[], reports[], chats[], payments[], consents[] }
DELETE /api/user/gdpr/account      → 200; hard-delete or anonymize within 30d per policy
GET    /api/user/gdpr/consent      → returns current server-side consent log (optional but recommended)
POST   /api/user/gdpr/consent      → body { analytics, functional, version, userAgent } — append-only audit log
```

If those endpoints don't exist yet, the UI will show a friendly "Coming soon — email privacy@askainurse.com" fallback so nothing breaks.

### 3. Legal Pages Refresh (frontend)

Update `src/pages/PrivacyPolicy.tsx`, `src/pages/Privacy.tsx`, and `src/pages/Terms.tsx`:

- Add **Data Controller** identity block (legal entity name, address, email). I'll use placeholders — you'll fill in the real entity.
- Add **DPO / privacy contact** section (`privacy@askainurse.com`).
- Expand **Lawful basis** table per processing purpose (consent, contract, legitimate interest).
- Add **Sub-processors** table (Anthropic, Shen AI, GA, hosting, MySQL host) with locations.
- Add **International transfers** SCC language.
- Add **Automated decision-making** clause (AI-generated health responses, not solely automated decisions with legal effect).
- Add **Data retention schedule** table (account: until deletion; vitals: 24mo; chats: 12mo; logs: 90d — please confirm or adjust).
- Add **Your rights** including access, rectification, erasure, restriction, portability, objection, withdraw consent, lodge complaint with supervisory authority.
- Add **Children**: minimum age 16 in EU.
- Add **"Last updated"** date.

### 4. Backend / Data Processing items (your Node API — spec only)

I'll document these in `.lovable/plan.md` for your backend dev. Out of scope for Lovable code edits:

- Implement the four `/api/user/gdpr/*` endpoints above.
- Add `consent_log` table: `id, user_id NULL, anon_id, analytics, functional, version, ip, user_agent, created_at`.
- 30-day deletion job: hard-delete or anonymize on `DELETE /gdpr/account`.
- Retention cron: purge vitals_scans > 24mo, chats > 12mo (configurable).
- TLS-at-rest confirmation for MySQL (`require_secure_transport=ON`), backup encryption.
- Sub-processor DPAs on file (Anthropic, Shen, hosting).
- Breach-notification runbook (72h to supervisory authority).

---

### Files I will touch

- `src/components/ConsentBanner.tsx` — full rewrite, 3-action + categories.
- `src/lib/consent.ts` — new.
- `src/lib/audit.ts` — gate GA on consent.
- `src/pages/Profile.tsx` — add Privacy & Data section.
- `src/pages/PrivacyPolicy.tsx`, `src/pages/Privacy.tsx`, `src/pages/Terms.tsx` — expanded copy.
- `src/i18n/locales/{en,de,es,fr}.json` — new strings for banner + privacy section.
- Footer component(s) — add "Cookie preferences" link.
- `.lovable/plan.md` — backend spec handoff.

No DB / schema changes on the Lovable side (your backend lives outside Cloud).

### Open questions before I build

1. **Retention windows** — OK with vitals 24mo, chats 12mo, logs 90d? Or different?
2. **Legal entity name + registered address** for the Data Controller block — provide now or leave a `[YOUR COMPANY]` placeholder I'll mark TODO?
3. **Hard delete vs anonymize** on account deletion — preference?

---

## Backend handoff — implement these on the Node.js/MySQL API

### Endpoints (JWT-protected)

```
GET    /api/user/gdpr/export
       → 200 application/json
       Body: { profile, vitalsScans[], reports[], chats[], payments[], consents[], exportedAt }

DELETE /api/user/gdpr/account
       → 200; hard-delete or queue 30-day anonymization job
       Side-effects: invalidate JWT, cascade delete vitals_scans, reports, chats, payments

POST   /api/user/gdpr/consent
       Body: { version, analytics, functional, decidedAt, userAgent }
       → 201; append-only insert into consent_log
```

### New table

```sql
CREATE TABLE consent_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  anon_id VARCHAR(64) NULL,
  version SMALLINT NOT NULL,
  analytics TINYINT(1) NOT NULL,
  functional TINYINT(1) NOT NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
);
```

### Retention cron (daily)

- `DELETE FROM vitals_scans WHERE created_at < NOW() - INTERVAL 24 MONTH;`
- `DELETE FROM chats WHERE updated_at < NOW() - INTERVAL 12 MONTH;`
- `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL 90 DAY;`

### Infrastructure

- MySQL `require_secure_transport=ON`, encrypted backups
- Sub-processor DPAs on file: Anthropic, Shen AI, hosting, Stripe/Paddle
- Breach runbook: notify supervisory authority within 72h

Until these endpoints are deployed, the UI degrades gracefully:
- "Export my data" shows a toast pointing to privacy@askainurse.com
- "Delete my account" falls back to the existing `DELETE /api/user/account` endpoint
