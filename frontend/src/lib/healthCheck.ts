const BACKEND_URL = 'https://echo-backend-pml9.onrender.com';

export async function wakeUpBackend(): Promise<boolean> {
  try {
    console.log('Waking up backend...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes
    
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Failed to wake up backend:', error);
    return false;
  }
}

export async function ensureBackendReady(): Promise<void> {
  const maxRetries = 2;
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
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
  }
  
  throw new Error('Server is taking longer than usual to start. Please try again in a moment.');
}