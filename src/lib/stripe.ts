import { loadStripe, Stripe } from "@stripe/stripe-js";

const publishableKey =
  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) ||
  "pk_live_51TQlpUJuUSGswJVkH5x37I3TqGaV8tziVh5skvnIrX05ba2sCO1al9vm0NDxPwxUtsAAgrlofodHnRPrUwX9akwA00MTCj1vMC";

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
  if (!publishableKey) {
    console.warn("[stripe] VITE_STRIPE_PUBLISHABLE_KEY is not set");
    return Promise.resolve(null);
  }
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
};

// Map UI plan id -> Stripe Price ID (env can override; falls back to hardcoded live IDs)
export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  pro:
    (import.meta.env.VITE_STRIPE_PRICE_PRO as string | undefined) ||
    "price_1TavxIJuUSGswJVkvjZVVn9n",
  enterprise:
    (import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE as string | undefined) ||
    "price_1TavyyJuUSGswJVkqR7B98RM",
};
