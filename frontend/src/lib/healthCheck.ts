const BACKEND_URL = 'https://echo-backend-pml9.onrender.com';

async function pingBackend(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s ping timeout
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

// Fire-and-forget warm-up ping — does not block the caller
export function wakeUpBackend(): void {
  pingBackend().then((ok) => {
    console.log(ok ? 'Backend is awake' : 'Backend ping failed (may still be starting)');
  });
}

// Waits up to 90s for the backend to respond, retrying every 15s
export async function ensureBackendReady(): Promise<void> {
  const RETRY_INTERVAL = 15000;
  const MAX_WAIT = 90000;
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT) {
    const ok = await pingBackend();
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
  }

  // Don't throw — let the actual API call fail with a real error message
  console.warn('Backend did not respond in time; proceeding anyway');
}