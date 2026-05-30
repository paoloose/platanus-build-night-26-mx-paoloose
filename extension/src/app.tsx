// App / onboarding page entrypoint.
import { createRoot } from "react-dom/client";
import { AppRoot } from "./ui/app/AppRoot.tsx";

const root = document.getElementById("root");
if (root) createRoot(root).render(<AppRoot />);
