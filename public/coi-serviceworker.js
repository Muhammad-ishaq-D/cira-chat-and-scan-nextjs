/*! coi-serviceworker v0.1.7-fix-1 - Guido Zuidhof and contributors, licensed under MIT */
// Bump this version when the WASM file changes to invalidate the cache.
const WASM_CACHE_VERSION = 'cira-wasm-v7';

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
        const url = new URL(r.url);
        if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
            return;
        }

        event.respondWith((async () => {
            let hasScanMode = false;
            if (r.mode === "navigate") {
                // For navigation requests, check both query param and pathname.
                // The pathname match covers cases where the client URL hasn't updated yet.
                hasScanMode =
                    url.searchParams.get("mode") === "scan" ||
                    url.pathname === "/vitals-scan";
            } else if (event.clientId) {
                try {
                    const client = await self.clients.get(event.clientId);
                    if (client && client.url) {
                        const clientUrl = new URL(client.url);
                        hasScanMode =
                            clientUrl.searchParams.get("mode") === "scan" ||
                            clientUrl.pathname === "/vitals-scan";
                    }
                } catch (e) {
                    // Fallback if client cannot be fetched
                }
            }

            const needsHeaders = hasScanMode;

            const request = (coepCredentialless && r.mode === "no-cors")
                ? new Request(r, { credentials: "omit" })
                : r;

            // Cache-first strategy for large WASM files — avoids re-downloading 10+ MB on every visit.
            // Only applies to SAME-ORIGIN WASM. Cross-origin WASM (e.g. CloudFront CDN) must pass
            // through untouched so the browser can stream-instantiate it; reading .arrayBuffer() on
            // an opaque/cross-origin response breaks WebAssembly.instantiateStreaming and forces the
            // browser to download the file instead of executing it.
            if (url.pathname.endsWith(".wasm") && url.origin === self.location.origin) {
                try {
                    const cache = await caches.open(WASM_CACHE_VERSION);
                    const cached = await cache.match(r.url);
                    if (cached) return cached;

                    const response = await fetch(request);
                    if (!response.ok) return response;

                    const buf = await response.arrayBuffer();
                    const newHeaders = new Headers(response.headers);
                    if (needsHeaders) {
                        newHeaders.set("Cross-Origin-Embedder-Policy",
                            coepCredentialless ? "credentialless" : "require-corp"
                        );
                        if (!coepCredentialless) {
                            newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
                        }
                        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
                    }

                    const modified = new Response(buf, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                    cache.put(r.url, modified.clone());
                    return modified;
                } catch (e) {
                    console.error(e);
                    return fetch(request);
                }
            }


            try {
                const response = await fetch(request);
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
            } catch (e) {
                console.error(e);
                return Response.error();
            }
        })());
    });

} else {
    (() => {
        const needsCrossOriginIsolation = () => {
            const pathname = window.location.pathname;
            const mode = new URL(window.location.href).searchParams.get("mode");
            return pathname === "/vitals-scan" || mode === "scan";
        };

        const coi = {
            shouldRegister: () => needsCrossOriginIsolation(),
            shouldDeregister: () => !needsCrossOriginIsolation(),
            coepCredentialless: () => false,
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

                    // Force an immediate update check so returning users don't stay on an old
                    // version for up to 24 hours. Skip this on /vitals-scan to avoid reloading
                    // mid-scan setup.
                    if (window.location.pathname !== "/vitals-scan") {
                        registration.update();
                    }

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
