import { readPersonaPackage } from "./personas-lib";
import LandingClient from "./LandingClient";

export default async function Home() {
  const persona = await readPersonaPackage("consul");
  if (!persona) {
    return (
      <div style={{ padding: 48, color: "var(--wp-fg)" }}>
        <h1>Web Passport</h1>
        <p style={{ color: "var(--wp-muted)" }}>The consul is not available right now.</p>
      </div>
    );
  }

  return <LandingClient persona={persona} />;
}
