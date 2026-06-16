import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Building2, UserCheck, CalendarCheck, DollarSign, Award, Target, TrendingUp, Briefcase } from 'lucide-react';
import { ReportSummary, Employee, Department } from '../types';

interface DashboardProps {
  token: string;
  role: 'Admin' | 'Employee';
  employeeId?: string;
  onNavigate: (section: string) => void;
}

export default function Dashboard({ token, role, employeeId, onNavigate }: DashboardProps) {
  const [reports, setReports] = useState<ReportSummary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [repRes, empRes, deptRes] = await Promise.all([
        fetch('/api/reports', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!repRes.ok || !empRes.ok || !deptRes.ok) {
        throw new Error('Failed to retrieve analytical reports');
      }

      const repData = await repRes.json();
      const empData = await empRes.json();
      const deptData = await deptRes.json();

      setReports(repData);
      setEmployees(empData);
      setDepartments(deptData);
    } catch (err: any) {
      setError(err.message || 'Failed loading reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" id="dashboard-loading">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-3"></div>
        <p className="text-gray-500 font-medium">Aggregating workspace metrics...</p>
      </div>
    );
  }

  if (error || !reports) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center my-6 max-w-xl mx-auto" id="dashboard-error">
        <p className="font-semibold">{error || 'Could not load data'}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-3 px-4 py-2 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700 transition"
        >
          Retry Load
        </button>
      </div>
    );
  }

  // Find top performance score employee (5 out of 5)
  const stellarEmployees = employees.filter(e => e.performanceScore === 5);
  const departmentCount = departments.length;

  return (
    <div className="space-y-8 font-sans" id="dashboard-container">
      {/* Dynamic welcome banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 sm:p-8 rounded-2xl text-white relative overflow-hidden shadow-xl" id="dashboard-welcome">
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white blur-3xl"></div>
        </div>
        <div className="relative z-10 space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-indigo-300 uppercase px-2 px-1 py-1 rounded bg-indigo-800/60 inline-block mb-1">
            {role === 'Admin' ? 'Management Dashboard' : 'Associate Workspace'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to Organization Center
          </h1>
          <p className="text-sm text-indigo-200 max-w-2xl">
            {role === 'Admin' 
              ? 'Real-time operational dashboard for headcount audits, department performance checks, daily clock-in details, and payroll releases.'
              : 'Clock-in, review company profile directory, monitor department lists, and review your latest payslips.'}
          </p>
        </div>
      </div>

      {/* Quick Numbers Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="stats-grid">
        {/* Metric 1 */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 transition"
        >
          <div className="h-12 w-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Employees</p>
            <h3 className="text-2xl font-extrabold text-gray-950 mt-1">{reports.totalEmployees}</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">● {reports.statusSummary.active} Active Associates</p>
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 transition"
        >
          <div className="h-12 w-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Departments</p>
            <h3 className="text-2xl font-extrabold text-gray-950 mt-1">{departmentCount}</h3>
            <p className="text-[10px] text-blue-600 font-bold mt-1">Active functional blocks</p>
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 transition"
        >
          <div className="h-12 w-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Attendance Today</p>
            <h3 className="text-2xl font-extrabold text-gray-950 mt-1">
              {reports.attendanceSummary.totalTracked > 0 
                ? `${reports.attendanceSummary.present + reports.attendanceSummary.late} / ${reports.attendanceSummary.totalTracked}`
                : '100%'}
            </h3>
            <p className="text-[10px] text-amber-600 font-bold mt-1">
              {reports.attendanceSummary.late} marked late check-ins
            </p>
          </div>
        </motion.div>

        {/* Metric 4 */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 transition"
        >
          <div className="h-12 w-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Averaged Salary</p>
            <h3 className="text-2xl font-extrabold text-gray-950 mt-1">
              ${reports.averageSalaryGlobal.toLocaleString()} <span className="text-xs font-bold text-gray-400">/ yr</span>
            </h3>
            <p className="text-[10px] text-purple-600 font-bold mt-1">
              Est. Monthly: ${(reports.payrollCost.monthlyAverage).toLocaleString()}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main Charts & Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-visuals-grid">
        
        {/* SVG/CSS Bar Chart: Employee Distribution & Budgets */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2 space-y-6" id="department-distribution-chart">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Department Distribution</h2>
              <p className="text-xs text-gray-400">Budget levels against associate headcount</p>
            </div>
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-5">
            {reports.deptDistribution.map(dept => {
              // Calculate percent of employees compared to maximum
              const maxEmployees = Math.max(...reports.deptDistribution.map(d => d.employeeCount)) || 1;
              const percent = (dept.employeeCount / maxEmployees) * 100;
              
              return (
                <div key={dept.id} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                      {dept.name}
                    </span>
                    <span className="text-gray-500">
                      {dept.employeeCount} {dept.employeeCount === 1 ? 'Associate' : 'Associates'} 
                      <span className="mx-1.5 text-gray-300">|</span> 
                      Avg. Salary ${dept.averageSalary.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="bg-indigo-600 h-full rounded-full"
                    ></motion.div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400" id="dept-budget-line">
                    <span>Active Team size: {dept.employeeCount}</span>
                    <span>Annual Budget allocation: ${dept.budget?.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span className="font-semibold text-indigo-600">Need specific adjustments?</span>
            <button 
              onClick={() => onNavigate('Departments')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              Configure Departments <Building2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Attendance Summary and Dial Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6" id="attendance-summary-chart">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Attendance (Today)</h2>
              <p className="text-xs text-gray-400">Marked attendance register state</p>
            </div>
            <CalendarCheck className="h-5 w-5 text-gray-400" />
          </div>

          {reports.attendanceSummary.totalTracked === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center space-y-1.5 bg-gray-50 rounded-lg p-4">
              <span className="text-xs font-semibold text-gray-500">No attendance registered for today.</span>
              <button
                onClick={() => onNavigate('Attendance')}
                className="text-xs px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition"
              >
                Mark Attendance
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dial visual */}
              <div className="flex justify-center relative py-2">
                {/* Visual Circle Dial */}
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#F3F4F6"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#4F46E5"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={376.8}
                    strokeDashoffset={376.8 - (376.8 * ((reports.attendanceSummary.present + reports.attendanceSummary.late) / reports.attendanceSummary.totalTracked))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-gray-950">
                    {Math.round(((reports.attendanceSummary.present + reports.attendanceSummary.late) / reports.attendanceSummary.totalTracked) * 100)}%
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Presence</span>
                </div>
              </div>

              {/* Attendance metrics breakdowns */}
              <div className="grid grid-cols-2 gap-3" id="attendance-stat-box">
                <div className="p-2 border border-gray-100 rounded bg-emerald-50/50 text-center">
                  <span className="text-xs font-bold text-gray-400">Present</span>
                  <div className="text-lg font-black text-emerald-700">{reports.attendanceSummary.present}</div>
                </div>
                <div className="p-2 border border-gray-100 rounded bg-amber-50/50 text-center">
                  <span className="text-xs font-bold text-gray-400">Late</span>
                  <div className="text-lg font-black text-amber-700">{reports.attendanceSummary.late}</div>
                </div>
                <div className="p-2 border border-gray-100 rounded bg-sky-50/50 text-center">
                  <span className="text-xs font-bold text-gray-400">On Leave</span>
                  <div className="text-lg font-black text-sky-700">{reports.attendanceSummary.leave}</div>
                </div>
                <div className="p-2 border border-gray-100 rounded bg-red-50/50 text-center">
                  <span className="text-xs font-bold text-gray-400">Absent</span>
                  <div className="text-lg font-black text-red-700">{reports.attendanceSummary.absent}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Secondary analytics - Stellar Associates, Operations & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="secondary-reports-panel">
        
        {/* Stellar Employees */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 lg:col-span-1" id="top-performers-card">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-amber-500" /> Executive High-Performers
            </h2>
            <Target className="h-4 w-4 text-gray-400" />
          </div>

          <div className="space-y-3.5 max-h-64 overflow-y-auto">
            {stellarEmployees.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No employees marked 5/5 this cycle.</p>
            ) : (
              stellarEmployees.slice(0, 5).map(emp => {
                const deptName = departments.find(d => d.id === emp.departmentId)?.name || 'General';
                return (
                  <div key={emp.id} className="flex justify-between items-center p-2.5 rounded-lg border border-yellow-50 bg-yellow-50/30">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{emp.name}</h4>
                      <p className="text-[10px] text-gray-400">{emp.role} • {deptName}</p>
                    </div>
                    <span className="text-[11px] font-black text-amber-600 bg-amber-100/50 px-2.5 py-1 rounded">
                      ★ 5.0 Rating
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Basic Payroll Summary */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 lg:col-span-1" id="payroll-overview-card">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-600" /> Monthly Payroll Tracking
            </h2>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Disbursed (May/June Logs)</span>
                <span className="font-bold text-emerald-600">${reports.payrollCost.paid.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full" 
                  style={{ width: `${reports.payrollCost.paid + reports.payrollCost.pending > 0 ? (reports.payrollCost.paid / (reports.payrollCost.paid + reports.payrollCost.pending)) * 100 : 100}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2" id="payroll-grid-summaries">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded text-center">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Paid Funds</span>
                <div className="text-base font-extrabold text-slate-800 mt-1">${reports.payrollCost.paid.toLocaleString()}</div>
              </div>

              <div className="p-3 bg-red-50/40 border border-red-100 rounded text-center">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold font-bold">Pending Approval</span>
                <div className="text-base font-extrabold text-red-800 mt-1">${reports.payrollCost.pending.toLocaleString()}</div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => onNavigate('Payroll')}
                className="w-full py-2 bg-indigo-600 text-white font-semibold text-xs rounded hover:bg-indigo-700 transition"
              >
                Go to Payroll Manager
              </button>
            </div>
          </div>
        </div>

        {/* Org Actions Quick Links */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 lg:col-span-1" id="quick-links-card">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-indigo-600" /> Operational Hub Activities
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2.5" id="org-activities-btns">
            {role === 'Admin' ? (
              <>
                <button 
                  onClick={() => onNavigate('Employees')}
                  className="flex items-center gap-2 p-3 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-gray-100 transition text-left"
                >
                  <Users className="h-4 w-4 text-indigo-600" /> Onboard / Manage Employees
                </button>
                <button 
                  onClick={() => onNavigate('Departments')}
                  className="flex items-center gap-2 p-3 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-gray-100 transition text-left"
                >
                  <Building2 className="h-4 w-4 text-blue-600" /> Oversee Department Metrics
                </button>
                <button 
                  onClick={() => onNavigate('Attendance')}
                  className="flex items-center gap-2 p-3 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-gray-100 transition text-left"
                >
                  <CalendarCheck className="h-4 w-4 text-purple-600" /> Audit Daily Attendance
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('Attendance')}
                  className="flex items-center gap-2 p-3 text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-gray-100 transition text-left"
                >
                  <CalendarCheck className="h-5 w-5 text-indigo-600" /> Clock In / Edit Today Attendance
                </button>
                <button 
                  onClick={() => onNavigate('Payroll')}
                  className="flex items-center gap-2 p-3 text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-gray-100 transition text-left"
                >
                  <DollarSign className="h-5 w-5 text-emerald-600" /> Access My Payroll Payslips
                </button>
                <button 
                  onClick={() => onNavigate('Employees')}
                  className="flex items-center gap-2 p-3 text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-gray-100 transition text-left"
                >
                  <Users className="h-5 w-5 text-blue-600" /> Company Directory Search
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
