import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const JoinInvite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const acceptInvite = async () => {
      if (!user) {
        navigate(`/login?redirect=/join/${token}`);
        return;
      }

      try {
        const response = await fetch(`/api/users/accept-invite/${token}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(`Successfully connected with ${data.partner.username}!`);
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to accept invitation');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error occurred');
      }
    };

    acceptInvite();
  }, [token, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p>Processing invitation...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Echo!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Invitation Error</h2>
            <p className="text-gray-600">{message}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinInvite;