/**
 * Bridge bootstrap. Runs once before the app renders.
 *
 * If we're inside an iframe and the parent at https://opsette.io replies to
 * our `opsette:ready` handshake within 1 second, swap the storage adapter to
 * the postMessage bridge. Otherwise leave LocalStorageAdapter in place.
 */
import { ParentBridgeAdapter } from './parentBridgeAdapter';
import { setStorageAdapter } from './storageAdapter';

const PARENT_ORIGINS = [
  'https://opsette.io',
  'http://localhost:8081',
];

function isAllowedOrigin(origin: string): boolean {
  return PARENT_ORIGINS.includes(origin);
}
const HANDSHAKE_TIMEOUT_MS = 1000;

export type BridgeStatus = 'idle' | 'standalone' | 'connected' | 'error';

export interface BridgeContext {
  active: boolean;
  appId?: string;
  storageScope?: 'per_user' | 'shared';
}

interface ConfigMessage {
  type: 'opsette:config';
  appId: string;
  storageScope: 'per_user' | 'shared';
  user?: { id: string; firstName?: string };
}

let bridgeStatus: BridgeStatus = 'idle';

export function getBridgeStatus(): BridgeStatus {
  return bridgeStatus;
}

export function bootstrapStorage(onTimeout: () => void): Promise<BridgeContext> {
  if (typeof window === 'undefined' || window.parent === window) {
    return Promise.resolve({ active: false });
  }

  return new Promise((resolve) => {
    const parent = window.parent;
    let settled = false;

    const handler = (event: MessageEvent) => {
      if (!isAllowedOrigin(event.origin)) return;
      const data = event.data as ConfigMessage | undefined;
      if (!data || typeof data !== 'object' || data.type !== 'opsette:config') return;
      if (typeof data.appId !== 'string') return;
      if (data.storageScope !== 'per_user' && data.storageScope !== 'shared') return;

      settled = true;
      window.removeEventListener('message', handler);
      clearTimeout(timer);

      bridgeStatus = 'connected';
      setStorageAdapter(
        new ParentBridgeAdapter(parent, event.origin, () => {
          bridgeStatus = 'error';
          onTimeout();
        }),
      );
      resolve({ active: true, appId: data.appId, storageScope: data.storageScope });
    };

    const timer = setTimeout(() => {
      if (settled) return;
      window.removeEventListener('message', handler);
      bridgeStatus = 'standalone';
      resolve({ active: false });
    }, HANDSHAKE_TIMEOUT_MS);

    window.addEventListener('message', handler);
    parent.postMessage({ type: 'opsette:ready', version: 1 }, '*');
  });
}
