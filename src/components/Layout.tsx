import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, School, Users, Settings, LayoutDashboard, BookOpen, Clock, MessageSquare, CreditCard, Library, GraduationCap } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      if (!allowedRoles.includes(parsedUser.role)) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [allowedRoles, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const superAdminNav = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/super' },
    { name: 'Schools', icon: School, path: '/super/schools' },
    { name: 'System Users', icon: Users, path: '/super/users' },
    { name: 'Settings', icon: Settings, path: '/super/settings' },
  ];

  const schoolNav = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/school' },
    { name: 'Registry', icon: Users, path: '/school/registry' },
    { name: 'Academics', icon: GraduationCap, path: '/school/academics' },
    { name: 'Exams', icon: BookOpen, path: '/school/exams' },
    { name: 'Timetable', icon: Clock, path: '/school/timetable' },
    { name: 'eLearning', icon: BookOpen, path: '/school/elearning' },
    { name: 'Library', icon: Library, path: '/school/library' },
    { name: 'Messages', icon: MessageSquare, path: '/school/messages' },
    { name: 'Fees', icon: CreditCard, path: '/school/fees' },
  ];

  const navItems = user.role === 'super_admin' ? superAdminNav : schoolNav;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <School className="h-6 w-6 text-blue-400 mr-3" />
          <span className="font-bold text-lg truncate">
            {user.role === 'super_admin' ? 'Pro System' : user.school?.name || 'School Portal'}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                  location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/school' && item.path !== '/super')
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between">
          <h1 className="text-xl font-semibold text-slate-800">
            {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
