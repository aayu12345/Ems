import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, CheckCircle, AlertTriangle, XCircle, Moon, Search, Calendar, Landmark, Coffee } from 'lucide-react';
import { Attendance, Employee } from '../types';

interface AttendanceTrackerProps {
  token: string;
  role: 'Admin' | 'Employee';
  employeeId?: string;
  onRefreshReports: () => void;
}

export default function AttendanceTracker({ token, role, employeeId, onRefreshReports }: AttendanceTrackerProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Digital clock state
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Log filter parameters
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchName, setSearchName] = useState('');

  // Clock-in form parameters (Employee)
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    // Set digital clock interval
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [empRes, attRes] = await Promise.all([
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/attendance', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!empRes.ok || !attRes.ok) {
        throw new Error('Failed to load corporate attendance register logs.');
      }

      const empData = await empRes.json();
      const attData = await attRes.json();

      setEmployees(empData);
      setAttendanceLogs(attData);
    } catch (err: any) {
      setError(err.message || 'Fetching log files failed');
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is already registered for today
  const todayString = new Date().toISOString().split('T')[0];
  const myTodayLog = attendanceLogs.find(a => a.employeeId === employeeId && a.date === todayString);

  // Handle Employee quick clock-in
  const handleClockIn = async () => {
    setIsSubmitting(true);
    setSuccessMsg(null);

    const now = new Date();
    const clockInStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Auto flag as Late if clocked in after 09:15 AM
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
    const calculatedStatus = isLate ? 'Late' : 'Present';

    try {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: todayString,
          status: calculatedStatus,
          clockIn: clockInStr
        })
      });

      if (!response.ok) {
        throw new Error('Could not register clock in.');
      }

      setSuccessMsg(`Successfully Clocked In at ${clockInStr}! Current state: ${calculatedStatus}`);
      fetchData();
      onRefreshReports();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Employee quick clock-out
  const handleClockOut = async () => {
    setIsSubmitting(true);
    setSuccessMsg(null);

    const clockOutStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    try {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: todayString,
          status: myTodayLog?.status || 'Present', // preserve original
          clockIn: myTodayLog?.clockIn,
          clockOut: clockOutStr
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register checkout.');
      }

      setSuccessMsg(`Successfully Clocked Out at ${clockOutStr}!`);
      fetchData();
      onRefreshReports();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Employee files leave request
  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      alert('Specify leave description or sick details');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: todayString,
          status: 'Leave',
          leaveReason: leaveReason
        })
      });

      if (!response.ok) {
        throw new Error('On leave log registration failed.');
      }

      setSuccessMsg('Active Leave logged successfully for today.');
      setLeaveReason('');
      fetchData();
      onRefreshReports();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin marks status of an employee
  const handleAdminMarkStatus = async (empId: string, itemStatus: 'Present' | 'Absent' | 'Leave' | 'Late') => {
    try {
      const now = new Date();
      let clockIn: string | undefined = undefined;
      let clockOut: string | undefined = undefined;

      if (itemStatus === 'Present') {
        clockIn = '09:00';
        clockOut = '17:00';
      } else if (itemStatus === 'Late') {
        clockIn = '10:00';
        clockOut = '17:00';
      }

      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: empId,
          date: searchDate,
          status: itemStatus,
          clockIn,
          clockOut,
          leaveReason: itemStatus === 'Leave' ? 'Designated Admin Outage' : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      fetchData();
      onRefreshReports();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick calculations
  const filteredLogs = attendanceLogs.filter(log => {
    const matchesDate = !searchDate || log.date === searchDate;
    const matchesName = !searchName || log.employeeName.toLowerCase().includes(searchName.toLowerCase());
    return matchesDate && matchesName;
  });

  const activeEmployees = employees.filter(e => e.status === 'Active');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" id="att-loading">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-3 font-sans"></div>
        <p className="text-gray-500 font-medium font-sans animate-pulse">Scanning attendance registers and rosters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-fadeIn" id="attendance-tracker-root">
      
      {/* Employee Quick Clock-In Center */}
      {role === 'Employee' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="emp-timeclock-deck">
          {/* Digital clock & In/Out button */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4 md:col-span-2 relative overflow-hidden" id="timeclock-card">
            <div className="absolute top-0 right-0 p-3 bg-indigo-50 rounded-bl-xl text-indigo-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs">
              <Clock className="h-4 w-4 animate-spin-slow" /> Real-time Clock
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">Current Daily Session</p>
              <h2 className="text-3xl font-black text-gray-950 font-mono tracking-tight">{currentTime}</h2>
              <p className="text-xs text-gray-500 font-semibold">{new Date().toDateString()}</p>
            </div>

            {successMsg && (
              <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 font-medium rounded-lg text-xs w-full max-w-sm">
                🎉 {successMsg}
              </div>
            )}

            <div className="flex gap-4 w-full max-w-sm" id="timeclock-btns-row">
              <button
                onClick={handleClockIn}
                disabled={isSubmitting || !!myTodayLog?.clockIn || myTodayLog?.status === 'Leave'}
                className="flex-1 py-3 px-4 bg-emerald-600 font-black text-white rounded-lg text-xs hover:bg-emerald-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow shadow-emerald-600/10"
              >
                {myTodayLog?.clockIn ? `In: ${myTodayLog.clockIn}` : 'Clock In Session'}
              </button>

              <button
                onClick={handleClockOut}
                disabled={isSubmitting || !myTodayLog?.clockIn || !!myTodayLog?.clockOut}
                className="flex-1 py-3 px-4 bg-amber-600 font-black text-white rounded-lg text-xs hover:bg-amber-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow shadow-amber-600/10"
              >
                {myTodayLog?.clockOut ? `Out: ${myTodayLog.clockOut}` : 'Clock Out Session'}
              </button>
            </div>

            <div className="text-[10px] text-gray-400 font-medium">
              Standard shifts: 09:00 AM to 05:00 PM. Clock-ins registered after 09:15 AM are automatically logged as 'Late'.
            </div>
          </div>

          {/* Sickness / Vacation Outbox form */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3" id="leave-request-container">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase font-sans">
              <Coffee className="h-4 w-4 text-indigo-600" /> Log Outage / Sick Day
            </h3>
            <p className="text-[11px] text-gray-400 leading-snug">
              Filing a leave report marks your status for today as 'Leave' on the register log, with the custom memo provided below.
            </p>

            <form onSubmit={handleLeaveRequest} className="space-y-3">
              <input
                type="text"
                required
                disabled={!!myTodayLog}
                placeholder="e.g. Doctor appointment, sick leave..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                className="block w-full text-xs p-2.5 rounded border border-gray-200 outline-none bg-gray-50/50"
              />
              <button
                type="submit"
                disabled={isSubmitting || !!myTodayLog}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 text-white disabled:text-gray-400 transition font-black text-xs rounded-md shadow-xs"
              >
                File Today Leave
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Panel: Quick attendance registers */}
      {role === 'Admin' && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4" id="admin-daily-checker">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-50">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Roster Check-off List ({searchDate})</h2>
              <p className="text-[11px] text-gray-400">Perform quick click attendance logging for active employees</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Pick Target Date:</span>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="text-xs font-bold p-1.5 rounded border border-gray-200 outline-none focus:border-indigo-500 bg-gray-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="admin-roster-cards">
            {activeEmployees.map(emp => {
              // Find matching attendance for target date
              const dayLog = attendanceLogs.find(a => a.employeeId === emp.id && a.date === searchDate);

              return (
                <div key={emp.id} className="p-3.5 border border-gray-100 rounded-lg bg-gray-50/20 hover:bg-gray-50/40 transition flex flex-col justify-between space-y-3 font-sans">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-gray-950">{emp.name}</h4>
                      <p className="text-[10px] text-gray-400 truncate">{emp.role}</p>
                    </div>
                    {dayLog ? (
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        dayLog.status === 'Present' ? 'bg-emerald-100 text-emerald-850' :
                        dayLog.status === 'Late' ? 'bg-amber-100 text-amber-850' :
                        dayLog.status === 'Leave' ? 'bg-sky-100 text-sky-850' :
                        'bg-red-100 text-red-850'
                      }`}>
                        {dayLog.status}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Quick toggle list */}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400">
                    <span>Change Status:</span>
                    <div className="flex items-center gap-1.5" id="roster-btns text-right">
                      <button
                        onClick={() => handleAdminMarkStatus(emp.id, 'Present')}
                        className="px-1 py-0.5 font-bold uppercase rounded bg-white hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 text-emerald-700"
                        title="Mark Present"
                      >
                        Pres
                      </button>
                      <button
                        onClick={() => handleAdminMarkStatus(emp.id, 'Late')}
                        className="px-1 py-0.5 font-bold uppercase rounded bg-white hover:bg-amber-50 border border-gray-100 hover:border-amber-200 text-amber-700"
                        title="Mark Late"
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleAdminMarkStatus(emp.id, 'Leave')}
                        className="px-1 py-0.5 font-bold uppercase rounded bg-white hover:bg-blue-50 border border-gray-100 hover:border-blue-200 text-blue-700"
                        title="Mark On Leave"
                      >
                        Leave
                      </button>
                      <button
                        onClick={() => handleAdminMarkStatus(emp.id, 'Absent')}
                        className="px-1 py-0.5 font-bold uppercase rounded bg-white hover:bg-red-50 border border-gray-100 hover:border-red-200 text-red-700"
                        title="Mark Absent"
                      >
                        Abs
                      </button>
                    </div>
                  </div>
                  
                  {dayLog && (dayLog.clockIn || dayLog.leaveReason) && (
                    <div className="text-[10px] text-gray-400 font-semibold italic bg-white p-2 rounded border border-gray-100 leading-snug">
                      {dayLog.leaveReason ? `Outage Memo: ${dayLog.leaveReason}` : `Hours: ${dayLog.clockIn || '--'} to ${dayLog.clockOut || 'active'}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Logs Audit Search Panel */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4" id="historical-logs-audit">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-150">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Historical Attendance Register logs</h2>
            <p className="text-[11px] text-gray-400">Review, audit, or trace presence rosters across dates</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-gray-400">Filters:</span>
            <input
              type="text"
              placeholder="Search associate..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="text-xs p-1.5 rounded border border-gray-200 outline-none bg-gray-50/50"
            />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="text-xs p-1.5 rounded border border-gray-200 outline-none bg-gray-50/50 font-semibold"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center italic bg-gray-50/50 rounded-lg">
            No historical logs indexed for these coordinates.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse" id="history-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Associate name</th>
                  <th className="py-2.5 px-4">Shift Status</th>
                  <th className="py-2.5 px-4">Clock In</th>
                  <th className="py-2.5 px-4">Clock Out</th>
                  <th className="py-2.5 px-4 text-right">Outage memo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/30 transition">
                    <td className="py-2 px-4 font-bold text-gray-950 font-mono">{log.date}</td>
                    <td className="py-2 px-4 font-semibold text-slate-800">{log.employeeName}</td>
                    <td className="py-2 px-4">
                      <span className={`inline-block py-0.5 px-2 rounded-full font-bold text-[9px] uppercase ${
                        log.status === 'Present' ? 'bg-emerald-50 text-emerald-800' :
                        log.status === 'Late' ? 'bg-amber-50 text-amber-800' :
                        log.status === 'Leave' ? 'bg-blue-50 text-blue-800' :
                        'bg-red-50 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-mono font-bold text-gray-500">{log.clockIn || '--'}</td>
                    <td className="py-2 px-4 font-mono font-bold text-gray-500">{log.clockOut || '--'}</td>
                    <td className="py-2 px-4 text-right italic text-gray-400 truncate max-w-sm">
                      {log.leaveReason || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
