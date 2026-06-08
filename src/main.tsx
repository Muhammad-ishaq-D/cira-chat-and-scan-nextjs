import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initActivityTracker } from "./lib/activityTracker";

initActivityTracker();

createRoot(document.getElementById("root")!).render(<App />);
