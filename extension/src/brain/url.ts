// URL / territory helpers.

/**
 * The "territory" key for a URL. M1 uses the hostname minus a leading "www."
 * (so subdomains count as distinct territories). Proper eTLD+1 via the Public
 * Suffix List is a later refinement.
 */
export function domainOf(rawUrl: string): string | null {
  try {
    const { hostname, protocol } = new URL(rawUrl);
    if (protocol !== "http:" && protocol !== "https:") return null;
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** True for URLs the consul should never gate (extension pages, browser pages, etc.). */
export function isGatedUrl(rawUrl: string): boolean {
  return domainOf(rawUrl) !== null;
}

/** Build the checkpoint page URL for a destination. */
export function checkpointUrlFor(dest: string): string {
  return chrome.runtime.getURL(`checkpoint.html?dest=${encodeURIComponent(dest)}`);
}
