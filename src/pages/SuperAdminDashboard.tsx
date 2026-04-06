import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, XCircle } from 'lucide-react';

export function SuperAdminDashboard() {
  const [stats, setStats] = useState({ totalSchools: 0, activeSchools: 0, inactiveSchools: 0 });

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    const statsRes = await fetch('/api/super/stats', { headers: { Authorization: `Bearer ${token}` } });
    if (statsRes.ok) setStats(await statsRes.json());
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building2 className="h-6 w-6 text-slate-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">Total Schools</dt>
                  <dd className="text-3xl font-semibold text-slate-900">{stats.totalSchools}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">Active Schools</dt>
                  <dd className="text-3xl font-semibold text-slate-900">{stats.activeSchools}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">Inactive Schools</dt>
                  <dd className="text-3xl font-semibold text-slate-900">{stats.inactiveSchools}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
