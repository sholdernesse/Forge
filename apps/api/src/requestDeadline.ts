/** Bound headers and body parsing; abort the transport and release the timer. */
export async function requestDeadline<T>(timeoutMs: number, operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let rejectTimeout: (reason: Error) => void = () => undefined;
  const timeout = new Promise<never>((_resolve, reject) => { rejectTimeout = reject; });
  const timer = setTimeout(() => {
    const error = new DOMException('Provider request timed out', 'TimeoutError');
    controller.abort(error);
    rejectTimeout(error);
  }, timeoutMs);
  try { return await Promise.race([operation(controller.signal), timeout]); }
  finally { clearTimeout(timer); }
}
