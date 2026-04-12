import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../lib/AuthContext';

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  role: string;
  type: 'sign_in' | 'sign_out';
  timestamp: string;
}

export default function Attendance() {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSignedInToday, setHasSignedInToday] = useState(false);

  const fetchAttendance = async () => {
    if (!user?.schoolId) return;
    try {
      const q = query(collection(db, 'attendance'), where('schoolId', '==', user.schoolId));
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
      
      // Sort by date descending
      records.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAttendanceRecords(records);

      // Check if current user has signed in today
      const today = new Date().toDateString();
      const signedIn = records.some(r => 
        r.userId === user.uid && 
        new Date(r.timestamp).toDateString() === today &&
        r.type === 'sign_in'
      );
      setHasSignedInToday(signedIn);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  const handleSignAction = async (type: 'sign_in' | 'sign_out') => {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'attendance'), {
        schoolId: user.schoolId,
        userId: user.uid,
        userName: user.fullName || user.email,
        role: user.role,
        type,
        timestamp: new Date().toISOString()
      });
      fetchAttendance();
    } catch (error) {
      console.error(`Error recording ${type}:`, error);
      alert(`Failed to record ${type}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
        <div className="space-x-3">
          {!hasSignedInToday ? (
            <button
              onClick={() => handleSignAction('sign_in')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <Clock className="h-4 w-4 mr-2" />
              Sign In
            </button>
          ) : (
            <button
              onClick={() => handleSignAction('sign_out')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            >
              <Clock className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
          <h3 className="text-lg leading-6 font-medium text-slate-900">Recent Attendance Records</h3>
        </div>
        <ul className="divide-y divide-slate-200">
          {attendanceRecords.map((record) => (
            <li key={record.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle2 className={`h-5 w-5 mr-3 ${record.type === 'sign_in' ? 'text-green-500' : 'text-orange-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{record.userName}</p>
                    <p className="text-xs text-slate-500 capitalize">{record.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">
                    {record.type === 'sign_in' ? 'Signed In' : 'Signed Out'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(record.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </li>
          ))}
          {attendanceRecords.length === 0 && (
            <li className="px-6 py-4 text-center text-slate-500">No attendance records found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
