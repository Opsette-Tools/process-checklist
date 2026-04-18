import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { connectBridge, type Bridge } from "./lib/bridge";
import "./index.css";

// When rendered inside an iframe, unregister any existing service worker so
// the host page isn't subject to our cached shell.
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

// Try the postMessage handshake before rendering so the first load path
// has either a populated Bridge or a definite "standalone" signal. The
// bridge attempt resolves within 1s regardless — render is never blocked.
connectBridge().then((bridge: Bridge | null) => {
  createRoot(document.getElementById("root")!).render(<App bridge={bridge} />);
});
