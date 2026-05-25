// Stripe Payment Links (hosted) — direct redirect, no SDK needed
// Test links must match the correct Stripe product (Pro $5 / Enterprise $10).
export const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  pro: "https://buy.stripe.com/test_6oUfZi5xd5YF7IefHE9Zm02",
  enterprise: "https://buy.stripe.com/test_00w14ogbR3Qx8MifHE9Zm03",
};

export const PENDING_PLAN_STORAGE_KEY = "cira_pending_plan";

/** Your public app URL (no trailing slash). Set VITE_APP_URL in .env for deploy. */
export const APP_URL = (import.meta.env.VITE_APP_URL || "https://askainurse.com").replace(/\/$/, "");

/**
 * Individual after-payment URLs — paste each into the matching Stripe Payment Link.
 * Stripe replaces {CHECKOUT_SESSION_ID} automatically.
 */
export const STRIPE_AFTER_PAYMENT_URLS: Record<string, string> = {
  pro: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=pro`,
  enterprise: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=enterprise`,
};
