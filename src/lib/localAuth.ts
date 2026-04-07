const authListeners: any[] = [];

export const auth = {
  currentUser: JSON.parse(localStorage.getItem('authUser') || 'null')
};

export const getAuth = () => auth;

export const GoogleAuthProvider = class {};

export const signInWithPopup = async () => {
  throw new Error("Google Sign-In is disabled in local mode.");
};

export const signInWithEmailAndPassword = async (authObj: any, email: string, password: string) => {
  if (email === 'admin@pro.com' && password === 'admin123') {
    const user = { uid: 'super-admin', email, role: 'super_admin' };
    
    // Ensure super admin exists in the users collection
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (!users.find((u: any) => u.uid === 'super-admin')) {
      users.push({
        id: 'super-admin',
        uid: 'super-admin',
        email: 'admin@pro.com',
        role: 'super_admin',
        schoolId: null,
        fullName: 'Super Admin',
        phone: '',
        status: 'active',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('users', JSON.stringify(users));
    }

    localStorage.setItem('authUser', JSON.stringify(user));
    auth.currentUser = user;
    setTimeout(() => authListeners.forEach(l => l(user)), 0);
    return { user };
  }
  
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find((u: any) => u.email === email && u.password === password);
  if (user) {
    localStorage.setItem('authUser', JSON.stringify(user));
    auth.currentUser = user;
    setTimeout(() => authListeners.forEach(l => l(user)), 0);
    return { user };
  }
  
  const error: any = new Error("Invalid credentials");
  error.code = 'auth/invalid-credential';
  throw error;
};

export const createUserWithEmailAndPassword = async (authObj: any, email: string, password: string) => {
  const uid = Math.random().toString(36).substring(2, 15);
  const user = { uid, email, password };
  
  // If it's the main auth instance (not secondary), log them in
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
  localStorage.removeItem('authUser');
  auth.currentUser = null;
  setTimeout(() => authListeners.forEach(l => l(null)), 0);
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
