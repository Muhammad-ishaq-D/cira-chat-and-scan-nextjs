/*! coi-serviceworker v0.1.7-fix-1 - Guido Zuidhof and contributors, licensed under MIT */
// Bump this version when the WASM file changes to invalidate the cache.
const WASM_CACHE_VERSION = 'cira-wasm-v2';

let coepCredentialless = false;
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => {
        // Clean up old WASM cache versions
        event.waitUntil(
            caches.keys().then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k.startsWith('cira-wasm-') && k !== WASM_CACHE_VERSION)
                        .map((k) => caches.delete(k))
                )
            ).then(() => self.clients.claim())
        );
    });

    self.addEventListener("message", (ev) => {
        if (!ev.data) {
            return;
        } else if (ev.data.type === "deregister") {
            self.registration
                .unregister()
                .then(() => {
                    return self.clients.matchAll();
                })
                .then(clients => {
                    clients.forEach((client) => client.navigate(client.url));
                });
        } else if (ev.data.type === "coepCredentialless") {
            coepCredentialless = ev.data.value;
        }
    });

    self.addEventListener("fetch", function (event) {
        const r = event.request;
        if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
            return;
        }

        // Only add COOP/COEP headers for /vitals-scan pages (where SharedArrayBuffer is needed).
        // Adding these headers to other pages breaks Google Sign-In popup flow.
        const url = new URL(r.url);
        const isNavigationToVitalsScan = r.mode === "navigate" &&
            (url.pathname === "/vitals-scan" || url.pathname.startsWith("/vitals-scan/"));
        const isSubresourceForVitalsScan = r.mode !== "navigate";

        const needsHeaders = isNavigationToVitalsScan || isSubresourceForVitalsScan;

        const request = (coepCredentialless && r.mode === "no-cors")
            ? new Request(r, { credentials: "omit" })
            : r;

        // Cache-first strategy for large WASM files — avoids re-downloading 10+ MB on every visit.
        // The cached response already has the required COOP/COEP headers applied.
        if (url.pathname.endsWith(".wasm")) {
            event.respondWith(
                caches.open(WASM_CACHE_VERSION).then(async (cache) => {
                    const cached = await cache.match(r.url);
                    if (cached) return cached;

                    const response = await fetch(request);
                    if (!response.ok) return response;

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy",
                        coepCredentialless ? "credentialless" : "require-corp"
                    );
                    if (!coepCredentialless) {
                        newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
                    }
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                    if (response.body) {
                        // Return a streaming response to the page immediately so the browser can
                        // start WebAssembly.instantiateStreaming while bytes are still arriving.
                        // Cache the full body asynchronously in the background.
                        const responseToCache = response.clone();
                        responseToCache.arrayBuffer().then((buf) => {
                            cache.put(r.url, new Response(buf, {
                                status: response.status,
                                statusText: response.statusText,
                                headers: new Headers(newHeaders),
                            }));
                        }).catch(() => {});
                        return new Response(response.body, {
                            status: response.status,
                            statusText: response.statusText,
                            headers: newHeaders,
                        });
                    }

                    // Fallback for body-less responses (should not happen for WASM)
                    const buf = await response.arrayBuffer();
                    const modified = new Response(buf, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                    cache.put(r.url, modified.clone());
                    return modified;
                }).catch((e) => { console.error(e); return fetch(request); })
            );
            return;
        }

        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 0 || !needsHeaders) {
                        return response;
                    }

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy",
                        coepCredentialless ? "credentialless" : "require-corp"
                    );
                    if (!coepCredentialless) {
                        newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
                    }
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                    const body = (response.status === 204 || response.status === 205 || response.status === 304)
                        ? null
                        : response.body;

                    return new Response(body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((e) => console.error(e))
        );
    });

} else {
    (() => {
        const needsCrossOriginIsolation = () =>
            window.location.pathname === "/vitals-scan" || window.location.pathname.startsWith("/vitals-scan/");

        // You can customize the behavior of this script through a global `coi` variable.
        const coi = {
            shouldRegister: () => needsCrossOriginIsolation(),
            shouldDeregister: () => !needsCrossOriginIsolation(),
            coepCredentialless: () => !(window.chrome || window.netscape),
            doReload: () => window.location.reload(),
            quiet: false,
            ...window.coi
        };

        const n = navigator;

        if (n.serviceWorker && n.serviceWorker.controller) {
            n.serviceWorker.controller.postMessage({
                type: "coepCredentialless",
                value: coi.coepCredentialless(),
            });

            if (coi.shouldDeregister()) {
                n.serviceWorker.controller.postMessage({ type: "deregister" });
            }
        }

        // If we're already coi: do nothing. Perhaps it's due to this script doing its job, or COOP/COEP are
        // already set from the origin server. Also if the browser has no notion of crossOriginIsolated, just give up here.
        if (window.crossOriginIsolated !== false || !coi.shouldRegister()) return;

        if (!window.isSecureContext) {
            !coi.quiet && console.log("COOP/COEP Service Worker not registered, a secure context is required.");
            return;
        }

        // In some environments (e.g. Chrome incognito mode) this won't be available
        if (n.serviceWorker) {
            n.serviceWorker.register(window.document.currentScript.src).then(
                (registration) => {
                    !coi.quiet && console.log("COOP/COEP Service Worker registered", registration.scope);

                    registration.addEventListener("updatefound", () => {
                        !coi.quiet && console.log("Reloading page to make use of updated COOP/COEP Service Worker.");
                        coi.doReload();
                    });

                    // If the registration is active, but it's not controlling the page
                    if (registration.active && !n.serviceWorker.controller) {
                        !coi.quiet && console.log("Reloading page to make use of COOP/COEP Service Worker.");
                        coi.doReload();
                    }
                },
                (err) => {
                    !coi.quiet && console.error("COOP/COEP Service Worker failed to register:", err);
                }
            );
        }
    })();
}
