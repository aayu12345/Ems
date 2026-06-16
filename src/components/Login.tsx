import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Mail, Lock, User, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import { UserSession } from '../types';

interface LoginProps {
  onAuthSuccess: (session: UserSession) => void;
}

export default function Login({ onAuthSuccess }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Employee'>('Employee');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogin(true); // reset alert layout
    setError(null);
    setSuccess(null);
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin
      ? { email, password }
      : { name, email, password, role };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isLogin) {
        onAuthSuccess(data);
      } else {
        setSuccess('Account created successfully! Switching to Login...');
        setIsLogin(true);
        // Clean form
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick credentials fill helper
  const handleDemoFill = (roleSelected: 'Admin' | 'Employee') => {
    if (roleSelected === 'Admin') {
      setEmail('admin@company.com');
      setPassword('admin123');
    } else {
      setEmail('employee@company.com');
      setPassword('employee123');
    }
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 font-sans" id="login-container">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-indigo-200/50 blur-3xl"></div>
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-blue-100/60 blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-xl relative z-10"
        id="login-card"
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {isLogin ? 'Sign in to Employee Workspace' : 'Create Organization Workspace'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Unified HR, Attendance, and Payroll Management
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm text-center font-medium" id="login-error">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm text-center font-medium" id="login-success">
            {success}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} id="login-form">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="login-email"
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">Register Workspace Role</span>
              <div className="grid grid-cols-2 gap-3" id="role-selector-container">
                <button
                  type="button"
                  id="role-btn-emp"
                  onClick={() => setRole('Employee')}
                  className={`py-2 px-3 text-sm rounded-lg border font-medium transition ${
                    role === 'Employee'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Employee Associate
                </button>
                <button
                  type="button"
                  id="role-btn-admin"
                  onClick={() => setRole('Admin')}
                  className={`py-2 px-3 text-sm rounded-lg border font-medium transition ${
                    role === 'Admin'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  HR / Admin
                </button>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              id="submit-auth-btn"
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md shadow-indigo-600/10 disabled:opacity-50 transition"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="relative text-center my-4 py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <span className="relative bg-white px-3 text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Or switch auth state
          </span>
        </div>

        <div className="text-center">
          <button
            type="button"
            id="toggle-auth-state"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition"
          >
            {isLogin ? 'Need to onboard? Create a guest account' : 'Already registered? Clear & Sign In'}
          </button>
        </div>

        {/* Demo Fast Fill Section */}
        <div className="mt-6 pt-5 border-t border-gray-100 space-y-2.5" id="fast-fill-section">
          <div className="flex items-center gap-1.5 justify-center text-xs text-purple-600 font-bold tracking-wide uppercase">
            <Sparkles className="h-3 w-3 animate-pulse" /> Fast Pass (Quick Demo Credentials)
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemoFill('Admin')}
              id="demo-admin-fill"
              className="py-1.5 px-2.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-medium transition text-center"
            >
              🔑 HR Admin
            </button>
            <button
              onClick={() => handleDemoFill('Employee')}
              id="demo-emp-fill"
              className="py-1.5 px-2.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-medium transition text-center"
            >
              👤 Employee User
            </button>
          </div>
          <div className="text-[10px] text-gray-400 text-center italic">
            Passwords: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600 font-semibold text-[10px]">admin123</code> / <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600 font-semibold text-[10px]">employee123</code>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
