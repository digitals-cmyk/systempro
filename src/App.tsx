import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { SuperAdminSchools } from './pages/SuperAdminSchools';
import { SuperAdminUsers } from './pages/SuperAdminUsers';
import { SuperAdminSettings } from './pages/SuperAdminSettings';
import { SchoolAdminDashboard } from './pages/SchoolAdminDashboard';
import { SchoolRegistry } from './pages/SchoolRegistry';
import Academics from './pages/Academics';
import Exams from './pages/Exams';
import Timetable from './pages/Timetable';
import ELearning from './pages/ELearning';
import Library from './pages/Library';
import Messages from './pages/Messages';
import Fees from './pages/Fees';
import { Layout } from './components/Layout';
import { AuthProvider } from './lib/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/super" element={
            <Layout allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </Layout>
          } />
          <Route path="/super/schools" element={
            <Layout allowedRoles={['super_admin']}>
              <SuperAdminSchools />
            </Layout>
          } />
          <Route path="/super/users" element={
            <Layout allowedRoles={['super_admin']}>
              <SuperAdminUsers />
            </Layout>
          } />
          <Route path="/super/settings" element={
            <Layout allowedRoles={['super_admin']}>
              <SuperAdminSettings />
            </Layout>
          } />
          
          <Route path="/school" element={
            <Layout allowedRoles={['school_admin', 'teacher', 'student', 'parent', 'staff']}>
              <SchoolAdminDashboard />
            </Layout>
          } />

          <Route path="/school/registry" element={
            <Layout allowedRoles={['school_admin', 'teacher']}>
              <SchoolRegistry />
            </Layout>
          } />

          <Route path="/school/academics" element={<Layout allowedRoles={['school_admin', 'teacher']}><Academics /></Layout>} />
          <Route path="/school/exams" element={<Layout allowedRoles={['school_admin', 'teacher']}><Exams /></Layout>} />
          <Route path="/school/timetable" element={<Layout allowedRoles={['school_admin', 'teacher', 'student']}><Timetable /></Layout>} />
          <Route path="/school/elearning" element={<Layout allowedRoles={['school_admin', 'teacher', 'student']}><ELearning /></Layout>} />
          <Route path="/school/library" element={<Layout allowedRoles={['school_admin', 'teacher', 'student']}><Library /></Layout>} />
          <Route path="/school/messages" element={<Layout allowedRoles={['school_admin', 'teacher']}><Messages /></Layout>} />
          <Route path="/school/fees" element={<Layout allowedRoles={['school_admin', 'parent', 'staff']}><Fees /></Layout>} />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
