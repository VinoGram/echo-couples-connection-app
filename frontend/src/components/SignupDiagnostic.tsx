import { useState } from 'react';
import { api } from '../lib/api';

export function SignupDiagnostic() {
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const testSignup = async () => {
    setTesting(true);
    setTestResult('Testing signup functionality...');
    
    try {
      // Test 1: Check if backend is reachable
      setTestResult('1. Testing backend connection...');
      const healthResponse = await fetch('https://echo-backend-pml9.onrender.com/health');
      if (!healthResponse.ok) {
        throw new Error('Backend health check failed');
      }
      
      // Test 2: Try to register with a test user
      setTestResult('2. Testing user registration...');
      const testEmail = `test_${Date.now()}@example.com`;
      const testUsername = `test_${Date.now()}`;
      const testPassword = 'testpass123';
      
      try {
        const result = await api.register(testEmail, testPassword, testUsername);
        setTestResult(`✅ Signup working! Created user: ${result.user.email}`);
      } catch (error: any) {
        if (error.message.includes('User already exists')) {
          setTestResult('✅ Signup endpoint working (test user already exists)');
        } else {
          setTestResult(`❌ Signup failed: ${error.message}`);
        }
      }
    } catch (error: any) {
      setTestResult(`❌ Connection failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Signup Diagnostic Tool</h3>
      <button 
        onClick={testSignup}
        disabled={testing}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Test Signup'}
      </button>
      {testResult && (
        <div className="mt-4 p-3 bg-white rounded border">
          <pre className="text-sm">{testResult}</pre>
        </div>
      )}
    </div>
  );
}