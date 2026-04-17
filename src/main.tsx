import { createRoot } from "react-dom/client";
import { message } from "antd";
import App from "./App.tsx";
import "./index.css";
import { bootstrapStorage } from "./lib/bridgeBootstrap";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

if (isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  }).catch(() => {});
}

let timeoutToastShown = false;
function handleBridgeTimeout() {
  if (timeoutToastShown) return;
  timeoutToastShown = true;
  message.error("Couldn't reach Opsette to save. Try again in a moment.");
  // Allow another toast after a cooldown so repeated failures aren't silenced forever.
  setTimeout(() => {
    timeoutToastShown = false;
  }, 8000);
}

bootstrapStorage(handleBridgeTimeout).finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
