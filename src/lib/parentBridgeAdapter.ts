/**
 * postMessage adapter for the Opsette parent app. Used when this tool is
 * embedded as a marketplace iframe in opsette.io. See
 * `c--opsette-opsette-v2/memory/project_checklist_tool.md` for the protocol.
 *
 * Standalone use (tool loaded directly in a browser) goes through the default
 * LocalStorageAdapter — no parent, no bridge.
 */
import { v4 as uuidv4 } from 'uuid';
import type { StorageAdapter } from './storageAdapter';

const REQUEST_TIMEOUT_MS = 5000;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface ResponseMessage {
  type: string;
  requestId?: string;
  value?: unknown;
  ok?: boolean;
  error?: string;
}

export class ParentBridgeAdapter implements StorageAdapter {
  private pending = new Map<string, PendingRequest>();
  private parent: Window;
  private parentOrigin: string;
  private onTimeout: () => void;

  constructor(parent: Window, parentOrigin: string, onTimeout: () => void) {
    this.parent = parent;
    this.parentOrigin = parentOrigin;
    this.onTimeout = onTimeout;
    window.addEventListener('message', this.handleMessage);
  }

  private handleMessage = (event: MessageEvent) => {
    if (event.origin !== this.parentOrigin) return;
    const data = event.data as ResponseMessage | undefined;
    if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;
    if (!data.type.endsWith(':response')) return;
    if (typeof data.requestId !== 'string') return;

    const pending = this.pending.get(data.requestId);
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    this.pending.delete(data.requestId);

    if (data.type === 'opsette:storage:read:response') {
      pending.resolve(data.value);
    } else if (
      data.type === 'opsette:storage:write:response' ||
      data.type === 'opsette:storage:delete:response'
    ) {
      if (data.ok) pending.resolve(undefined);
      else pending.reject(new Error(data.error ?? 'Storage request failed'));
    }
  };

  private request<T>(type: string, payload: Record<string, unknown>): Promise<T> {
    const requestId = uuidv4();
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(requestId);
        this.onTimeout();
        reject(new Error(`Bridge request timed out: ${type}`));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeoutId,
      });

      this.parent.postMessage({ ...payload, type, requestId }, this.parentOrigin);
    });
  }

  async read<T>(key: string, fallback: T): Promise<T> {
    try {
      const value = await this.request<unknown>('opsette:storage:read', { key });
      if (value == null) return fallback;
      return value as T;
    } catch {
      return fallback;
    }
  }

  async write<T>(key: string, value: T): Promise<void> {
    await this.request<void>('opsette:storage:write', { key, value });
  }

  async remove(key: string): Promise<void> {
    await this.request<void>('opsette:storage:delete', { key });
  }
}
