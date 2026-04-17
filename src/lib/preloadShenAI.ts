/**
 * Warm the Shen AI SDK before the user opens the Vitals Scan page.
 *
 * The SDK's WebAssembly bundle is ~35 MB, which dominates the time-to-first-frame
 * of /vitals-scan. By kicking off the WASM fetch (and the JS module import) the
 * moment the user lands on the dashboard or chat, the file lives in HTTP cache
 * by the time they actually click "Scan" — making the scan feel near-instant.
 *
 * Safe to call multiple times: we guard with a module-level flag and rely on the
 * browser's HTTP cache + the dynamic-import cache to dedupe the work.
 */
let warmedUp = false;

export function preloadShenAI(): void {
  if (warmedUp) return;
  warmedUp = true;

  if (typeof window === "undefined") return;

  // Defer until the browser is idle so we never compete with the user's first paint.
  const start = () => {
    // 1) Prefetch the WASM bytes into the HTTP cache.
    try {
      fetch("/wasm/shenai_sdk.wasm", { cache: "force-cache", priority: "low" as any }).catch(
        () => {
          /* network errors are fine — we'll just try again at scan time */
        }
      );
    } catch {
      /* ignore */
    }

    // 2) Warm up the JS module so Vite has it parsed and ready.
    import("shenai-sdk").catch(() => {
      /* ignore — we'll re-import at scan time */
    });
  };

  if (typeof (window as any).requestIdleCallback === "function") {
    (window as any).requestIdleCallback(start, { timeout: 3000 });
  } else {
    setTimeout(start, 1500);
  }
}
