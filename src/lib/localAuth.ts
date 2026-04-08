const authListeners: any[] = [];

export const auth = {
  currentUser: JSON.parse(localStorage.getItem('authUser') || 'null')
};

export const getAuth = (app?: any) => {
  if (app) return { isSecondary: true };
  return auth;
};

export const GoogleAuthProvider = class {};

export const signInWithPopup = async () => {
  throw new Error("Google Sign-In is disabled in local mode.");
};

export const signInWithEmailAndPassword = async (authObj: any, email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Server returned non-JSON response. Please ensure the backend server is running.");
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    const error: any = new Error(data.error || "Invalid credentials");
    error.code = 'auth/invalid-credential';
    throw error;
  }
  
  const user = data.user;
  
  if (authObj === auth) {
    localStorage.setItem('authUser', JSON.stringify(user));
    auth.currentUser = user;
    setTimeout(() => authListeners.forEach(l => l(user)), 0);
  }
  
  return { user };
};

export const createUserWithEmailAndPassword = async (authObj: any, email: string, password: string) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Server returned non-JSON response. Please ensure the backend server is running.");
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    const error: any = new Error(data.error || "Failed to register");
    if (data.error === 'Email already in use') {
      error.code = 'auth/email-already-in-use';
    }
    throw error;
  }
  
  const user = data.user;
  
  if (authObj === auth) {
    localStorage.setItem('authUser', JSON.stringify(user));
    auth.currentUser = user;
    setTimeout(() => authListeners.forEach(l => l(user)), 0);
  }
  
  return { user };
};

export const sendPasswordResetEmail = async () => {
  return true;
};

export const signOut = async (authObj: any) => {
  if (authObj === auth) {
    localStorage.removeItem('authUser');
    auth.currentUser = null;
    setTimeout(() => authListeners.forEach(l => l(null)), 0);
  }
};

export const onAuthStateChanged = (authObj: any, callback: any) => {
  authListeners.push(callback);
  callback(auth.currentUser);
  return () => {
    const index = authListeners.indexOf(callback);
    if (index > -1) authListeners.splice(index, 1);
  };
};

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}
