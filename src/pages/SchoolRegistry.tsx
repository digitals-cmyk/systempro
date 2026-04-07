import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, CheckCircle2, Edit2, Trash2, Upload } from 'lucide-react';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../lib/AuthContext';
import { createAuthUser } from '../lib/secondaryAuth';
import Papa from 'papaparse';

export function SchoolRegistry() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('staff');
  const [users, setUsers] = useState<any[]>([]);
  const [learners, setLearners] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ role: 'teacher', fullName: '', email: '', phone: '' });
  const [createdUserCredentials, setCreatedUserCredentials] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [showAddLearner, setShowAddLearner] = useState(false);
  const [editingLearner, setEditingLearner] = useState<any>(null);
  const [newLearner, setNewLearner] = useState({ admissionNumber: '', fullName: '', dob: '', dateOfAdmission: '', assessmentNumber: '', grade: '', stream: '' });

  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [uploadingCsv, setUploadingCsv] = useState(false);

  const fetchData = async () => {
    if (!user?.schoolId) return;

    try {
      // Fetch users (staff)
      const usersQuery = query(collection(db, 'users'), where('schoolId', '==', user.schoolId), where('role', 'in', ['teacher', 'parent', 'staff']));
      const usersSnapshot = await getDocs(usersQuery);
      setUsers(usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch learners
      const learnersQuery = query(collection(db, 'users'), where('schoolId', '==', user.schoolId), where('role', '==', 'learner'));
      const learnersSnapshot = await getDocs(learnersQuery);
      setLearners(learnersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch grades
      const gradesQuery = query(collection(db, 'grades'), where('schoolId', '==', user.schoolId));
      const gradesSnapshot = await getDocs(gradesQuery);
      setGrades(gradesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch streams
      const streamsQuery = query(collection(db, 'streams'), where('schoolId', '==', user.schoolId));
      const streamsSnapshot = await getDocs(streamsQuery);
      setStreams(streamsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching registry data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    setLoading(true);

    try {
      if (!newUser.email) {
        throw new Error("Email is required to create a user account.");
      }

      // Create user in Firebase Auth using secondary app
      const { uid, password } = await createAuthUser(newUser.email);

      // Save user to Firestore
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        ...newUser,
        schoolId: user.schoolId,
        status: 'active',
        createdAt: new Date().toISOString()
      });

      // Show credentials info
      setCreatedUserCredentials({ username: newUser.email, password });
      fetchData();
      setNewUser({ role: 'teacher', fullName: '', email: '', phone: '' });
    } catch (error: any) {
      console.error("Error adding user:", error);
      alert(`Failed to add user: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    try {
      if (editingLearner) {
        const learnerRef = doc(db, 'users', editingLearner.id);
        await updateDoc(learnerRef, {
          ...newLearner
        });
        setShowAddLearner(false);
        setEditingLearner(null);
        fetchData();
        setNewLearner({ admissionNumber: '', fullName: '', dob: '', dateOfAdmission: '', assessmentNumber: '', grade: '', stream: '' });
      } else {
        await addDoc(collection(db, 'users'), {
          ...newLearner,
          role: 'learner',
          schoolId: user.schoolId,
          status: 'active',
          createdAt: new Date().toISOString()
        });
        setShowAddLearner(false);
        fetchData();
        setNewLearner({ admissionNumber: '', fullName: '', dob: '', dateOfAdmission: '', assessmentNumber: '', grade: '', stream: '' });
      }
    } catch (error) {
      console.error("Error saving learner:", error);
      alert("Failed to save learner");
    }
  };

  const handleDeleteLearner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this learner?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      fetchData();
    } catch (error) {
      console.error("Error deleting learner:", error);
      alert("Failed to delete learner");
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !user?.schoolId) return;

    setUploadingCsv(true);
    setCsvErrors([]);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const errors: string[] = [];
        const validRows: any[] = [];

        results.data.forEach((row: any, index: number) => {
          const rowNum = index + 2; // +2 because index is 0-based and row 1 is header
          
          // Validation
          if (!row.admissionNumber) errors.push(`Row ${rowNum}: Missing admissionNumber`);
          if (!row.fullName) errors.push(`Row ${rowNum}: Missing fullName`);
          if (!row.grade) errors.push(`Row ${rowNum}: Missing grade`);

          if (row.admissionNumber && row.fullName && row.grade) {
            validRows.push({
              admissionNumber: row.admissionNumber,
              fullName: row.fullName,
              dob: row.dob || '',
              dateOfAdmission: row.dateOfAdmission || '',
              assessmentNumber: row.assessmentNumber || '',
              grade: row.grade,
              stream: row.stream || '',
              role: 'learner',
              schoolId: user.schoolId,
              status: 'active',
              createdAt: new Date().toISOString()
            });
          }
        });

        if (errors.length > 0) {
          setCsvErrors(errors);
          setUploadingCsv(false);
          return;
        }

        try {
          // Process in batches of 500 (Firestore limit)
          const batchSize = 500;
          for (let i = 0; i < validRows.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = validRows.slice(i, i + batchSize);
            
            chunk.forEach(learner => {
              const newDocRef = doc(collection(db, 'users'));
              batch.set(newDocRef, learner);
            });
            
            await batch.commit();
          }

          setShowCsvModal(false);
          setCsvFile(null);
          fetchData();
          alert(`Successfully uploaded ${validRows.length} learners.`);
        } catch (error: any) {
          console.error("Error uploading CSV:", error);
          setCsvErrors([`Upload failed: ${error.message}`]);
        } finally {
          setUploadingCsv(false);
        }
      },
      error: (error) => {
        setCsvErrors([`CSV Parse Error: ${error.message}`]);
        setUploadingCsv(false);
      }
    });
  };

  const openEditLearner = (learner: any) => {
    setEditingLearner(learner);
    setNewLearner({
      admissionNumber: learner.admissionNumber || '',
      fullName: learner.fullName || '',
      dob: learner.dob || '',
      dateOfAdmission: learner.dateOfAdmission || '',
      assessmentNumber: learner.assessmentNumber || '',
      grade: learner.grade || '',
      stream: learner.stream || ''
    });
    setShowAddLearner(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('staff')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'staff' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              Staff & Users
            </button>
            <button
              onClick={() => setActiveTab('learners')}
              className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'learners' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              Learners
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'staff' && (
            <div>
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900">School Staff & Users</h3>
                <button onClick={() => setShowAddUser(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4 mr-2" /> Add User
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{u.role.replace('_', ' ')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.email || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'learners' && (
            <div>
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900">Enrolled Learners</h3>
                <div className="flex space-x-2">
                  <button onClick={() => setShowCsvModal(true)} className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50">
                    <Upload className="h-4 w-4 mr-2" /> Upload CSV
                  </button>
                  <button onClick={() => setShowAddLearner(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Add Learner
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Adm No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Grade/Stream</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Admission Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {learners.map((l) => (
                      <tr key={l.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{l.admissionNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{l.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{l.grade} - {l.stream}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{l.dateOfAdmission ? new Date(l.dateOfAdmission).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => openEditLearner(l)} className="text-blue-600 hover:text-blue-900 mr-3">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteLearner(l.id)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {learners.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">No learners enrolled yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddUser(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              
              {createdUserCredentials ? (
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">User Created Successfully</h3>
                    <div className="mt-4 bg-slate-50 p-4 rounded-md border border-slate-200 text-left">
                      <p className="text-sm text-slate-600 mb-2">Please share these credentials securely.</p>
                      <p className="text-sm font-medium text-slate-900">Email: <span className="font-mono bg-white px-2 py-1 border rounded">{createdUserCredentials.username}</span></p>
                      <p className="text-sm font-medium text-slate-900 mt-2">Password: <span className="font-mono bg-white px-2 py-1 border rounded">{createdUserCredentials.password}</span></p>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button type="button" className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:text-sm" onClick={() => { setCreatedUserCredentials(null); setShowAddUser(false); }}>
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddUser}>
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">Add New User</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Role</label>
                        <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                          <option value="teacher">Teacher</option>
                          <option value="parent">Parent</option>
                          <option value="staff">Staff (BOM/Bursar/Clerk)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Full Name</label>
                        <input type="text" required value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Phone</label>
                        <input type="text" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" disabled={loading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                      {loading ? 'Processing...' : 'Create User'}
                    </button>
                    <button type="button" onClick={() => setShowAddUser(false)} disabled={loading} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Learner Modal */}
      {showAddLearner && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddLearner(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <form onSubmit={handleAddLearner}>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">{editingLearner ? 'Edit Learner' : 'Add New Learner'}</h3>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Admission Number</label>
                      <input type="text" required value={newLearner.admissionNumber} onChange={e => setNewLearner({...newLearner, admissionNumber: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Full Name</label>
                      <input type="text" required value={newLearner.fullName} onChange={e => setNewLearner({...newLearner, fullName: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
                      <input type="date" required value={newLearner.dob} onChange={e => setNewLearner({...newLearner, dob: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Date of Admission</label>
                      <input type="date" required value={newLearner.dateOfAdmission} onChange={e => setNewLearner({...newLearner, dateOfAdmission: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Assessment Number</label>
                      <input type="text" value={newLearner.assessmentNumber} onChange={e => setNewLearner({...newLearner, assessmentNumber: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Grade</label>
                      <select required value={newLearner.grade} onChange={e => setNewLearner({...newLearner, grade: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        <option value="">Select Grade</option>
                        {grades.map(g => (
                          <option key={g.id} value={g.name}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Stream</label>
                      <select required value={newLearner.stream} onChange={e => setNewLearner({...newLearner, stream: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        <option value="">Select Stream</option>
                        {streams.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                    {editingLearner ? 'Save Changes' : 'Enroll Learner'}
                  </button>
                  <button type="button" onClick={() => { setShowAddLearner(false); setEditingLearner(null); setNewLearner({ admissionNumber: '', fullName: '', dob: '', dateOfAdmission: '', assessmentNumber: '', grade: '', stream: '' }); }} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={() => !uploadingCsv && setShowCsvModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleCsvUpload}>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">Upload Learners CSV</h3>
                  <div className="mb-4 text-sm text-slate-600">
                    <p>Please upload a CSV file with the following headers:</p>
                    <code className="block mt-2 p-2 bg-slate-100 rounded text-xs overflow-x-auto">
                      admissionNumber, fullName, dob, dateOfAdmission, assessmentNumber, grade, stream
                    </code>
                    <p className="mt-2 text-xs text-red-500">* admissionNumber, fullName, and grade are required.</p>
                  </div>
                  
                  {csvErrors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <h4 className="text-sm font-medium text-red-800 mb-1">Validation Errors:</h4>
                      <ul className="text-xs text-red-700 list-disc pl-5 max-h-32 overflow-y-auto">
                        {csvErrors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  )}

                  <div>
                    <input 
                      type="file" 
                      accept=".csv" 
                      required 
                      onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={uploadingCsv || !csvFile} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                    {uploadingCsv ? 'Uploading...' : 'Upload'}
                  </button>
                  <button type="button" onClick={() => { setShowCsvModal(false); setCsvErrors([]); setCsvFile(null); }} disabled={uploadingCsv} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
