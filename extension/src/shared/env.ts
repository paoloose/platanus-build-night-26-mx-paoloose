// Build-time environment. `process.env.WEBPASSPORT_ENV` is replaced at build by
// a string literal (see build.ts define), so this works in the browser bundle.

export const WEBPASSPORT_ENV: string = process.env.WEBPASSPORT_ENV ?? "debug";

/** Debug builds expose dev-only UI (e.g. the global enable toggle). */
export const IS_DEBUG: boolean = WEBPASSPORT_ENV !== "prod";
