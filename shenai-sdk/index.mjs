import {
  initSentry,
  createPreloadDisplay,
  setLoadingProgressCallback,
  ensureBrowserCompatibility,
  ensureCameraAccess,
} from "./util/index.mjs";
import CreateShenaiSDK from "./shenai_sdk.mjs";
import { _initEnums } from "./enums/init.js";

async function CheckBrowserAndCreateShenaiSDK(...args) {
  const config = args[0] && typeof args[0] === "object" ? args[0] : {};
  if (config.enableErrorReporting !== false) {
    initSentry();
  }
  if (
    config.onWasmLoadingProgress &&
    typeof config.onWasmLoadingProgress === "function"
  ) {
    setLoadingProgressCallback(config.onWasmLoadingProgress);
  }
  if (config.enablePreloadDisplay !== false) {
    if (
      config.preloadDisplayCanvasId &&
      typeof config.preloadDisplayCanvasId === "string"
    ) {
      createPreloadDisplay(config.preloadDisplayCanvasId, {
        hideLogo: config.hidePreloadDisplayLogo !== false,
      });
    } else {
      createPreloadDisplay("mxcanvas", {
        hideLogo: config.hidePreloadDisplayLogo !== false,
      });
    }
  }
  ensureBrowserCompatibility();
  await ensureCameraAccess();
  const sdk = await CreateShenaiSDK(...args);
  _initEnums(sdk);

  const originalDeinitialize = sdk.deinitialize;
  sdk.deinitialize = function () {
    try {
      if (typeof originalDeinitialize === "function") {
        originalDeinitialize.apply(this, arguments);
      }
    } catch (e) {
      console.warn("[ShenAI] C++ deinitialize error:", e);
    }
    try {
      if (typeof sdk.terminateWorkers === "function") {
        sdk.terminateWorkers();
      }
    } catch (e) {
      console.warn("[ShenAI] terminateWorkers error:", e);
    }
  };

  return sdk;
}

export { createPreloadDisplay };
export * from "./enums/index.js";

export default CheckBrowserAndCreateShenaiSDK;
