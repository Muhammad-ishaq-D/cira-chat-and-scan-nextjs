# Backend Prompt — Doctor Role + Prescription Review Workflow

Paste this into Antigravity (or any agent working on the Node.js + MySQL backend at `askainurse.com`). It is self-contained and aligned 1:1 with the frontend already implemented in this Lovable project.

---

## Goal

Introduce a **doctor** role with its own login. Doctors review paid prescription-refill submissions and either:
- **Approve** → the existing prescription PDF is generated and emailed to the patient.
- **Reject** → a Stripe refund is issued and the patient is emailed an explanation.

Currently, when a prescription refill is paid the backend immediately generates the PDF and emails it. **Change this**: on payment, only send a "payment received — under review" email. The PDF email must only be sent after a doctor approves.

---

## 1. Database migration

```sql
CREATE TABLE doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  specialty VARCHAR(255),
  license_number VARCHAR(100),
  phone VARCHAR(50),
  bio TEXT,
  avatar MEDIUMTEXT,
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_by_admin_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_doctors_status (status)
);

ALTER TABLE prescription_refills
  ADD COLUMN review_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  ADD COLUMN reviewed_by_doctor_id INT NULL,
  ADD COLUMN reviewed_at DATETIME NULL,
  ADD COLUMN doctor_note TEXT NULL,
  ADD COLUMN pdf_email_status ENUM('not_sent','sent','failed') NOT NULL DEFAULT 'not_sent',
  ADD INDEX idx_refills_review_status (review_status),
  ADD CONSTRAINT fk_refills_doctor FOREIGN KEY (reviewed_by_doctor_id) REFERENCES doctors(id);
```

Backfill: existing rows can stay `review_status='pending'`. Optionally mark already-emailed legacy rows as `review_status='approved'`, `pdf_email_status='sent'`.

---

## 2. Auth

- New env var `DOCTOR_JWT_SECRET` (fall back to `JWT_SECRET` if absent).
- Hash passwords with **bcrypt** (10+ rounds).
- `POST /api/doctor/auth/login`
  - Body: `{ email, password }`
  - Validates account exists, password matches, `status='active'`.
  - Returns `{ token, doctor: { id, name, email, specialty, license_number, phone, bio, status, created_at } }`.
  - Token payload: `{ sub: doctorId, role: 'doctor' }`, 7-day expiry.
- Middleware `requireDoctor`: verifies JWT, loads doctor, rejects if suspended/deleted, attaches `req.doctor`.

---

## 3. Admin endpoints (protected by existing admin middleware)

All routes prefixed `/api/admin/doctors`.

| Method | Path | Body | Response |
|---|---|---|---|
| GET    | `/api/admin/doctors?search=&status=` |  | `{ doctors: Doctor[] }` |
| POST   | `/api/admin/doctors` | `{ name, email, password, specialty?, license_number?, phone?, bio? }` | `Doctor` |
| GET    | `/api/admin/doctors/:id` |  | `Doctor` |
| PUT    | `/api/admin/doctors/:id` | partial Doctor fields | `Doctor` |
| POST   | `/api/admin/doctors/:id/suspend` |  | `{ ok: true }` |
| POST   | `/api/admin/doctors/:id/activate` |  | `{ ok: true }` |
| POST   | `/api/admin/doctors/:id/reset-password` | `{ new_password }` | `{ ok: true }` |
| DELETE | `/api/admin/doctors/:id` |  | `204` |

Validate: unique email, password ≥ 8 chars, valid email format.

---

## 4. Doctor endpoints (require `requireDoctor`)

```
GET    /api/doctor/profile
PUT    /api/doctor/profile                 // name, phone, bio, avatar
POST   /api/doctor/change-password         // { current_password, new_password }

GET    /api/doctor/stats                   // { pending, approved_today, rejected_today }

GET    /api/doctor/refills/pending         // payment_status='paid' AND review_status='pending'
GET    /api/doctor/refills/reviewed?status=approved|rejected|all
GET    /api/doctor/refills/:id             // full detail; only if pending OR reviewed by this doctor (admins may see all via admin route)

POST   /api/doctor/refills/:id/approve     // { note? }
POST   /api/doctor/refills/:id/reject      // { reason }  (reason required, min 10 chars)
```

Response shape for refill list rows (must match the frontend `DoctorRefill` interface):

```ts
{
  id, reference_code, created_at, delivery_email,
  medications: [{ drug_name_inn, drug_strength, drug_form }],
  payment_status, review_status,
  reviewed_by_doctor_id, reviewed_by_doctor_name, reviewed_at, doctor_note,
  amount_charged, stripe_payment_intent_id, patient_name
}
```

### Approve logic
1. Guard: `payment_status='paid'` AND `review_status='pending'`. Otherwise `409`.
2. Set `review_status='approved'`, `reviewed_by_doctor_id`, `reviewed_at=NOW()`, `doctor_note=note`.
3. Generate the prescription PDF (reuse existing generator that was previously called on payment).
4. Email `delivery_email` with the PDF attached (existing approved template).
5. Set `pdf_email_status='sent'` (or `'failed'` on error — still return success but flag for admin).
6. Audit log.

### Reject logic
1. Same guard.
2. Set `review_status='rejected'`, `doctor_note=reason`.
3. `stripe.refunds.create({ payment_intent: stripe_payment_intent_id })`. On Stripe success: `payment_status='refunded'`, `refund_status='approved'`.
4. Email `delivery_email` using the new **rejection-refund** template; include the doctor's reason.
5. Audit log.

Wrap both in a DB transaction. If PDF/email or Stripe fails after status flip, roll back the status update.

---

## 5. Change payment-success flow (the most important change)

Find the place that currently runs **after Stripe payment succeeds** for prescription refills (likely the Stripe webhook or `/api/prescription-refill/confirm` handler). Today it:
1. Marks paid
2. Generates PDF
3. Emails PDF

**Change to:**
1. Mark `payment_status='paid'`, `review_status='pending'`.
2. Send the **new** `payment_received_pending_review` email (NO PDF attachment). Subject: "Payment received — prescription under doctor review". Body explains a licensed doctor will review within X hours.
3. **Do not** generate or email the PDF here.

Keep idempotency (don't re-email on duplicate webhooks).

---

## 6. Email templates (mailer)

Add three templates (or repurpose existing where noted):

- `payment_received_pending_review.html` — NEW. Subject: *"Payment received — your prescription is under review"*. Variables: `{{patient_email}}`, `{{reference_code}}`, `{{medications_table}}`.
- `prescription_approved.html` — EXISTING refill PDF email; now triggered only by doctor approve.
- `prescription_rejected_refund.html` — NEW. Subject: *"Your prescription was not approved — refund issued"*. Variables: `{{reference_code}}`, `{{reason}}`, `{{amount}}`. Mention the refund typically lands in 5–10 business days.

---

## 7. Admin extensions to existing refill endpoints

`GET /api/admin/prescription-refills` response items should additionally include:
`review_status`, `reviewed_by_doctor_id`, `reviewed_by_doctor_name`, `reviewed_at`, `doctor_note`, `pdf_email_status`.

(Optional) `POST /api/admin/prescription-refills/:id/override-review` — admin force-approve/reject.

---

## 8. Audit logging

Use the existing `audit_logs` table. Log:
- Admin: create/update/suspend/activate/reset-password/delete doctor.
- Doctor: login, approve(id), reject(id, reason), refund-success/failure.

Add `actor_type ENUM('admin','doctor','user')` column if it does not already exist.

---

## 9. Seed / bootstrap script

`scripts/create-doctor.js`:
```bash
node scripts/create-doctor.js "Dr Jane Smith" jane@example.com "TempPass123!" "General Practice" "MED-12345"
```
Inserts an active doctor with bcrypt-hashed password for first-login testing.

---

## 10. Frontend contract (already implemented in this Lovable project)

The frontend expects exactly these URLs and shapes:

- Doctor login: `POST /api/doctor/auth/login` → `{ token, doctor }`. Token stored as `cira_doctor_token`.
- Doctor portal calls: see endpoints in §4.
- Admin doctors UI calls: see endpoints in §3.
- Refill list rows on the doctor side must include `medications` already parsed as JSON arrays (the admin UI already does this).
- All errors should return `{ error: string }` with appropriate HTTP status (`400`, `401`, `403`, `404`, `409`, `500`).

After these endpoints are live, the frontend works end-to-end without further changes.

---

## Addendum: Stop creating empty prescription_refill rows on session start

**Problem:** `POST /api/prescription/create-refill` currently inserts a row in `prescription_refills` (status `pending`, amount €5) as soon as the user opens the chat and picks medications. If the user abandons the flow before paying, these empty pending rows pile up in the admin Prescription Refills table and confuse staff.

**Required backend change — pick ONE of these approaches:**

### Option A (preferred) — Defer DB insert until checkout
1. Make `POST /api/prescription/create-refill` return an in-memory/session-only `refill_id` (e.g. a UUID stored in Redis or a short-lived `refill_sessions` table) instead of inserting into `prescription_refills`.
2. Endpoints that currently write against `refill_id` (`/medications`, `/patient-info`, `/email`, `/refill-chat`) should write to the same session store, NOT to `prescription_refills`.
3. Only when the user hits the Stripe checkout endpoint (`/api/prescription/checkout` or equivalent) do you:
   - Create the real `prescription_refills` row with status `pending` + Stripe `payment_intent_id`.
   - Copy medications / patient info / email from the session store into the new row + child tables.
4. After Stripe webhook confirms `payment_intent.succeeded`, flip status to `paid`.

### Option B (minimum) — Filter abandoned rows from admin endpoints
If Option A is too invasive, at least exclude abandoned sessions from `GET /api/admin/prescription-refills`:
```sql
WHERE NOT (payment_status = 'pending' AND stripe_payment_intent_id IS NULL)
```
And add a nightly cleanup job that deletes `prescription_refills` rows older than 24h where `payment_status = 'pending'` AND `stripe_payment_intent_id IS NULL`.

**Apply the same logic to `referral_letters` and any other table that follows the same "create on session start" pattern.**
