import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';

export function SuperAdminSettings() {
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const token = localStorage.getItem('token');
    const res = await fetch('/api/super/settings/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
    });

    if (res.ok) {
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error || 'Failed to update password.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-slate-500" />
          Security Settings
        </h2>
        
        {message.text && (
          <div className={`p-4 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Current Password</label>
            <input type="password" required value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">New Password</label>
            <input type="password" required value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
            <input type="password" required value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div className="pt-4">
            <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
