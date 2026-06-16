import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Search, Edit2, Trash2, Filter, Mail, Phone, Calendar, Star, Building2, User } from 'lucide-react';
import { Employee, Department } from '../types';

interface EmployeeManagerProps {
  token: string;
  role: 'Admin' | 'Employee';
  onRefreshReports: () => void;
}

export default function EmployeeManager({ token, role, onRefreshReports }: EmployeeManagerProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Form states (Add/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'On Leave'>('Active');
  const [joinDate, setJoinDate] = useState('');
  const [address, setAddress] = useState('');
  const [performanceScore, setPerformanceScore] = useState('4');
  const [createAccount, setCreateAccount] = useState(false);
  const [initialPassword, setInitialPassword] = useState('employee123');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [empRes, deptRes] = await Promise.all([
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!empRes.ok || !deptRes.ok) {
        throw new Error('Could not pull staff directory details');
      }

      const empData = await empRes.json();
      const deptData = await deptRes.json();

      setEmployees(empData);
      setDepartments(deptData);

      if (deptData.length > 0) {
        setDepartmentId(deptData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Fetching failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddForm = () => {
    setIsEditMode(false);
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setEmpRole('');
    setSalary('');
    setStatus('Active');
    setJoinDate(new Date().toISOString().split('T')[0]);
    setAddress('');
    setPerformanceScore('4');
    setCreateAccount(false);
    setInitialPassword('employee123');
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (emp: Employee) => {
    setIsEditMode(true);
    setEditingId(emp.id);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone);
    setEmpRole(emp.role);
    setDepartmentId(emp.departmentId);
    setSalary(emp.salary.toString());
    setStatus(emp.status);
    setJoinDate(emp.joinDate);
    setAddress(emp.address);
    setPerformanceScore(emp.performanceScore.toString());
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to offboard this employee? This will permanently delete their logins, attendance logs, and pay histories.')) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete employee');
      }

      setEmployees(employees.filter(e => e.id !== id));
      onRefreshReports();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const payload = {
      name,
      email,
      phone,
      role: empRole,
      departmentId,
      salary: Number(salary),
      status,
      joinDate,
      address,
      performanceScore: Number(performanceScore),
      createAccount,
      initialPassword
    };

    const url = isEditMode ? `/api/employees/${editingId}` : '/api/employees';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setFormSuccess(isEditMode ? 'Employee updated successfully!' : 'New Employee created and indexed!');
      
      // Update employee list state
      if (isEditMode) {
        setEmployees(employees.map(e => e.id === editingId ? data : e));
      } else {
        setEmployees([...employees, data]);
      }

      onRefreshReports();

      // Delay modal closing slightly for visual success confirmation
      setTimeout(() => {
        setIsFormOpen(false);
      }, 1000);

    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  // Directory Filter Computations
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'All' || emp.departmentId === selectedDept;
    const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" id="emp-loading">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-3"></div>
        <p className="text-gray-500 font-medium font-sans">Compiling staff directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans" id="employee-manager-root">
      
      {/* Top Banner and Navigation Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-gray-950">Employee Records Directory</h1>
          <p className="text-xs text-gray-400">Total counted: {filteredEmployees.length} indexed records</p>
        </div>
        
        {role === 'Admin' && (
          <button
            onClick={handleOpenAddForm}
            id="open-add-emp-btn"
            className="flex items-center gap-1.5 px-4  py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition self-start sm:self-auto shadow shadow-indigo-600/10"
          >
            <UserPlus className="h-4 w-4" /> Onboard Associate
          </button>
        )}
      </div>

      {/* Directory Filter Panel */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center" id="filters-panel">
        
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            id="emp-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employees by name, email, or role..."
            className="block w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/50"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <select
            id="filter-dept-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="block w-full rounded-lg border border-gray-200 py-2 px-2 text-sm focus:border-indigo-500 focus:outline-none bg-gray-50/50"
          >
            <option value="All">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <select
            id="filter-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full rounded-lg border border-gray-200 py-2 px-2 text-sm focus:border-indigo-500 focus:outline-none bg-gray-50/50"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden" id="emp-table-container">
        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No employees found matching the current search parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="emp-table">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Name & Bio</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Annual Base</th>
                  <th className="py-3 px-4">Performance</th>
                  <th className="py-3 px-4">Status</th>
                  {role === 'Admin' && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredEmployees.map(emp => {
                  const dept = departments.find(d => d.id === emp.departmentId);
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition">
                      
                      {/* Name/Bio */}
                      <td className="py-4 px-5">
                        <div>
                          <div className="font-extrabold text-gray-950">{emp.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{emp.role}</div>
                          <div className="text-[10px] text-indigo-600 font-semibold mt-1 bg-indigo-50/50 px-1.5 py-0.5 rounded inline-block">
                            ID: {emp.id}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Mail className="h-3 w-3" /> {emp.email}
                        </div>
                        {emp.phone && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Phone className="h-3 w-3" /> {emp.phone}
                          </div>
                        )}
                      </td>

                      {/* Department */}
                      <td className="py-4 px-4">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {dept ? dept.name : 'Unknown Department'}
                        </span>
                      </td>

                      {/* Annual Base */}
                      <td className="py-4 px-4 font-mono text-xs font-bold text-gray-900">
                        ${emp.salary.toLocaleString()}
                      </td>

                      {/* Performance */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              className={`h-3 w-3 ${
                                idx < emp.performanceScore 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : 'text-gray-200'
                              }`} 
                            />
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          emp.status === 'On Leave' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {emp.status}
                        </span>
                      </td>

                      {/* Actions */}
                      {role === 'Admin' && (
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditForm(emp)}
                              className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                              title="Edit Employee"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(emp.id)}
                              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete Employee"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* Slide-over or Modal Onboarding Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="onboard-modal">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">
                {isEditMode ? 'Modify Employee Profile' : 'Onboard New Employee'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-100 text-red-700 text-xs font-semibold rounded-lg text-center">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-green-100 text-green-700 text-xs font-semibold rounded-lg text-center">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold text-gray-700">
              <div className="grid grid-cols-2 gap-3" id="form-personal-block">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Associate Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Green"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-gray-50/50 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Company Email</label>
                  <input
                    type="email"
                    required
                    placeholder="rgreen@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-gray-50/50 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3" id="form-contact-block">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Work/Cell Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Corporate Title / Role</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Backend Engineer"
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    className="block w-full rounded border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3" id="form-org-block">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Target Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="block w-full rounded border border-gray-200 p-2.5 outline-none bg-gray-50/50"
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Annual Salary (USD)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 75000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="block w-full rounded border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-gray-50/50 mb-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3" id="form-meta-block">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Current Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="block w-full rounded border border-gray-200 p-2.5 outline-none bg-gray-50/50"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Onboarding Date</label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="block w-full rounded border border-gray-200 p-2.5 outline-none bg-gray-50/50 text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Performance (Rating)</label>
                  <select
                    value={performanceScore}
                    onChange={(e) => setPerformanceScore(e.target.value)}
                    className="block w-full rounded border border-gray-200 p-2.5 outline-none bg-gray-50/50"
                  >
                    <option value="1">1.0 - Needs Improvement</option>
                    <option value="2">2.0 - Satisfactory</option>
                    <option value="3">3.0 - Meets Expectations</option>
                    <option value="4">4.0 - Exceeds Expectations</option>
                    <option value="5">5.0 - Stellar/Outstanding</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Physical Address</label>
                <textarea
                  placeholder="Street address city, state, zip"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full rounded border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-gray-50/50"
                />
              </div>

              {/* Password auto login user accounts creation */}
              {!isEditMode && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 space-y-2">
                  <label className="flex items-center gap-2 text-indigo-950 font-bold select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                      className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    Generate Member Login Accounts automatically
                  </label>
                  {createAccount && (
                    <div className="relative pt-1 animate-fadeIn">
                      <label className="block text-[10px] text-gray-500 mb-1 font-bold">Standard initial passwords</label>
                      <input
                        type="text"
                        placeholder="employee123"
                        value={initialPassword}
                        onChange={(e) => setInitialPassword(e.target.value)}
                        className="block w-full rounded border border-indigo-200 p-2 outline-none text-xs bg-white"
                      />
                      <p className="text-[10px] text-indigo-600 italic mt-1 font-semibold">
                        This enables the onboarded employee to sign in immediately using their email.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded text-xs shadow-sm shadow-indigo-600/10"
                >
                  {isEditMode ? 'Apply Updates' : 'Add Employee'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
