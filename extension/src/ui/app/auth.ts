// Local sign-in flag. PLACEHOLDER for real Clerk auth (M4): when Clerk lands,
// this is replaced by @clerk/chrome-extension session state. Kept behind these
// two functions so the swap is localized.

const KEY = "wp:auth";

export async function isSignedIn(): Promise<boolean> {
  const stored = await chrome.storage.local.get(KEY);
  return Boolean((stored[KEY] as { signedIn?: boolean } | undefined)?.signedIn);
}

export async function setSignedIn(signedIn: boolean): Promise<void> {
  await chrome.storage.local.set({ [KEY]: { signedIn } });
}
