import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

export function SuperAdminSchools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [newSchool, setNewSchool] = useState({ name: '', code: '', address: '', email: '', principalName: '', status: 'active' });
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);

  const fetchSchools = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/super/schools', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setSchools(await res.json());
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (editingSchool) {
      const res = await fetch(`/api/super/schools/${editingSchool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newSchool)
      });
      if (res.ok) {
        setShowAddModal(false);
        setEditingSchool(null);
        fetchSchools();
        setNewSchool({ name: '', code: '', address: '', email: '', principalName: '', status: 'active' });
      }
    } else {
      const res = await fetch('/api/super/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newSchool)
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedCredentials(data);
        fetchSchools();
        setNewSchool({ name: '', code: '', address: '', email: '', principalName: '', status: 'active' });
      }
    }
  };

  const handleDeleteSchool = async (id: number) => {
    if (!confirm('Are you sure you want to delete this school? All associated data will be lost.')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/super/schools/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchSchools();
  };

  const openEditSchool = (school: any) => {
    setEditingSchool(school);
    setNewSchool({
      name: school.name,
      code: school.code,
      address: school.address || '',
      email: school.email || '',
      principalName: school.principal_name || '',
      status: school.status
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg border border-slate-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-200">
          <h3 className="text-lg leading-6 font-medium text-slate-900">Registered Schools</h3>
          <button
            onClick={() => {
              setEditingSchool(null);
              setNewSchool({ name: '', code: '', address: '', email: '', principalName: '', status: 'active' });
              setShowAddModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add School
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">School Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Principal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {schools.map((school) => (
                <tr key={school.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{school.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{school.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{school.principal_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${school.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {school.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditSchool(school)} className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteSchool(school.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {schools.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">No schools registered yet.</td>
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
                    <h3 className="text-lg leading-6 font-medium text-slate-900">School Created Successfully</h3>
                    <div className="mt-4 bg-slate-50 p-4 rounded-md border border-slate-200 text-left">
                      <p className="text-sm text-slate-600 mb-2">Please save these credentials. They will not be shown again.</p>
                      <p className="text-sm font-medium text-slate-900">Admin Username: <span className="font-mono bg-white px-2 py-1 border rounded">{createdCredentials.adminUsername}</span></p>
                      <p className="text-sm font-medium text-slate-900 mt-2">Admin Password: <span className="font-mono bg-white px-2 py-1 border rounded">{createdCredentials.adminPassword}</span></p>
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
                <form onSubmit={handleSaveSchool}>
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">{editingSchool ? 'Edit School' : 'Add New School'}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">School Name</label>
                        <input type="text" required value={newSchool.name} onChange={e => setNewSchool({...newSchool, name: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">School Code</label>
                        <input type="text" required value={newSchool.code} onChange={e => setNewSchool({...newSchool, code: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" required value={newSchool.email} onChange={e => setNewSchool({...newSchool, email: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Principal Name</label>
                        <input type="text" required value={newSchool.principalName} onChange={e => setNewSchool({...newSchool, principalName: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Address</label>
                        <textarea required value={newSchool.address} onChange={e => setNewSchool({...newSchool, address: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" rows={3}></textarea>
                      </div>
                      {editingSchool && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Status</label>
                          <select value={newSchool.status} onChange={e => setNewSchool({...newSchool, status: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                      {editingSchool ? 'Save Changes' : 'Create School'}
                    </button>
                    <button type="button" onClick={() => setShowAddModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
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
