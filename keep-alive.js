// Keep backend alive by pinging it every 14 minutes
const BACKEND_URL = 'https://echo-backend-pml9.onrender.com';

async function pingBackend() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    console.log(`Backend ping: ${response.status} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Backend ping failed:', error);
  }
}

// Ping every 14 minutes (Render sleeps after 15 minutes of inactivity)
setInterval(pingBackend, 14 * 60 * 1000);

// Initial ping
pingBackend();