// Checkpoint page entrypoint.
import { createRoot } from "react-dom/client";
import { App } from "./ui/checkpoint/App.tsx";

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
