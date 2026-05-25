import { loadStripe, Stripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
  if (!publishableKey) {
    console.warn("[stripe] VITE_STRIPE_PUBLISHABLE_KEY is not set");
    return Promise.resolve(null);
  }
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
};

// Map UI plan id -> Stripe Price ID (configurable via env, overridable by API)
export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  pro: import.meta.env.VITE_STRIPE_PRICE_PRO as string | undefined,
  enterprise: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE as string | undefined,
};
