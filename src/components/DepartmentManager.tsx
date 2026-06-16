import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit3, Trash2, Building2, MapPin, DollarSign, Users, Briefcase, Eye, ChevronRight } from 'lucide-react';
import { Department, Employee } from '../types';

interface DepartmentManagerProps {
  token: string;
  role: 'Admin' | 'Employee';
  onRefreshReports: () => void;
}

export default function DepartmentManager({ token, role, onRefreshReports }: DepartmentManagerProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Department for sub-employees lookup
  const [viewDeptDetails, setViewDeptDetails] = useState<string | null>(null);

  // Form modal parameters
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form values
  const [name, setName] = useState('');
  const [managerId, setManagerId] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [deptRes, empRes] = await Promise.all([
        fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!deptRes.ok || !empRes.ok) {
        throw new Error('Failed to retrieve corporate department structures');
      }

      const deptData = await deptRes.json();
      const empData = await empRes.json();

      setDepartments(deptData);
      setEmployees(empData);
    } catch (err: any) {
      setError(err.message || 'Failed loading departments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddForm = () => {
    setIsEditMode(false);
    setEditingId(null);
    setName('');
    setManagerId('');
    setBudget('');
    setLocation('');
    setDescription('');
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (dept: Department) => {
    setIsEditMode(true);
    setEditingId(dept.id);
    setName(dept.name);
    setManagerId(dept.managerId || '');
    setBudget(dept.budget.toString());
    setLocation(dept.location);
    setDescription(dept.description);
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deleting this department will reallocate all affiliated employees to remaining department groups. Confirm to proceed?')) {
      return;
    }

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Could not delete department.');
      }

      setDepartments(departments.filter(d => d.id !== id));
      onRefreshReports();
      // Fetch fresh data for employees' reassignment representation
      fetchData();
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
      managerId: managerId || null,
      budget: Number(budget),
      location,
      description
    };

    const url = isEditMode ? `/api/departments/${editingId}` : '/api/departments';
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

      setFormSuccess(isEditMode ? 'Department modified!' : 'Department structured and listed!');
      
      // Refresh calculations
      fetchData();
      onRefreshReports();

      setTimeout(() => {
        setIsFormOpen(false);
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" id="dept-loading">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-3"></div>
        <p className="text-gray-500 font-medium font-sans">Compiling department budgets and layouts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans" id="department-manager-root">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm animate-fadeIn">
        <div>
          <h1 className="text-lg font-bold text-gray-950">Corporate Divisions & Departments</h1>
          <p className="text-xs text-gray-400">Deploy budget allocations and map leadership teams</p>
        </div>
        
        {role === 'Admin' && (
          <button
            onClick={handleOpenAddForm}
            id="create-dept-btn"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition self-start sm:self-auto shadow shadow-indigo-600/10"
          >
            <Plus className="h-4 w-4" /> Create Department
          </button>
        )}
      </div>

      {/* Main departments grid structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="dept-grid-content">
        {departments.map(dept => {
          const deptStaff = employees.filter(e => e.departmentId === dept.id);
          const isInspecting = viewDeptDetails === dept.id;

          return (
            <motion.div
              layout
              key={dept.id}
              className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all duration-200 relative ${
                isInspecting 
                  ? 'border-indigo-600 shadow-lg ring-1 ring-indigo-600/20 col-span-1 md:col-span-2' 
                  : 'border-gray-100 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-700 flex items-center justify-center rounded-lg font-bold">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-950 text-sm">{dept.name}</h3>
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">ID: {dept.id}</p>
                    </div>
                  </div>

                  {role === 'Admin' && (
                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-md border border-gray-100">
                      <button
                        onClick={() => handleOpenEditForm(dept)}
                        className="p-1 px-1.5 text-gray-500 hover:text-indigo-600 rounded hover:bg-white transition text-xs font-bold flex items-center gap-1"
                        title="Edit Division Details"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className="p-1 px-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-white transition text-xs font-bold"
                        title="Delete Department"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Body details */}
                <p className="text-xs text-gray-500 line-clamp-2 md:line-clamp-none min-h-[2.5rem]">
                  {dept.description || 'No corporate description details registered for this department.'}
                </p>

                {/* Division metrics structure */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Team Size
                    </span>
                    <p className="text-sm font-extrabold text-gray-950">{dept.headcount || deptStaff.length} Associates</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Annual Budget
                    </span>
                    <p className="text-sm font-extrabold text-gray-950 font-mono">${(dept.budget || 0).toLocaleString()}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-red-500" /> Location
                    </span>
                    <p className="text-xs font-bold text-gray-700 truncate">{dept.location || 'Distributed'}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-purple-600" /> Director/Manager
                    </span>
                    <p className="text-xs font-bold text-gray-700 truncate">{dept.managerName || 'Unassigned'}</p>
                  </div>
                </div>

                {/* Nested employee roll inspector */}
                {isInspecting && (
                  <div className="pt-4 border-t border-gray-100 animate-slideDown" id="dept-employees-roll">
                    <h4 className="text-xs font-extrabold text-gray-950 mb-2.5 flex items-center gap-1.5">
                      👥 Active Team Roll ({deptStaff.length})
                    </h4>
                    
                    {deptStaff.length === 0 ? (
                      <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg text-center">
                        No employees currently assigned to this department division.
                      </p>
                    ) : (
                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1.5 font-sans">
                        {deptStaff.map(emp => (
                          <div key={emp.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <div>
                              <span className="text-xs font-bold text-gray-950">{emp.name}</span>
                              <p className="text-[10px] text-gray-400">{emp.role} • {emp.email}</p>
                            </div>
                            <span className="text-[10px] font-bold font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                              ${emp.salary.toLocaleString()}/yr
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom footer toggle inspection */}
              <div className="pt-4 mt-4 border-t border-gray-50 flex items-center justify-between">
                <button
                  onClick={() => setViewDeptDetails(isInspecting ? null : dept.id)}
                  id="inspect-team-btn"
                  className={`flex items-center gap-1 font-extrabold text-xs transition select-none ${
                    isInspecting ? 'text-indigo-600 underline' : 'text-gray-500 hover:text-indigo-600'
                  }`}
                >
                  <Eye className="h-4 w-4" /> {isInspecting ? 'Fold Directory Roll' : 'Inspect Division Team'}
                </button>
                <ChevronRight className={`h-4 w-4 text-gray-300 transition-transform ${isInspecting ? 'rotate-90 text-indigo-500' : ''}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Corporate Division Setup Popup */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="division-setup-modal">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">
                {isEditMode ? 'Modify Department Information' : 'Deploy Corporate Division'}
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
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Corporate Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Division"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-gray-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3" id="dept-form-budget-location">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Annual Budget (USD)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 250000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="block w-full rounded border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Division Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Floor 2, East Corridor"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full rounded border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Designate Lead Director (Manager)</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="block w-full rounded border border-gray-200 p-2.5 outline-none bg-gray-50/50"
                >
                  <option value="">Let Lead Director remain Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Division/Dept Description</label>
                <textarea
                  placeholder="Define operations, KPIs, or division focus points..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full rounded border border-gray-200 p-2.5 outline-none focus:border-indigo-500 bg-gray-50/50"
                />
              </div>

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
                  {isEditMode ? 'Apply Updates' : 'Deploy Division'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
