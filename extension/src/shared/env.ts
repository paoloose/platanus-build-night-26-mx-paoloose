// Build-time environment. `process.env.WEBPASSPORT_ENV` is replaced at build by
// a string literal (see build.ts define). Everything else derives from it.

export const WEBPASSPORT_ENV: string = process.env.WEBPASSPORT_ENV ?? "debug";

/** Debug builds expose dev-only UI (e.g. the global enable toggle). */
export const IS_DEBUG: boolean = WEBPASSPORT_ENV !== "prod";

/** Central server URL — switches by build environment. */
export const SERVER_URL: string =
  WEBPASSPORT_ENV === "prod" ? "https://web-passport.vercel.app" : "http://localhost:3000";
