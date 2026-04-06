import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';

export function SuperAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({ username: '', fullName: '', email: '', password: '' });

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/super/users', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (editingUser) {
      const res = await fetch(`/api/super/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setShowAddModal(false);
        setEditingUser(null);
        fetchUsers();
        setNewUser({ username: '', fullName: '', email: '', password: '' });
      }
    } else {
      const res = await fetch('/api/super/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newUser)
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchUsers();
        setNewUser({ username: '', fullName: '', email: '', password: '' });
      }
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/super/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to delete user');
    }
  };

  const openEditUser = (user: any) => {
    setEditingUser(user);
    setNewUser({
      username: user.username,
      fullName: user.full_name || '',
      email: user.email || '',
      password: '' // Don't populate password
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
              setNewUser({ username: '', fullName: '', email: '', password: '' });
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.full_name}</td>
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
              <form onSubmit={handleSaveUser}>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Username</label>
                      <input type="text" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Full Name</label>
                      <input type="text" required value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Email</label>
                      <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Password {editingUser && '(Leave blank to keep current)'}</label>
                      <input type={editingUser ? "password" : "text"} required={!editingUser} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                    {editingUser ? 'Save Changes' : 'Create User'}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
