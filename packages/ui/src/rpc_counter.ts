import { http as viemHttp } from "viem";

let requestCount = 0;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export const rpcCounter = {
  get count() {
    return requestCount;
  },

  reset() {
    requestCount = 0;
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

/**
 * Drop-in replacement for viem's `http()` transport that counts every RPC request.
 */
export function countedHttp(
  url?: string,
  config?: Parameters<typeof viemHttp>[1]
): ReturnType<typeof viemHttp> {
  const originalOnFetchRequest = config?.onFetchRequest;
  return viemHttp(url, {
    ...config,
    onFetchRequest: (request, init) => {
      requestCount++;
      notify();
      return originalOnFetchRequest?.(request, init);
    }
  });
}
