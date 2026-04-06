import React, { useState, useEffect } from 'react';
import { Plus, DollarSign } from 'lucide-react';

export default function Fees() {
  const [fees, setFees] = useState<any[]>([]);
  const [learners, setLearners] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFee, setNewFee] = useState({ learnerId: '', totalAmount: '', paidAmount: '' });

  const fetchFees = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/school/fees', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setFees(await res.json());
  };

  const fetchLearners = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/school/learners', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setLearners(await res.json());
  };

  useEffect(() => {
    fetchFees();
    fetchLearners();
  }, []);

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/school/fees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newFee)
    });

    if (res.ok) {
      setShowAddModal(false);
      setNewFee({ learnerId: '', totalAmount: '', paidAmount: '' });
      fetchFees();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Fees Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-slate-200">
          {fees.map((fee) => (
            <li key={fee.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{fee.learner_name} ({fee.admission_number})</p>
                  <p className="text-sm text-slate-500">Total: ${fee.total_amount} | Paid: ${fee.paid_amount}</p>
                </div>
              </div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${fee.balance <= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                Balance: ${fee.balance}
              </span>
            </li>
          ))}
          {fees.length === 0 && (
            <li className="px-6 py-4 text-center text-slate-500">No fee records found.</li>
          )}
        </ul>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">Record Fee Payment</h2>
            <form onSubmit={handleAddFee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Learner</label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newFee.learnerId}
                  onChange={e => setNewFee({...newFee, learnerId: e.target.value})}
                >
                  <option value="">Select a learner...</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>{l.full_name} ({l.admission_number})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Total Amount</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newFee.totalAmount}
                  onChange={e => setNewFee({...newFee, totalAmount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Paid Amount</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newFee.paidAmount}
                  onChange={e => setNewFee({...newFee, paidAmount: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
