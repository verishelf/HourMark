type Listener = () => void;

const listeners = new Set<Listener>();

/** Notify screens to reload listings, posts, and related feed data. */
export function notifyContentRefresh() {
  listeners.forEach((listener) => listener());
}

export function subscribeContentRefresh(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
