// The checkpoint PAGE — now the emergency fallback used only when the in-page
// overlay can't render (see overlay.tsx render detection). The destination was
// redirected here, so granting navigates the tab to it.

import { ConsulSession } from "../consul/ConsulSession.tsx";

export function App() {
  const dest = new URLSearchParams(location.search).get("dest");

  if (!dest) {
    return (
      <div className="wp-root">
        <div className="wp-stage">
          <div className="wp-dialogue">
            <p className="wp-dialogue__text">No destination specified.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConsulSession
      dest={dest}
      rootClassName="wp-root"
      onGrant={(redirectTo) => location.replace(redirectTo)}
      onDeny={() => {
        // Page fallback: there's nothing to reveal, so send them back.
        history.length > 1 ? history.back() : window.close();
      }}
    />
  );
}
