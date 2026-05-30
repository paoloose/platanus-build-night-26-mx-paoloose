// Offscreen document — hosts IndexedDB on behalf of the ephemeral service worker.
// In M1 this opens the DB (via `idb`) and answers data requests from the brain.
// M0: just acknowledge load so we can confirm the offscreen lifecycle works.

console.log("[web-passport] offscreen document loaded");

export {};
