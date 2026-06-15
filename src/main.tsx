import { createRoot, hydrateRoot } from "react-dom/client";

import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initActivityTracker } from "./lib/activityTracker";
import { initConsentSync } from "./lib/consent";

initActivityTracker();
initConsentSync();

const container = document.getElementById("root")!;

// App.tsx already wraps content in BrowserRouter, so we only mount <App /> here.
const tree = (
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// If the container already has rendered children (prerendered HTML from
// scripts/prerender.mjs), hydrate it. Otherwise do a fresh client render.
if (container.hasChildNodes()) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
