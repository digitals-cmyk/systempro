import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { School } from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';

export function Login() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('school_admin');
  
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
      } else if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = result.user;
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: role,
          schoolId: null, // They will need to create/join a school later or in the dashboard
          fullName: fullName,
          phone: '',
          status: 'active',
          createdAt: new Date().toISOString()
        });
        
        // The onAuthStateChanged listener in AuthContext will handle the redirect
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

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Bootstrap super admin if email matches
        if (firebaseUser.email === 'johnkimeujk6@gmail.com' && firebaseUser.emailVerified) {
          await setDoc(userDocRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'super_admin',
            schoolId: null,
            fullName: firebaseUser.displayName || 'Super Admin',
            phone: firebaseUser.phoneNumber || '',
            status: 'active',
            createdAt: new Date().toISOString()
          });
          navigate('/super');
        } else {
          // New user signing in with Google, create a default school_admin profile
          await setDoc(userDocRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'school_admin',
            schoolId: null,
            fullName: firebaseUser.displayName || 'New User',
            phone: firebaseUser.phoneNumber || '',
            status: 'active',
            createdAt: new Date().toISOString()
          });
          navigate('/school');
        }
      } else {
        const userData = userDoc.data();
        if (userData.status !== 'active') {
          await auth.signOut();
          setError('Your account is inactive. Please contact an administrator.');
          return;
        }
        
        if (userData.role === 'super_admin') {
          navigate('/super');
        } else {
          navigate('/school');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google');
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
          {mode === 'signup' && 'Create a new account'}
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
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="school_admin">School Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

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

              {mode !== 'forgot_password' && (
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
                  {loading ? 'Processing...' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Sign up' : 'Reset Password'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              {mode === 'login' ? (
                <p className="text-gray-600">
                  New user?{' '}
                  <button onClick={() => setMode('signup')} className="font-medium text-blue-600 hover:text-blue-500">
                    Sign up here
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

