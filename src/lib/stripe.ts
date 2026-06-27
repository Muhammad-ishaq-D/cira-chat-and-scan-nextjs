// Stripe Payment Links (hosted) — direct redirect, no SDK needed.
export const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  pro: "https://buy.stripe.com/4gM28scZF5YFbYufHE9Zm00",
  enterprise: "https://buy.stripe.com/eVq8wQcZF1IpbYubro9Zm01",

  // Prescription refill — €10.00 one-time (EUR). Replace with your live Stripe Payment Link.
  prescription_refill: "https://buy.stripe.com/test_6oU14o4t9biZ2nU6749Zm06",

  // Referral letter — €10.00 one-time (EUR). Replace with your live Stripe Payment Link.
  referral_letter: "https://buy.stripe.com/test_5kQ7sM5xd72J5A68fc9Zm07",
};

export const PENDING_PLAN_STORAGE_KEY = "cira_pending_plan";

/** Your public app URL (no trailing slash). Set VITE_APP_URL in .env for deploy. */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://askainurse.com").replace(/\/$/, "");

/**
 * Individual after-payment URLs — paste each into the matching Stripe Payment Link.
 * Stripe replaces {CHECKOUT_SESSION_ID} automatically.
 */
export const STRIPE_AFTER_PAYMENT_URLS: Record<string, string> = {
  pro: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=pro`,
  enterprise: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=enterprise`,
};
