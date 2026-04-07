import React from 'react';
import { Settings, User } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export function SuperAdminSettings() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-slate-500" />
          Account Settings
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">Profile Information</h3>
              <p className="text-sm text-slate-500">Managed by Google Authentication</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-500">Full Name</label>
              <div className="mt-1 text-sm text-slate-900">{user?.fullName || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500">Email Address</label>
              <div className="mt-1 text-sm text-slate-900">{user?.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500">Role</label>
              <div className="mt-1 text-sm text-slate-900 capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          
          <div className="pt-4 mt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Authentication and password management are handled securely through your Google account. 
              To change your password or security settings, please visit your Google Account settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
