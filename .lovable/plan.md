# Doctor Role + Prescription Review Workflow

## Overview
Add a new "Doctor" role. Admin creates doctor accounts (name, email, password, specialty, license #, phone, etc.). Doctors log in via a dedicated portal, see prescription refills assigned/pending, and approve or reject them. Email behavior changes: on payment the user only gets a payment confirmation (no PDF). PDF is sent only after a doctor approves. If rejected, user gets a refund-notification email and Stripe refund is issued.

---

## Frontend Changes (this project)

### 1. Admin → Doctors Management
- New page `src/admin/AdminDoctors.tsx` accessible from `AdminLayout` sidebar.
- Table of doctors: name, email, specialty, license #, phone, status (active/suspended), created date, actions (edit / suspend / reset password / delete).
- "Add Doctor" dialog with fields: full name, email, password (auto-generate option), specialty, license number, phone, bio (optional), avatar (optional).
- Uses new admin API: `adminApi.getDoctors`, `createDoctor`, `updateDoctor`, `suspendDoctor`, `deleteDoctor`, `resetDoctorPassword`.

### 2. Doctor Login + Portal
- New route `/doctor/login` — mirrors admin login UI.
- New layout `src/doctor/DoctorLayout.tsx` with sidebar: Dashboard, Pending Refills, Reviewed History, Profile, Logout.
- Pages:
  - `DoctorOverview.tsx` — counts (pending, approved today, rejected today).
  - `DoctorPendingRefills.tsx` — table of paid-but-unreviewed refills; row click opens review dialog showing patient info, medications, payment ref, "Approve & Send PDF" or "Reject & Refund" with required note.
  - `DoctorReviewedRefills.tsx` — history table with filter.
  - `DoctorProfile.tsx` — change password, edit phone/bio.
- JWT stored under `cira_doctor_token`; protected route wrapper `DoctorProtectedRoute.tsx`.
- `src/lib/doctorApi.ts` — `doctorAuth.login`, `doctorApi.getPendingRefills`, `getReviewedRefills`, `approveRefill(id, note?)`, `rejectRefill(id, reason)`, `getProfile`, `updateProfile`, `changePassword`.

### 3. Prescription Refill flow change (user side)
- On Stripe payment success, the user only sees: "Payment received. A licensed doctor will review your prescription within X hours. You'll receive your prescription PDF by email once approved." (No immediate PDF download.)
- Refill history badge updates to show `awaiting_review` / `approved` / `rejected` / `refunded`.

### 4. Admin updates
- `AdminPrescriptionRefills.tsx` — add `review_status` column (pending / approved / rejected) and reviewing doctor name; admin can override.

---

## Backend Prompt (for Antigravity)

Copy-paste into Antigravity to apply on the Node/MySQL backend:

````text
Add a "doctor" role to the existing Node.js + MySQL backend with a review workflow that gates prescription-refill PDF emails behind doctor approval.

## 1. Schema (new migration)

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
  status ENUM('active','suspended') DEFAULT 'active',
  created_by_admin_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE prescription_refills
  ADD COLUMN review_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  ADD COLUMN reviewed_by_doctor_id INT NULL,
  ADD COLUMN reviewed_at DATETIME NULL,
  ADD COLUMN doctor_note TEXT NULL,
  ADD COLUMN pdf_email_status ENUM('not_sent','sent','failed') DEFAULT 'not_sent',
  ADD FOREIGN KEY (reviewed_by_doctor_id) REFERENCES doctors(id);

## 2. Auth

- New JWT type with payload { sub: doctorId, role: 'doctor' }, separate secret env DOCTOR_JWT_SECRET (fallback to JWT_SECRET).
- POST /api/doctor/auth/login { email, password } -> { token, doctor }
- Middleware requireDoctor verifies JWT and loads doctor (reject if status='suspended').

## 3. Admin endpoints (protected by existing admin middleware)

GET    /api/admin/doctors                 -> list with search/status filter
POST   /api/admin/doctors                 -> create { name,email,password,specialty,license_number,phone,bio }
GET    /api/admin/doctors/:id
PUT    /api/admin/doctors/:id             -> update profile fields
POST   /api/admin/doctors/:id/suspend
POST   /api/admin/doctors/:id/activate
POST   /api/admin/doctors/:id/reset-password { new_password }
DELETE /api/admin/doctors/:id

Hash passwords with bcrypt (10+ rounds). Enforce unique email.

## 4. Doctor endpoints (requireDoctor)

GET  /api/doctor/profile
PUT  /api/doctor/profile                  -> name, phone, bio, avatar
POST /api/doctor/change-password          { current_password, new_password }

GET  /api/doctor/refills/pending          -> paid + review_status='pending'
GET  /api/doctor/refills/reviewed?status= -> approved|rejected|all (own reviews; admin sees all via admin route)
GET  /api/doctor/refills/:id              -> full detail incl. patient, meds, payment

POST /api/doctor/refills/:id/approve { note? }
  - Guard: payment_status='paid' AND review_status='pending'
  - Set review_status='approved', reviewed_by_doctor_id, reviewed_at=now, doctor_note
  - Generate prescription PDF (reuse existing generator)
  - Send email to refill.delivery_email with PDF attachment (existing template); set pdf_email_status
  - Return updated row

POST /api/doctor/refills/:id/reject { reason } (reason required, min 10 chars)
  - Guard same as above
  - Set review_status='rejected', doctor_note=reason
  - Issue Stripe refund via stripe.refunds.create({ payment_intent: stripe_payment_intent_id })
  - On success: payment_status='refunded', refund_status='approved'
  - Send "refund issued" email to delivery_email explaining the rejection reason
  - Return updated row

## 5. Change existing prescription-refill payment webhook / success handler

Currently on payment success: generate PDF + send PDF email.
Change to:
  - Mark payment_status='paid', review_status='pending'
  - Send "payment received, awaiting doctor review" email (NEW template) — no PDF attachment
  - Do NOT generate or email the PDF here

## 6. Email templates (add to existing mailer)

- payment_received_pending_review.html  (subject: "Payment received — prescription under review")
- prescription_approved.html            (existing PDF email, now triggered by doctor approve)
- prescription_rejected_refund.html     (subject: "Your prescription was not approved — refund issued"; include doctor's reason)

## 7. Admin extensions

- GET /api/admin/prescription-refills should also return review_status, reviewed_by_doctor_id, doctor name, reviewed_at, doctor_note.
- Optional: POST /api/admin/prescription-refills/:id/override-review for admin to force approve/reject.

## 8. Audit logging

Log every doctor action (login, approve, reject, refund) and admin doctor-management action to the existing audit_logs table with actor_type='doctor'|'admin'.

## 9. Seed / first doctor

Provide a one-off script `scripts/create-doctor.js` that takes name/email/password from CLI args and inserts a doctor (for bootstrap testing).
````

---

## Open Questions
1. Auto-assign refills to a specific doctor, or any logged-in doctor can claim any pending refill? (Plan assumes any doctor can review any pending refill.)
2. SLA / time limit before auto-refund if no doctor reviews? (Not included — easy to add later.)
3. Should the doctor see the patient's full name and chat history, or only medications + delivery email? (Plan shows medications, delivery email, payment ref — confirm.)
4. Should existing `RealDoctors.tsx` public doctor directory be linked to these new accounts, or kept separate? (Plan keeps them separate.)
