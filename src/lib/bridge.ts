/**
 * postMessage bridge — Process Checklist (child) ↔ Opsette (parent).
 *
 * Protocol v1.1 — see memory/project_checklist_tool.md for the full spec.
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
 *   { type: 'init',           presets, items }           // items = [{ data_id, value }, ...]
 *   { type: 'saved',          data_id, updated_at }
 *   { type: 'presets_saved',  updated_at }
 *   { type: 'deleted',        data_id }
 *   { type: 'error',          request_id, message }
 */

import { v4 as uuidv4 } from 'uuid';
import type { Checklist, Presets } from '@/types';

const TRUSTED_ORIGINS = new Set([
  'https://opsette.io',
  'http://localhost:8081',
]);

const MESSAGE_SOURCE = 'opsette';
const MESSAGE_VERSION = 1;
const INIT_TIMEOUT_MS = 1000;
const REQUEST_TIMEOUT_MS = 5000;

export interface InitPayload {
  presets: Presets;
  items: Array<{ data_id: string; value: Checklist }>;
}

interface Envelope {
  source: typeof MESSAGE_SOURCE;
  version: typeof MESSAGE_VERSION;
  type: string;
  [k: string]: unknown;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
  /** What to match incoming messages against. */
  matcher: (msg: Envelope) => boolean;
}

function isTrustedEnvelope(e: MessageEvent): e is MessageEvent<Envelope> {
  if (!TRUSTED_ORIGINS.has(e.origin)) return false;
  const d = e.data as Envelope | null;
  return !!d && d.source === MESSAGE_SOURCE && d.version === MESSAGE_VERSION && typeof d.type === 'string';
}

function postToParent(payload: Omit<Envelope, 'source' | 'version'>) {
  const msg: Envelope = { source: MESSAGE_SOURCE, version: MESSAGE_VERSION, ...payload };
  // We don't know which trusted origin is hosting us (prod vs. local dev), so we try each.
  // Same-origin iframes would use '*' but we want strict origin on production.
  for (const origin of TRUSTED_ORIGINS) {
    try {
      window.parent.postMessage(msg, origin);
    } catch {
      // ignore — wrong origin gets silently dropped by the browser
    }
  }
}

export interface Bridge {
  /** Shape from parent's init message. Only present when bridge is active. */
  init: InitPayload;
  save: (data_id: string, value: Checklist) => Promise<void>;
  savePresets: (presets: Presets) => Promise<void>;
  remove: (data_id: string) => Promise<void>;
  /** Register a callback to be notified when any in-flight request times out. */
  onTimeout: (handler: (message: string) => void) => void;
}

/**
 * Attempts the handshake with the parent. Resolves with a Bridge if the parent
 * responds with `init` within INIT_TIMEOUT_MS, or `null` if no parent is
 * available or the handshake times out (→ caller falls back to localStorage).
 */
export async function connectBridge(): Promise<Bridge | null> {
  // Not inside an iframe → standalone. Nothing to do.
  if (typeof window === 'undefined' || window.parent === window) return null;

  return new Promise<Bridge | null>((resolve) => {
    let resolved = false;
    const pending = new Map<string, PendingRequest>();
    let timeoutHandler: ((message: string) => void) | null = null;

    const messageListener = (e: MessageEvent) => {
      if (!isTrustedEnvelope(e)) return;
      const msg = e.data;

      if (!resolved && msg.type === 'init') {
        resolved = true;
        clearTimeout(initTimeout);

        const payload: InitPayload = {
          presets: (msg.presets as Presets) ?? { categories: [] },
          items: Array.isArray(msg.items) ? (msg.items as InitPayload['items']) : [],
        };

        const bridge: Bridge = {
          init: payload,
          save: (data_id, value) => sendRequest('save',
            { data_id, value },
            (m) => m.type === 'saved' && m.data_id === data_id,
            (m) => m.type === 'error',
          ),
          savePresets: (presets) => sendRequest('save_presets',
            { presets },
            (m) => m.type === 'presets_saved',
            (m) => m.type === 'error',
          ),
          remove: (data_id) => sendRequest('delete',
            { data_id },
            (m) => m.type === 'deleted' && m.data_id === data_id,
            (m) => m.type === 'error',
          ),
          onTimeout: (handler) => { timeoutHandler = handler; },
        };
        resolve(bridge);
        return;
      }

      // After init, route acks to pending requests.
      for (const [requestId, req] of pending) {
        if (req.matcher(msg)) {
          clearTimeout(req.timeoutId);
          pending.delete(requestId);
          if (msg.type === 'error') {
            req.reject(new Error(typeof msg.message === 'string' ? msg.message : 'Unknown error'));
          } else {
            req.resolve(msg);
          }
          return;
        }
      }
    };

    const sendRequest = <T>(
      type: string,
      payload: Record<string, unknown>,
      successMatcher: (msg: Envelope) => boolean,
      errorMatcher: (msg: Envelope) => boolean,
    ): Promise<T> => {
      const request_id = uuidv4();
      return new Promise<T>((resolveReq, rejectReq) => {
        const timeoutId = setTimeout(() => {
          pending.delete(request_id);
          const errMsg = `Bridge request timed out: ${type}`;
          if (timeoutHandler) timeoutHandler(errMsg);
          rejectReq(new Error(errMsg));
        }, REQUEST_TIMEOUT_MS);

        pending.set(request_id, {
          resolve: resolveReq as PendingRequest['resolve'],
          reject: rejectReq,
          timeoutId,
          matcher: (m) => {
            // Errors are addressed by request_id; successes by their own rules.
            if (errorMatcher(m) && m.request_id === request_id) return true;
            return successMatcher(m);
          },
        });

        postToParent({ type, request_id, ...payload });
      });
    };

    window.addEventListener('message', messageListener);
    postToParent({ type: 'ready' });

    const initTimeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      window.removeEventListener('message', messageListener);
      resolve(null);
    }, INIT_TIMEOUT_MS);
  });
}
