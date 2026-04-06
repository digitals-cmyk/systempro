import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Edit2, Trash2 } from 'lucide-react';

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [newExam, setNewExam] = useState({ name: '', term: '', year: new Date().getFullYear().toString(), status: 'published' });

  const fetchExams = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/school/exams', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setExams(await res.json());
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (editingExam) {
      const res = await fetch(`/api/school/exams/${editingExam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newExam)
      });
      if (res.ok) {
        setShowAddModal(false);
        setEditingExam(null);
        setNewExam({ name: '', term: '', year: new Date().getFullYear().toString(), status: 'published' });
        fetchExams();
      }
    } else {
      const res = await fetch('/api/school/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newExam)
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewExam({ name: '', term: '', year: new Date().getFullYear().toString(), status: 'published' });
        fetchExams();
      }
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/school/exams/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchExams();
  };

  const openEditExam = (exam: any) => {
    setEditingExam(exam);
    setNewExam({
      name: exam.name,
      term: exam.term,
      year: exam.year,
      status: exam.status
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Exams Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Exam
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-slate-200">
          {exams.map((exam) => (
            <li key={exam.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="h-6 w-6 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{exam.name}</p>
                  <p className="text-sm text-slate-500">Term {exam.term} - {exam.year}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${exam.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                  {exam.status}
                </span>
                <button onClick={() => openEditExam(exam)} className="text-blue-600 hover:text-blue-900">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDeleteExam(exam.id)} className="text-red-600 hover:text-red-900">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          {exams.length === 0 && (
            <li className="px-6 py-4 text-center text-slate-500">No exams found.</li>
          )}
        </ul>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">{editingExam ? 'Edit Exam' : 'Add New Exam'}</h2>
            <form onSubmit={handleAddExam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Exam Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newExam.name}
                  onChange={e => setNewExam({...newExam, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Term</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newExam.term}
                  onChange={e => setNewExam({...newExam, term: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Year</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newExam.year}
                  onChange={e => setNewExam({...newExam, year: e.target.value})}
                />
              </div>
              {editingExam && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Status</label>
                  <select
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    value={newExam.status}
                    onChange={e => setNewExam({...newExam, status: e.target.value})}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingExam(null); setNewExam({ name: '', term: '', year: new Date().getFullYear().toString(), status: 'published' }); }}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingExam ? 'Save Changes' : 'Save Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
