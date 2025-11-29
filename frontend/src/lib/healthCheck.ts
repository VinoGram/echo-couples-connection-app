const BACKEND_URL = 'https://echo-backend-pml9.onrender.com';

export async function wakeUpBackend(): Promise<boolean> {
  try {
    console.log('Waking up backend...');
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(60000)
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to wake up backend:', error);
    return false;
  }
}

export async function ensureBackendReady(): Promise<void> {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    const isReady = await wakeUpBackend();
    if (isReady) {
      console.log('Backend is ready');
      return;
    }
    
    retries++;
    console.log(`Backend not ready, retry ${retries}/${maxRetries}`);
    
    if (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
  }
  
  throw new Error('Backend failed to wake up after multiple attempts');
}