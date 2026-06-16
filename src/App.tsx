import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Users, 
  Building2, 
  CalendarCheck, 
  DollarSign, 
  LayoutDashboard, 
  LogOut, 
  RefreshCw, 
  User, 
  ChevronRight, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import { UserSession } from './types';

// Importing modules
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmployeeManager from './components/EmployeeManager';
import DepartmentManager from './components/DepartmentManager';
import AttendanceTracker from './components/AttendanceTracker';
import PayrollManager from './components/PayrollManager';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Employees' | 'Departments' | 'Attendance' | 'Payroll'>('Dashboard');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Mobile drawer trigger
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load session from local storage on first mount
  useEffect(() => {
    verifySession();
  }, []);

  const verifySession = async () => {
    try {
      setLoading(true);
      const cached = localStorage.getItem('employee_session');
      if (cached) {
        const parsed = JSON.parse(cached) as UserSession;
        
        // Verify token with backend
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${parsed.token}` }
        });

        if (res.ok) {
          const verifiedUser = await res.json();
          // Update credentials in session
          const updated = { ...parsed, user: verifiedUser.user };
          setSession(updated);
          localStorage.setItem('employee_session', JSON.stringify(updated));
        } else {
          // If token expired, wipe local storage session
          localStorage.removeItem('employee_session');
          setSession(null);
        }
      }
    } catch (e) {
      console.error('Session clearance exception', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (newSession: UserSession) => {
    setSession(newSession);
    localStorage.setItem('employee_session', JSON.stringify(newSession));
    setActiveTab('Dashboard');
  };

  const handleLogout = () => {
    if (window.confirm('Are you ready to log out of your session?')) {
      localStorage.removeItem('employee_session');
      setSession(null);
    }
  };

  // Callback helper for sub-components to trigger dynamic re-calculations
  const handleRefreshReports = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans" id="app-loading-screen">
        <div className="h-12 w-12 animate-spin rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg mb-4">
          <Shield className="h-6 w-6" />
        </div>
        <p className="text-gray-500 font-semibold animate-pulse">Initializing Organization Vault...</p>
      </div>
    );
  }

  if (!session) {
    return <Login onAuthSuccess={handleAuthSuccess} />;
  }

  // Define tab navigation properties
  const role = session.user.role;
  const menuItems = [
    { name: 'Dashboard' as const, icon: LayoutDashboard },
    { name: 'Employees' as const, icon: Users },
    { name: 'Departments' as const, icon: Building2 },
    { name: 'Attendance' as const, icon: CalendarCheck },
    { name: 'Payroll' as const, icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gray-50/70 flex flex-col md:flex-row font-sans" id="app-workspace-shell">
      
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex-shrink-0 relative z-20" id="desktop-sidebar">
        
        {/* Workspace Brand Title */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="p-2 rounded bg-indigo-600 text-white">
              <Shield className="h-5 w-5" />
            </span>
            <span className="font-display font-extrabold tracking-tight text-sm">OrgMaster Suite</span>
          </div>
        </div>

        {/* User Badge Profile info */}
        <div className="p-4 border-b border-slate-850 bg-slate-950/40" id="user-badge-profile">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-indigo-500 flex-shrink-0 text-indigo-700 font-extrabold">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{session.user.name}</p>
              <p className="text-[10px] text-indigo-400 font-black tracking-wide uppercase mt-0.5">{role} Workspace</p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isCurrent = activeTab === item.name;
            return (
              <button
                key={item.name}
                id={`nav-${item.name.toLowerCase()}`}
                onClick={() => {
                  setActiveTab(item.name);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold transition select-none ${
                  isCurrent 
                    ? 'bg-indigo-600 text-white shadow shadow-indigo-600/10' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4.5 w-4.5" />
                  {item.name}
                </span>
                <ChevronRight className={`h-4 w-4 opacity-0 transition-opacity ${isCurrent ? 'opacity-100' : ''}`} />
              </button>
            );
          })}
        </nav>

        {/* Bottom logout controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button
            onClick={handleLogout}
            id="desktop-logout"
            className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
          >
            <LogOut className="h-4.5 w-4.5" /> Logout Session
          </button>
        </div>
      </aside>

      {/* Mobile Sticky Navbar Header */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 p-4 text-white flex items-center justify-between sticky top-0 z-30" id="mobile-header">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-indigo-600 text-white">
            <Shield className="h-4 w-4" />
          </span>
          <span className="font-display font-black text-sm tracking-tight">OrgMaster</span>
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 px-2 rounded hover:bg-slate-800 text-slate-300"
          id="mobile-drawer-btn"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Drawer Slide-over */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -280 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -280 }}
            className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 z-40 p-5 space-y-6 flex flex-col justify-between shadow-xl md:hidden"
            id="mobile-slide-drawer"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded bg-indigo-600 text-white">
                  <Shield className="h-4 w-4" />
                </span>
                <span className="font-display font-extrabold tracking-tight text-white text-sm">OrgMaster Suite</span>
              </div>

              {/* User badge */}
              <div className="p-3 bg-slate-950/45 rounded-lg">
                <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wider">Active Workspace</span>
                <span className="text-xs font-bold text-white block truncate">{session.user.name}</span>
                <span className="text-[10px] text-gray-400 block">{session.user.email}</span>
              </div>

              {/* Nav */}
              <nav className="space-y-1">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  const isCurrent = activeTab === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveTab(item.name);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold ${
                        isCurrent ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-2.5 p-2 text-rose-450 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg text-xs font-bold"
            >
              <LogOut className="h-4.5 w-4.5" /> Logout Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content body panel */}
      <main className="flex-1 flex flex-col min-w-0" id="main-content-panel">
        
        {/* Universal Top Bar */}
        <header className="hidden md:flex items-center justify-between border-b border-gray-150/60 bg-white p-4 px-6 relative z-10" id="top-bar-panel">
          
          {/* Breadcrumbs / Page Indicators */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <span className="text-slate-400">Org Suite Desktop</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="text-indigo-600 uppercase font-extrabold tracking-wider">{activeTab} Workstation</span>
          </div>

          {/* Quick Stats & Refresh Database Sync */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                handleRefreshReports();
                verifySession();
              }}
              id="db-sync-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition select-none cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Re-calculating...' : 'Sync Database'}
            </button>
            <div className="text-[11px] text-gray-400 font-bold tracking-wide italic">
              GMT 2026/06/16 Session
            </div>
          </div>
        </header>

        {/* Content Panel Frame container (Using motion list layouts for soft transition animation) */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto" id="router-view-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {activeTab === 'Dashboard' && (
                <Dashboard 
                  token={session.token} 
                  role={role} 
                  employeeId={session.user.employeeId} 
                  onNavigate={(tab) => setActiveTab(tab as any)} 
                />
              )}
              {activeTab === 'Employees' && (
                <EmployeeManager 
                  token={session.token} 
                  role={role} 
                  onRefreshReports={handleRefreshReports} 
                />
              )}
              {activeTab === 'Departments' && (
                <DepartmentManager 
                  token={session.token} 
                  role={role} 
                  onRefreshReports={handleRefreshReports} 
                />
              )}
              {activeTab === 'Attendance' && (
                <AttendanceTracker 
                  token={session.token} 
                  role={role} 
                  employeeId={session.user.employeeId} 
                  onRefreshReports={handleRefreshReports} 
                />
              )}
              {activeTab === 'Payroll' && (
                <PayrollManager 
                  token={session.token} 
                  role={role} 
                  employeeId={session.user.employeeId} 
                  onRefreshReports={handleRefreshReports} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
