/**
 * postMessage bridge — Process Checklist (child) ↔ Opsette (parent).
 *
 * Protocol v1.1. Mirrors Script Builder's bridge (proven working in prod).
 *
 * Message envelope: every message carries { source: 'opsette', version: 1, type, ... }.
 *
 * Child → Parent:
 *   { type: 'ready' }
 *   { type: 'save',         request_id, data_id, value }
 *   { type: 'save_presets', request_id, presets }
 *   { type: 'delete',       request_id, data_id }
 *
 * Parent → Child:
 *   { type: 'init',           presets, items }               // items = [{ data_id, value }, ...]
 *   { type: 'saved',          request_id, data_id, updated_at }
 *   { type: 'presets_saved',  request_id, updated_at }
 *   { type: 'deleted',        request_id, data_id }
 *   { type: 'error',          request_id, message }
 *
 * Acks are matched on `request_id` (NOT data_id/type) so parallel saves don't
 * cross-resolve — this was the main bug in the previous implementation.
 */

import type { Checklist, Presets } from '@/types';

const TRUSTED_ORIGINS = ['https://opsette.io', 'http://localhost:8081'] as const;
const MESSAGE_SOURCE = 'opsette';
const MESSAGE_VERSION = 1;
const HANDSHAKE_TIMEOUT_MS = 1000;
const REQUEST_TIMEOUT_MS = 5000;

export interface InitPayload {
  presets: Presets;
  items: Array<{ data_id: string; value: Checklist }>;
}

export interface Bridge {
  /** Shape from parent's init message. Only present when the bridge is active. */
  init: InitPayload;
  save: (data_id: string, value: Checklist) => Promise<void>;
  savePresets: (presets: Presets) => Promise<void>;
  delete: (data_id: string) => Promise<void>;
  /** Register a callback invoked when any in-flight request times out. Returns an unsubscribe. */
  onTimeout: (handler: () => void) => () => void;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function isTrustedOrigin(origin: string): boolean {
  return (TRUSTED_ORIGINS as readonly string[]).includes(origin);
}

function isValidEnvelope(msg: unknown): msg is { source: string; version: number; type: string; [k: string]: unknown } {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  return m.source === MESSAGE_SOURCE && m.version === MESSAGE_VERSION && typeof m.type === 'string';
}

function postToAllowedOrigins(message: Record<string, unknown>): void {
  for (const origin of TRUSTED_ORIGINS) {
    try {
      window.parent.postMessage(message, origin);
    } catch {
      // Browser drops wrong-origin deliveries silently; ignore thrown errors.
    }
  }
}

export function connectBridge(): Promise<Bridge | null> {
  if (typeof window === 'undefined' || window.parent === window) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const pending = new Map<string, PendingRequest>();
    const timeoutHandlers = new Set<() => void>();
    let handshakeSettled = false;
    let handshakeTimeoutId: ReturnType<typeof setTimeout>;

    const handleMessage = (event: MessageEvent) => {
      if (!isTrustedOrigin(event.origin)) return;
      if (!isValidEnvelope(event.data)) return;

      const msg = event.data;

      // Handshake: parent's first `init` settles the promise and builds the Bridge.
      if (!handshakeSettled && msg.type === 'init') {
        handshakeSettled = true;
        clearTimeout(handshakeTimeoutId);

        const rawPresets = (msg.presets && typeof msg.presets === 'object')
          ? msg.presets as Partial<Presets>
          : {};
        const presets: Presets = {
          categories: Array.isArray(rawPresets.categories) ? rawPresets.categories : [],
        };
        const items = Array.isArray(msg.items) ? msg.items as InitPayload['items'] : [];

        resolve(buildBridge({ presets, items }, pending, timeoutHandlers));
        return;
      }

      if (!handshakeSettled) return;

      // Post-init: every ack is matched on request_id.
      const requestId = typeof msg.request_id === 'string' ? msg.request_id : null;
      if (!requestId) return;

      const req = pending.get(requestId);
      if (!req) return;

      clearTimeout(req.timeoutId);
      pending.delete(requestId);

      if (msg.type === 'error') {
        const message = typeof msg.message === 'string' ? msg.message : 'Unknown bridge error';
        req.reject(new Error(message));
      } else {
        // Any non-error ack with a matching request_id → success.
        req.resolve(msg);
      }
    };

    // Set the handshake timeout BEFORE posting `ready` so the handshake is armed
    // no matter how synchronously the parent replies.
    handshakeTimeoutId = setTimeout(() => {
      if (handshakeSettled) return;
      handshakeSettled = true;
      window.removeEventListener('message', handleMessage);
      resolve(null);
    }, HANDSHAKE_TIMEOUT_MS);

    window.addEventListener('message', handleMessage);

    postToAllowedOrigins({
      source: MESSAGE_SOURCE,
      version: MESSAGE_VERSION,
      type: 'ready',
    });
  });
}

function buildBridge(
  init: InitPayload,
  pending: Map<string, PendingRequest>,
  timeoutHandlers: Set<() => void>,
): Bridge {
  const sendRequest = <T>(payload: Record<string, unknown>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const requestId = newRequestId();

      const timeoutId = setTimeout(() => {
        if (!pending.has(requestId)) return;
        pending.delete(requestId);
        timeoutHandlers.forEach((h) => {
          try { h(); } catch {}
        });
        reject(new Error('Request timed out'));
      }, REQUEST_TIMEOUT_MS);

      pending.set(requestId, {
        resolve: resolve as PendingRequest['resolve'],
        reject,
        timeoutId,
      });

      postToAllowedOrigins({
        source: MESSAGE_SOURCE,
        version: MESSAGE_VERSION,
        request_id: requestId,
        ...payload,
      });
    });
  };

  return {
    init,
    save: (data_id, value) => sendRequest<unknown>({ type: 'save', data_id, value }).then(() => undefined),
    savePresets: (presets) => sendRequest<unknown>({ type: 'save_presets', presets }).then(() => undefined),
    delete: (data_id) => sendRequest<unknown>({ type: 'delete', data_id }).then(() => undefined),
    onTimeout: (handler) => {
      timeoutHandlers.add(handler);
      return () => { timeoutHandlers.delete(handler); };
    },
  };
}
