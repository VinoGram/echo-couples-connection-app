// Frontend keep-alive system
const BACKEND_URL = 'https://echo-backend-pml9.onrender.com';

let pingInterval: NodeJS.Timeout | null = null;

async function pingBackend() {
  try {
    await fetch(`${BACKEND_URL}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
  } catch (error) {
    // Silent fail - don't spam console
  }
}

export function startKeepAlive() {
  if (pingInterval) return;
  
  // Ping every 3 minutes
  pingInterval = setInterval(pingBackend, 3 * 60 * 1000);
  
  // Initial ping
  pingBackend();
}

export function stopKeepAlive() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}