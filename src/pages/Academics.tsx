import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Book, Users, GraduationCap, Award, Map } from 'lucide-react';

export default function Academics() {
  const [activeTab, setActiveTab] = useState('grades');
  
  // Data states
  const [grades, setGrades] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [gradeSystems, setGradeSystems] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form states
  const [gradeForm, setGradeForm] = useState({ name: '' });
  const [streamForm, setStreamForm] = useState({ name: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '' });
  const [allocationForm, setAllocationForm] = useState({ subjectId: '', gradeId: '', teacherId: '' });
  const [gradeSystemForm, setGradeSystemForm] = useState({ name: '', minMark: '', maxMark: '', gradeLetter: '', remarks: '' });

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    const [gradesRes, streamsRes, subjectsRes, allocRes, sysRes, usersRes] = await Promise.all([
      fetch('/api/school/grades', { headers }),
      fetch('/api/school/streams', { headers }),
      fetch('/api/school/subjects', { headers }),
      fetch('/api/school/subject-allocations', { headers }),
      fetch('/api/school/grade-systems', { headers }),
      fetch('/api/school/users', { headers })
    ]);

    if (gradesRes.ok) setGrades(await gradesRes.json());
    if (streamsRes.ok) setStreams(await streamsRes.json());
    if (subjectsRes.ok) setSubjects(await subjectsRes.json());
    if (allocRes.ok) setAllocations(await allocRes.json());
    if (sysRes.ok) setGradeSystems(await sysRes.json());
    if (usersRes.ok) {
      const allUsers = await usersRes.json();
      setTeachers(allUsers.filter((u: any) => u.role === 'teacher'));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent, endpoint: string, payload: any) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/school/${endpoint}/${editingItem.id}` : `/api/school/${endpoint}`;
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setShowModal(false);
      setEditingItem(null);
      resetForms();
      fetchData();
    }
  };

  const handleDelete = async (id: number, endpoint: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/school/${endpoint}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchData();
  };

  const resetForms = () => {
    setGradeForm({ name: '' });
    setStreamForm({ name: '' });
    setSubjectForm({ name: '', code: '' });
    setAllocationForm({ subjectId: '', gradeId: '', teacherId: '' });
    setGradeSystemForm({ name: '', minMark: '', maxMark: '', gradeLetter: '', remarks: '' });
  };

  const openEdit = (item: any, type: string) => {
    setEditingItem(item);
    if (type === 'grades') setGradeForm({ name: item.name });
    if (type === 'streams') setStreamForm({ name: item.name });
    if (type === 'subjects') setSubjectForm({ name: item.name, code: item.code || '' });
    if (type === 'allocations') setAllocationForm({ subjectId: item.subject_id, gradeId: item.grade_id, teacherId: item.teacher_id });
    if (type === 'grade-systems') setGradeSystemForm({ name: item.name, minMark: item.min_mark, maxMark: item.max_mark, gradeLetter: item.grade_letter, remarks: item.remarks || '' });
    setShowModal(true);
  };

  const renderTabs = () => (
    <div className="border-b border-slate-200 mb-6">
      <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
        {[
          { id: 'grades', name: 'Grades', icon: GraduationCap },
          { id: 'streams', name: 'Streams', icon: Users },
          { id: 'subjects', name: 'Subjects', icon: Book },
          { id: 'allocations', name: 'Subject Allocations', icon: Map },
          { id: 'grade-systems', name: 'Grade System', icon: Award },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); resetForms(); setEditingItem(null); }}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }
            `}
          >
            <tab.icon className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-blue-500' : 'text-slate-400'}`} />
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Academic Setup</h1>
        <button
          onClick={() => { resetForms(); setEditingItem(null); setShowModal(true); }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {renderTabs()}

        {/* GRADES TAB */}
        {activeTab === 'grades' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Grade Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {grades.map(g => (
                  <tr key={g.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{g.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEdit(g, 'grades')} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(g.id, 'grades')} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* STREAMS TAB */}
        {activeTab === 'streams' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stream Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {streams.map(s => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{s.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEdit(s, 'streams')} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(s.id, 'streams')} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBJECTS TAB */}
        {activeTab === 'subjects' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subject Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{s.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{s.code || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEdit(s, 'subjects')} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(s.id, 'subjects')} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ALLOCATIONS TAB */}
        {activeTab === 'allocations' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Teacher</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {allocations.map(a => (
                  <tr key={a.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{a.subject_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{a.grade_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{a.teacher_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEdit(a, 'allocations')} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(a.id, 'subject-allocations')} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* GRADE SYSTEMS TAB */}
        {activeTab === 'grade-systems' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">System Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Range</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Remarks</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {gradeSystems.map(g => (
                  <tr key={g.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{g.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{g.min_mark} - {g.max_mark}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{g.grade_letter}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{g.remarks}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEdit(g, 'grade-systems')} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(g.id, 'grade-systems')} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">{editingItem ? 'Edit' : 'Add'} {activeTab.replace('-', ' ')}</h2>
            
            {activeTab === 'grades' && (
              <form onSubmit={e => handleSave(e, 'grades', gradeForm)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Grade Name</label>
                  <input type="text" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" value={gradeForm.name} onChange={e => setGradeForm({...gradeForm, name: e.target.value})} />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save</button>
                </div>
              </form>
            )}

            {activeTab === 'streams' && (
              <form onSubmit={e => handleSave(e, 'streams', streamForm)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Stream Name</label>
                  <input type="text" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" value={streamForm.name} onChange={e => setStreamForm({...streamForm, name: e.target.value})} />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save</button>
                </div>
              </form>
            )}

            {activeTab === 'subjects' && (
              <form onSubmit={e => handleSave(e, 'subjects', subjectForm)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Subject Name</label>
                  <input type="text" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Subject Code</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})} />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save</button>
                </div>
              </form>
            )}

            {activeTab === 'allocations' && (
              <form onSubmit={e => handleSave(e, 'subject-allocations', allocationForm)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Subject</label>
                  <select required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" value={allocationForm.subjectId} onChange={e => setAllocationForm({...allocationForm, subjectId: e.target.value})}>
                    <option value="">Select Subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Grade</label>
                  <select required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" value={allocationForm.gradeId} onChange={e => setAllocationForm({...allocationForm, gradeId: e.target.value})}>
                    <option value="">Select Grade...</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Teacher</label>
                  <select required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" value={allocationForm.teacherId} onChange={e => setAllocationForm({...allocationForm, teacherId: e.target.value})}>
                    <option value="">Select Teacher...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save</button>
                </div>
              </form>
            )}

            {activeTab === 'grade-systems' && (
              <form onSubmit={e => handleSave(e, 'grade-systems', gradeSystemForm)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">System Name</label>
                  <input type="text" required placeholder="e.g. Standard Grading" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" value={gradeSystemForm.name} onChange={e => setGradeSystemForm({...gradeSystemForm, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Min Mark</label>
                    <input type="number" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" value={gradeSystemForm.minMark} onChange={e => setGradeSystemForm({...gradeSystemForm, minMark: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Max Mark</label>
                    <input type="number" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" value={gradeSystemForm.maxMark} onChange={e => setGradeSystemForm({...gradeSystemForm, maxMark: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Grade Letter</label>
                  <input type="text" required placeholder="e.g. A, B+, etc." className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" value={gradeSystemForm.gradeLetter} onChange={e => setGradeSystemForm({...gradeSystemForm, gradeLetter: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Remarks</label>
                  <input type="text" placeholder="e.g. Excellent, Good" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" value={gradeSystemForm.remarks} onChange={e => setGradeSystemForm({...gradeSystemForm, remarks: e.target.value})} />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
