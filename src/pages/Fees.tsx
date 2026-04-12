import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../lib/AuthContext';

interface FeeRecord {
  id: string;
  learnerId: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function Fees() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [learners, setLearners] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [newFee, setNewFee] = useState({ learnerId: '', totalAmount: '', paidAmount: '' });

  const fetchFees = async () => {
    if (!user?.schoolId) return;
    try {
      const q = query(collection(db, 'fees'), where('schoolId', '==', user.schoolId));
      const snapshot = await getDocs(q);
      setFees(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeeRecord)));
    } catch (error) {
      console.error("Error fetching fees:", error);
    }
  };

  const fetchLearners = async () => {
    if (!user?.schoolId) return;
    try {
      const q = query(collection(db, 'users'), where('schoolId', '==', user.schoolId), where('role', '==', 'learner'));
      const snapshot = await getDocs(q);
      setLearners(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching learners:", error);
    }
  };

  useEffect(() => {
    fetchFees();
    fetchLearners();
  }, [user]);

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;

    try {
      const feeData: any = {
        ...newFee,
        schoolId: user.schoolId,
        totalAmount: parseFloat(newFee.totalAmount),
        paidAmount: parseFloat(newFee.paidAmount),
        balance: parseFloat(newFee.totalAmount) - parseFloat(newFee.paidAmount),
        updatedAt: new Date().toISOString()
      };

      if (editingFee) {
        await updateDoc(doc(db, 'fees', editingFee.id), feeData);
      } else {
        feeData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'fees'), feeData);
      }

      setShowAddModal(false);
      setEditingFee(null);
      setNewFee({ learnerId: '', totalAmount: '', paidAmount: '' });
      fetchFees();
    } catch (error) {
      console.error("Error saving fee:", error);
      alert("Failed to save fee record");
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee record?')) return;
    try {
      await deleteDoc(doc(db, 'fees', id));
      fetchFees();
    } catch (error) {
      console.error("Error deleting fee:", error);
      alert("Failed to delete fee record");
    }
  };

  const openEditFee = (fee: any) => {
    setEditingFee(fee);
    setNewFee({
      learnerId: fee.learnerId || '',
      totalAmount: fee.totalAmount?.toString() || '',
      paidAmount: fee.paidAmount?.toString() || ''
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Fees Management</h1>
        <button
          onClick={() => {
            setEditingFee(null);
            setNewFee({ learnerId: '', totalAmount: '', paidAmount: '' });
            setShowAddModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-slate-200">
          {fees.map((fee) => {
            const learner = learners.find(l => l.id === fee.learnerId);
            const learnerName = learner ? `${learner.fullName} (${learner.admissionNumber})` : 'Unknown Learner';
            const totalAmount = fee.totalAmount || 0;
            const paidAmount = fee.paidAmount || 0;
            const balance = totalAmount - paidAmount;

            return (
              <li key={fee.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-6 w-6 text-slate-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{learnerName}</p>
                    <p className="text-sm text-slate-500">Total: ${totalAmount.toFixed(2)} | Paid: ${paidAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${balance <= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    Balance: ${balance.toFixed(2)}
                  </span>
                  <button onClick={() => openEditFee(fee)} className="text-blue-600 hover:text-blue-900">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteFee(fee.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
          {fees.length === 0 && (
            <li className="px-6 py-4 text-center text-slate-500">No fee records found.</li>
          )}
        </ul>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">{editingFee ? 'Edit Fee Record' : 'Record Fee Payment'}</h2>
            <form onSubmit={handleSaveFee} className="space-y-4">
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
                    <option key={l.id} value={l.id}>{l.fullName} ({l.admissionNumber})</option>
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
                  onClick={() => { setShowAddModal(false); setEditingFee(null); setNewFee({ learnerId: '', totalAmount: '', paidAmount: '' }); }}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingFee ? 'Save Changes' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
