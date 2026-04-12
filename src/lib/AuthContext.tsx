import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

interface UserData {
  uid: string;
  email: string;
  role: string;
  schoolId: string | null;
  fullName: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        let hasUpdatedLogin = false;

        unsubscribeSnapshot = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            if (!hasUpdatedLogin) {
              hasUpdatedLogin = true;
              updateDoc(doc(db, 'users', firebaseUser.uid), {
                lastLogin: new Date().toISOString()
              }).catch(e => {
                // Ignore permission errors or not-found errors during initial bootstrap
                if (e.code !== 'permission-denied' && e.code !== 'not-found') {
                  console.error("Failed to update last login", e);
                }
              });
            }
            setUser({ uid: firebaseUser.uid, ...docSnap.data() } as UserData);
          } else {
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user data:", error);
          setUser(null);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
