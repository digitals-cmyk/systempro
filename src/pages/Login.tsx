import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { School } from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';

export function Login() {
  const [mode, setMode] = useState<'login' | 'activate' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'super_admin') {
        navigate('/super');
      } else {
        navigate('/school');
      }
    }
  }, [user, authLoading, navigate]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Handle special super admin login
      let loginEmail = email;
      if (email === 'admin@pro') {
        loginEmail = 'admin@pro.com'; // Firebase requires a valid email format
      }

      if (mode === 'login') {
        try {
          await signInWithEmailAndPassword(auth, loginEmail, password);
        } catch (loginError: any) {
          // If the special super admin doesn't exist yet, bootstrap it
          if (email === 'admin@pro' && password === 'admin123' && (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential' || loginError.code === 'auth/invalid-login-credentials')) {
            try {
              const result = await createUserWithEmailAndPassword(auth, loginEmail, password);
              await setDoc(doc(db, 'users', result.user.uid), {
                uid: result.user.uid,
                email: loginEmail,
                role: 'super_admin',
                schoolId: null,
                fullName: 'Super Admin',
                phone: '',
                status: 'active',
                createdAt: new Date().toISOString()
              });
            } catch (createError: any) {
              if (createError.code === 'auth/email-already-in-use') {
                throw new Error('Invalid credentials'); // It exists but wrong password
              }
              throw createError;
            }
          } else {
            throw loginError;
          }
        }
        // The onAuthStateChanged listener in AuthContext will handle the redirect
      } else if (mode === 'activate') {
        // To activate, they must first sign in with the temporary credentials (activation code)
        try {
          const result = await signInWithEmailAndPassword(auth, email, activationCode);
          
          const response = await fetch('/api/auth/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, oldPassword: activationCode, newPassword })
          });
          
          if (!response.ok) {
            throw new Error('Failed to update password');
          }
          
          // Also update the current authUser in localStorage for the frontend session
          const currentAuthUser = JSON.parse(localStorage.getItem('authUser') || '{}');
          currentAuthUser.password = newPassword;
          localStorage.setItem('authUser', JSON.stringify(currentAuthUser));
          
          setMessage('Account activated successfully!');
        } catch (err: any) {
          throw new Error('Invalid activation code or email.');
        }
      } else if (mode === 'forgot_password') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Check your inbox.');
        setMode('login');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <School className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Pro School Management System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {mode === 'login' && 'Sign in to your account'}
          {mode === 'activate' && 'Activate your new account'}
          {mode === 'forgot_password' && 'Reset your password'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleAuthAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address (Username)</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {mode === 'activate' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Activation Code (Provided Password)</label>
                    <div className="mt-1">
                      <input
                        type="password"
                        required
                        value={activationCode}
                        onChange={(e) => setActivationCode(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <div className="mt-1">
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === 'login' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : mode === 'login' ? 'Sign in' : mode === 'activate' ? 'Activate Account' : 'Reset Password'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
              {mode === 'login' ? (
                <p className="text-gray-600">
                  New user?{' '}
                  <button onClick={() => setMode('activate')} className="font-medium text-blue-600 hover:text-blue-500">
                    Activate your account
                  </button>
                </p>
              ) : (
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
      
      <div className="mt-auto py-8 text-center text-sm text-gray-500">
        <p>Software License Expiry: Dec 31, 2026</p>
        <p className="mt-1">© 2026 Pro School Management System. All rights reserved.</p>
      </div>
    </div>
  );
}

