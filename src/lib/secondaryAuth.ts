import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const apps = getApps();
const secondaryApp = apps.find(app => app.name === 'SecondaryApp') || initializeApp(firebaseConfig, 'SecondaryApp');
const secondaryAuth = getAuth(secondaryApp);

export async function createAuthUser(email: string, password?: string) {
  const pwd = password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "!";
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pwd);
  await signOut(secondaryAuth);
  return { uid: userCredential.user.uid, password: pwd };
}
