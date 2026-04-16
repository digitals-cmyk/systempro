import React, { useState } from 'react';
import { Settings, User, Save } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export function SuperAdminSettings() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${user.uid}`, { // Using super admin user endpoint
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, email })
      });

      if (!res.ok) {
         throw new Error("Failed");
      }
      
      const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      authUser.fullName = fullName;
      authUser.email = email;
      localStorage.setItem('authUser', JSON.stringify(authUser));
      
      setMessage('Profile updated successfully.');
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-slate-500" />
          Account Settings
        </h2>
        
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-md text-sm ${message.includes('success') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {message}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">Profile Information</h3>
              <p className="text-sm text-slate-500">Manage your account details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-500">Full Name</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              ) : (
                <div className="mt-1 text-sm text-slate-900">{user?.fullName || 'N/A'}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500">Email Address</label>
              {isEditing ? (
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              ) : (
                <div className="mt-1 text-sm text-slate-900">{user?.email}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500">Role</label>
              <div className="mt-1 text-sm text-slate-900 capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          
          <div className="pt-4 mt-6 border-t border-slate-200 flex justify-end">
            {isEditing ? (
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
