import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createAuthUser } from '../lib/secondaryAuth';

export function SuperAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({ username: '', fullName: '', email: '', role: 'super_admin' });
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'super_admin'));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingUser) {
        const userRef = doc(db, 'users', editingUser.id);
        await updateDoc(userRef, {
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email
        });
        setShowAddModal(false);
        setEditingUser(null);
        fetchUsers();
        setNewUser({ username: '', fullName: '', email: '', role: 'super_admin' });
      } else {
        // Create user in Auth
        const { uid, password } = await createAuthUser(newUser.email);

        // Save user to Firestore
        await setDoc(doc(db, 'users', uid), {
          uid: uid,
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
          role: 'super_admin',
          status: 'active',
          createdAt: new Date().toISOString()
        });
        
        setCreatedCredentials({ email: newUser.email, password });
        fetchUsers();
        setNewUser({ username: '', fullName: '', email: '', role: 'super_admin' });
      }
    } catch (error: any) {
      console.error("Error saving user:", error);
      alert(`Failed to save user: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const openEditUser = (user: any) => {
    setEditingUser(user);
    setNewUser({
      username: user.username || '',
      fullName: user.fullName || '',
      email: user.email || '',
      role: 'super_admin'
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg border border-slate-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-200">
          <h3 className="text-lg leading-6 font-medium text-slate-900">System Users (Super Admins)</h3>
          <button
            onClick={() => {
              setEditingUser(null);
              setNewUser({ username: '', fullName: '', email: '', role: 'super_admin' });
              setShowAddModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.username || user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditUser(user)} className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              {createdCredentials ? (
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">User Created Successfully</h3>
                    <div className="mt-4 bg-slate-50 p-4 rounded-md border border-slate-200 text-left">
                      <p className="text-sm text-slate-600 mb-2">The super admin account has been created. Please securely share these credentials with the user.</p>
                      <p className="text-sm font-medium text-slate-900 mt-2">Email: <span className="font-mono bg-white px-2 py-1 border rounded">{createdCredentials.email}</span></p>
                      <p className="text-sm font-medium text-slate-900 mt-2">Password: <span className="font-mono bg-white px-2 py-1 border rounded">{createdCredentials.password}</span></p>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      type="button"
                      className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:text-sm"
                      onClick={() => {
                        setCreatedCredentials(null);
                        setShowAddModal(false);
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveUser}>
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Username</label>
                        <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Full Name</label>
                        <input type="text" required value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" disabled={loading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                      {loading ? 'Processing...' : (editingUser ? 'Save Changes' : 'Create User')}
                    </button>
                    <button type="button" onClick={() => setShowAddModal(false)} disabled={loading} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
