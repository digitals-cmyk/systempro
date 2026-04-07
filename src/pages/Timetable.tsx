import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../lib/AuthContext';

export default function Timetable() {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ grade: '', subject: '', day: 'Monday', time: '' });

  const fetchTimetables = async () => {
    if (!user?.schoolId) return;
    try {
      const q = query(collection(db, 'timetable'), where('schoolId', '==', user.schoolId));
      const snapshot = await getDocs(q);
      setTimetables(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching timetables:", error);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, [user]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;

    try {
      await addDoc(collection(db, 'timetable'), {
        ...newEntry,
        schoolId: user.schoolId,
        createdAt: new Date().toISOString()
      });

      setShowAddModal(false);
      setNewEntry({ grade: '', subject: '', day: 'Monday', time: '' });
      fetchTimetables();
    } catch (error) {
      console.error("Error adding timetable entry:", error);
      alert("Failed to add timetable entry");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await deleteDoc(doc(db, 'timetable', id));
      fetchTimetables();
    } catch (error) {
      console.error("Error deleting timetable entry:", error);
      alert("Failed to delete timetable entry");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Timetable</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-slate-200">
          {timetables.map((entry) => (
            <li key={entry.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 text-slate-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{entry.subject} ({entry.grade})</p>
                  <p className="text-sm text-slate-500">{entry.day} at {entry.time}</p>
                </div>
              </div>
              <button onClick={() => handleDeleteEntry(entry.id)} className="text-red-600 hover:text-red-900">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {timetables.length === 0 && (
            <li className="px-6 py-4 text-center text-slate-500">No timetable entries found.</li>
          )}
        </ul>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">Add Timetable Entry</h2>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Grade/Class</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newEntry.grade}
                  onChange={e => setNewEntry({...newEntry, grade: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Subject</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newEntry.subject}
                  onChange={e => setNewEntry({...newEntry, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Day</label>
                <select
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newEntry.day}
                  onChange={e => setNewEntry({...newEntry, day: e.target.value})}
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Time</label>
                <input
                  type="time"
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newEntry.time}
                  onChange={e => setNewEntry({...newEntry, time: e.target.value})}
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
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
