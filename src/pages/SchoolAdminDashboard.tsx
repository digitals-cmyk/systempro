import { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, Clock } from 'lucide-react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../lib/AuthContext';

export function SchoolAdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalStaff: 0, totalClasses: 0, totalExams: 0 });
  const { user } = useAuth();
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.schoolId) return;

      try {
        // Fetch school name
        const schoolDoc = await getDoc(doc(db, 'schools', user.schoolId));
        if (schoolDoc.exists()) {
          setSchoolName(schoolDoc.data().name);
        }

        // Fetch students
        const studentsQuery = query(collection(db, 'users'), where('schoolId', '==', user.schoolId), where('role', '==', 'learner'));
        const studentsSnapshot = await getDocs(studentsQuery);
        
        // Fetch staff
        const staffQuery = query(collection(db, 'users'), where('schoolId', '==', user.schoolId), where('role', 'in', ['teacher', 'school_admin']));
        const staffSnapshot = await getDocs(staffQuery);

        // Fetch grades
        const gradesQuery = query(collection(db, 'grades'), where('schoolId', '==', user.schoolId));
        const gradesSnapshot = await getDocs(gradesQuery);

        // Fetch exams
        const examsQuery = query(collection(db, 'exams'), where('schoolId', '==', user.schoolId));
        const examsSnapshot = await getDocs(examsQuery);

        setStats({
          totalStudents: studentsSnapshot.size,
          totalStaff: staffSnapshot.size,
          totalClasses: gradesSnapshot.size,
          totalExams: examsSnapshot.size
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-900">Welcome to {schoolName || 'School'}</h2>
        <p className="mt-1 text-slate-500">Here is an overview of your school's activity today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GraduationCap className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">Total Students</dt>
                  <dd className="text-3xl font-semibold text-slate-900">{stats.totalStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">Total Staff</dt>
                  <dd className="text-3xl font-semibold text-slate-900">{stats.totalStaff}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">Total Classes</dt>
                  <dd className="text-3xl font-semibold text-slate-900">{stats.totalClasses}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">Total Exams</dt>
                  <dd className="text-3xl font-semibold text-slate-900">{stats.totalExams}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions / Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg border border-slate-200">
          <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
            <h3 className="text-lg leading-6 font-medium text-slate-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <p className="text-slate-500 text-sm text-center py-4">No recent activity to display.</p>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg border border-slate-200">
          <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
            <h3 className="text-lg leading-6 font-medium text-slate-900">Quick Links</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <a href="/school/registry" className="flex items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Users className="h-6 w-6 text-blue-500 mr-3" />
              <span className="font-medium text-slate-900">Manage Registry</span>
            </a>
            <a href="/school/exams" className="flex items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <BookOpen className="h-6 w-6 text-green-500 mr-3" />
              <span className="font-medium text-slate-900">Manage Exams</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
