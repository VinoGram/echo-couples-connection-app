// Debug: Check what API URL is being used
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('All env vars:', import.meta.env);

// Test API connection
fetch(`${import.meta.env.VITE_API_URL || 'https://echo-backend-pml9.onrender.com'}/api/health`)
  .then(res => res.json())
  .then(data => console.log('API Health:', data))
  .catch(err => console.error('API Error:', err));