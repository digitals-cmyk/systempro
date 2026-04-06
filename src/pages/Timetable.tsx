import React, { useState, useEffect } from 'react';
import { Plus, Calendar } from 'lucide-react';

export default function Timetable() {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ grade: '', subject: '', day: 'Monday', time: '' });

  const fetchTimetables = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/school/timetable', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setTimetables(await res.json());
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/school/timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newEntry)
    });

    if (res.ok) {
      setShowAddModal(false);
      setNewEntry({ grade: '', subject: '', day: 'Monday', time: '' });
      fetchTimetables();
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
