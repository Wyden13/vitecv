// Shared by the background worker (importScripts) and the content script.
// Switch to the Vercel URL to point a build at production.
globalThis.VCV_CONFIG = {
  APP_BASE_URL: "http://localhost:3000",
  // APP_BASE_URL: "https://vitecv-iota.vercel.app",
};
