import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, DollarSign, Edit3, Trash, Activity, Search, Calendar, FileText, Check, AlertCircle, PlusCircle, Printer, Landmark } from 'lucide-react';
import { Payroll, Employee } from '../types';

interface PayrollManagerProps {
  token: string;
  role: 'Admin' | 'Employee';
  employeeId?: string;
  onRefreshReports: () => void;
}

export default function PayrollManager({ token, role, employeeId, onRefreshReports }: PayrollManagerProps) {
  const [payrollLogs, setPayrollLogs] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter selection hooks
  const [searchMonth, setSearchMonth] = useState('June');
  const [searchYear, setSearchYear] = useState('2026');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Generation selectors
  const [generateMonth, setGenerateMonth] = useState('June');
  const [generateYear, setGenerateYear] = useState('2026');
  const [isGenerating, setIsGenerating] = useState(false);

  // Interactive Selected Slip (payslip invoice display)
  const [selectedSlip, setSelectedSlip] = useState<Payroll | null>(null);

  // Edit Slip Modal Parameters
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState<Payroll | null>(null);
  const [bonuses, setBonuses] = useState('');
  const [deductions, setDeductions] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Pending');
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [payRes, empRes] = await Promise.all([
        fetch('/api/payroll', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!payRes.ok || !empRes.ok) {
        throw new Error('Failed to retrieve salary structures and payslips.');
      }

      const payData = await payRes.json();
      const empData = await empRes.json();

      setPayrollLogs(payData);
      setEmployees(empData);

      // Select employee's first slip automatically if Employee
      if (role === 'Employee' && payData.length > 0) {
        const mySlips = payData.filter((p: Payroll) => p.employeeId === employeeId);
        if (mySlips.length > 0) {
          setSelectedSlip(mySlips[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error pulling data');
    } finally {
      setLoading(false);
    }
  };

  // Generate payroll logs
  const handleGeneratePayroll = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: generateMonth,
          year: Number(generateYear)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate logs');
      }

      alert(data.message || 'Payroll generated successfully!');
      fetchData();
      onRefreshReports();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Edit Modal for a Specific payroll log
  const handleOpenEditModal = (slip: Payroll) => {
    setEditingSlip(slip);
    setBonuses(slip.bonuses.toString());
    setDeductions(slip.deductions.toString());
    setPaymentStatus(slip.status);
    setUpdateError(null);
    setIsEditModalOpen(true);
  };

  // Submit edit logic
  const handleUpdateSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlip) return;

    setUpdateError(null);
    try {
      const response = await fetch(`/api/payroll/${editingSlip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bonuses: Number(bonuses),
          deductions: Number(deductions),
          status: paymentStatus
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply updates');
      }

      // Update local state listing
      setPayrollLogs(payrollLogs.map(p => p.id === editingSlip.id ? data : p));
      
      // Update selected payslip representing active invoice
      if (selectedSlip && selectedSlip.id === editingSlip.id) {
        setSelectedSlip(data);
      }

      setIsEditModalOpen(false);
      onRefreshReports();
    } catch (err: any) {
      setUpdateError(err.message);
    }
  };

  // Admin fast check-out payout trigger
  const handleReleasePayout = async (slipId: string) => {
    try {
      const response = await fetch(`/api/payroll/${slipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Paid'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error('Verification failed');
      }

      setPayrollLogs(payrollLogs.map(p => p.id === slipId ? data : p));
      
      if (selectedSlip && selectedSlip.id === slipId) {
        setSelectedSlip(data);
      }

      onRefreshReports();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Print slip helper
  const handlePrintPayslip = () => {
    window.print();
  };

  // Perform Calculations & Filters
  const filteredSlips = payrollLogs.filter(log => {
    const matchesMonth = log.month === searchMonth;
    const matchesYear = log.year.toString() === searchYear;
    const matchesName = !employeeSearch || log.employeeName.toLowerCase().includes(employeeSearch.toLowerCase());
    return matchesMonth && matchesYear && matchesName;
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fadeIn" id="payroll-loading">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-3"></div>
        <p className="text-gray-500 font-medium font-sans">Compiling calculations, deductions, and indices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans" id="payroll-manager-root">
      
      {/* Top Banner & Generation tools */}
      {role === 'Admin' && (
        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4" id="admin-payout-generators">
          <div>
            <h1 className="text-sm font-bold text-gray-950 uppercase tracking-wide">Generate Workspace Pay Structures</h1>
            <p className="text-xs text-gray-400">Initiate payroll files for active employee listings</p>
          </div>

          <div className="flex items-center gap-2" id="generators-selector">
            <select
              value={generateMonth}
              onChange={(e) => setGenerateMonth(e.target.value)}
              className="text-xs p-2 rounded border border-gray-200 outline-none bg-gray-50/50 font-semibold"
            >
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={generateYear}
              onChange={(e) => setGenerateYear(e.target.value)}
              className="text-xs p-2 rounded border border-gray-200 outline-none bg-gray-50/50 font-semibold"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
            <button
              onClick={handleGeneratePayroll}
              disabled={isGenerating}
              id="generate-payroll-btn"
              className="px-4 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded shadow-sm shadow-indigo-600/10"
            >
              {isGenerating ? 'Pooling...' : 'Build List Logs'}
            </button>
          </div>
        </div>
      )}

      {/* Two column interactive grid: Directory list / payslip details */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="payroll-interactive-suite">
        
        {/* Left Side: Payroll Logs List (Takes 2 cols for Admin or 1 for Employee) */}
        <div className={`space-y-4 ${role === 'Admin' ? 'xl:col-span-2' : 'xl:col-span-1'}`} id="payroll-directory-list">
          
          {/* Header search parameters */}
          <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <h2 className="text-xs font-bold text-gray-900 uppercase">Search Payslips Database</h2>
              <FileText className="h-4 w-4 text-gray-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold mb-1">Target Month</label>
                <select
                  value={searchMonth}
                  onChange={(e) => {
                    setSearchMonth(e.target.value);
                    setSelectedSlip(null);
                  }}
                  className="block w-full text-xs p-2 rounded border border-gray-200 bg-gray-50/50 outline-none focus:border-indigo-500 font-semibold text-slate-800"
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold mb-1">Target Year</label>
                <select
                  value={searchYear}
                  onChange={(e) => {
                    setSearchYear(e.target.value);
                    setSelectedSlip(null);
                  }}
                  className="block w-full text-xs p-2 rounded border border-gray-200 bg-gray-50/50 outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              {role === 'Admin' && (
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1 font-bold">Search Name</label>
                  <input
                    type="text"
                    placeholder="Search associate..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="block w-full text-xs p-2 rounded border border-gray-200 bg-gray-50/50 outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* List display */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden" id="payroll-deck">
            {filteredSlips.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-12 italic">
                No salary profiles or payslips generated for {searchMonth} {searchYear}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse" id="payroll-table">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 font-bold text-gray-400 uppercase text-[10px]">
                      <th className="py-3 px-4">Associate</th>
                      <th className="py-3 px-4">Base Earnings</th>
                      <th className="py-3 px-4">Take Home</th>
                      <th className="py-3 px-4">Payout Stamp</th>
                      {role === 'Admin' && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSlips.map(slip => {
                      const isTargetInvoice = selectedSlip?.id === slip.id;
                      return (
                        <tr 
                          key={slip.id} 
                          onClick={() => setSelectedSlip(slip)}
                          className={`cursor-pointer transition ${
                            isTargetInvoice ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-gray-950 block">{slip.employeeName}</span>
                            <span className="text-[10px] text-gray-400 block">{slip.month} {slip.year}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-gray-500">
                            ${slip.baseSalary.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-slate-900">
                            ${slip.netSalary.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              slip.status === 'Paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {slip.status}
                            </span>
                          </td>
                          {role === 'Admin' && (
                            <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2 text-[10px] font-bold">
                                {slip.status === 'Pending' && (
                                  <button
                                    onClick={() => handleReleasePayout(slip.id)}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded transition"
                                  >
                                    Pay Out
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenEditModal(slip)}
                                  className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Payslip printable-style invoice card detail (takes 1 col for Admin or 2 cols for Employee) */}
        <div className={role === 'Admin' ? 'xl:col-span-1' : 'xl:col-span-2'} id="payslip-invoice-viewer">
          {selectedSlip ? (
            <motion.div 
              layoutId="payslip-invoice"
              className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 space-y-6 shadow-sm font-sans scale-100"
              id="payslip-frame"
            >
              {/* Invoice top corner */}
              <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 font-black text-indigo-950 uppercase tracking-tighter text-sm">
                    <Landmark className="h-4 w-4 text-indigo-600" /> Organization Co.
                  </div>
                  <p className="text-[10px] text-gray-400">Headquarters Floor 3, Suite Tech Tower</p>
                </div>
                
                <div className="text-right">
                  <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded inline-block ${
                    selectedSlip.status === 'Paid' ? 'bg-emerald-100 text-emerald-850' : 'bg-amber-100 text-amber-850'
                  }`}>
                    {selectedSlip.status === 'Paid' ? 'Paid & Approved Outage' : 'Scheduled / Pending'}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">Ref ID: {selectedSlip.id}</p>
                </div>
              </div>

              {/* Title descriptor */}
              <div className="text-center bg-gray-50 py-3 rounded-lg border border-gray-100">
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-900">Official Payslip Statement</h3>
                <p className="text-[10px] text-gray-400">Salary statement generated for {selectedSlip.month} {selectedSlip.year}</p>
              </div>

              {/* Recipient info & stats */}
              <div className="grid grid-cols-2 gap-4 text-[11px] border-b border-gray-100 pb-4">
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">To Employee Address</span>
                  <p className="font-extrabold text-gray-900 text-sm">{selectedSlip.employeeName}</p>
                  <p className="text-gray-400 text-[10px] font-medium">Affiliated Associate Member</p>
                  <p className="text-gray-400 text-[10px] mt-1">ID Code: {selectedSlip.employeeId}</p>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-gray-450 font-bold uppercase">Transaction Details</span>
                  <p className="text-gray-500">Method: Direct Deposit Bank Wire</p>
                  <p className="text-gray-500 font-semibold">Payout date: {selectedSlip.payoutDate || 'TBD (At approval)'}</p>
                </div>
              </div>

              {/* Earnings table structures */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-extrabold uppercase text-indigo-900 tracking-wider">Salary breakdown audit</h4>

                <div className="space-y-2 border border-gray-100 p-3 rounded-lg text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-500">Gross Monthly Base Salary</span>
                    <span className="font-mono text-gray-800">${selectedSlip.baseSalary.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between font-medium">
                    <span className="text-emerald-600 font-bold">+ Additional Performance Bonus</span>
                    <span className="font-mono text-emerald-700 font-bold">+ ${selectedSlip.bonuses.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between font-medium pb-2 border-b border-gray-100">
                    <span className="text-red-600 font-bold">- Deductions (Leave adjustments / taxes)</span>
                    <span className="font-mono text-red-750 font-bold">- ${selectedSlip.deductions.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between pt-1 font-black text-gray-950 text-sm">
                    <span>Net Take-Home Salary</span>
                    <span className="font-mono text-indigo-850 font-extrabold text-base">${selectedSlip.netSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer signatures */}
              <div className="flex justify-between items-end pt-4 border-t border-gray-100 text-[10px]">
                <div className="italic text-gray-400">
                  Automated electronic payslip.
                  <br />Approved by Corporate HR Desk.
                </div>
                
                <button
                  onClick={handlePrintPayslip}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition rounded font-extrabold"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Statement
                </button>
              </div>

            </motion.div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center text-gray-400 font-sans italic flex flex-col items-center justify-center space-y-2 leading-relaxed" id="no-payslip-inspected">
              <CreditCard className="h-8 w-8 text-gray-300 animate-pulse" />
              <span>Select any associate's payslip or roster statement on the left to examine their full pay breakdown.</span>
            </div>
          )}
        </div>
      </div>

      {/* Admin parameters modifier popup (Bonuses/Deductions) */}
      {isEditModalOpen && editingSlip && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="edit-payout-modal">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-sm p-6 space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">
                Adjust Payment parameters
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-650 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-450 leading-relaxed font-semibold">
              Client target: <strong className="text-gray-900">{editingSlip.employeeName}</strong> ({editingSlip.month} {editingSlip.year})
            </p>

            {updateError && (
              <div className="p-3 bg-red-100 text-red-700 text-xs font-semibold rounded text-center">
                {updateError}
              </div>
            )}

            <form onSubmit={handleUpdateSlip} className="space-y-4 text-xs font-semibold text-gray-700">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Add Bonuses (USD)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={bonuses}
                  onChange={(e) => setBonuses(e.target.value)}
                  className="block w-full rounded border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Tax / Leave Deductions (USD)</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="block w-full rounded border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Approval Release Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="block w-full rounded border border-gray-200 p-2.5 outline-none bg-gray-50/50"
                >
                  <option value="Pending">Pending Audit</option>
                  <option value="Paid">Released & Paid</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded text-xs shadow-sm"
                >
                  Confirm parameters
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
