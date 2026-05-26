"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatINR } from '../../lib/utils';
import Link from 'next/link';
import { UserPlus, Trash2, Edit, X, Eye, IndianRupee, Users, TrendingUp, LayoutDashboard } from 'lucide-react';

export default function AdminMainDashboard() {
  // Primary tracking arrays
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // "Add Employee" Form States
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  // "Edit Employee" Modal States
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editBaseSalary, setEditBaseSalary] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  // 1. Read entire workforce directory from Supabase
  async function fetchEmployees() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      console.error("Error loading employee roster:", err);
    } finally {
      setLoading(false);
    }
  }

  // 2. Write a new employee record to the database
  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !role || !baseSalary) return alert("Please fill out all fields");

    try {
      const { error } = await supabase
        .from('employees')
        .insert([{ name, role, base_salary: Number(baseSalary) }]);

      if (error) throw error;

      alert(`${name} successfully registered!`);
      setName(''); setRole(''); setBaseSalary('');
      setShowAddDrawer(false);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Failed to onboard new worker");
    }
  }

  // 3. Update an existing employee profile in Supabase
  async function handleUpdateEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          name: editName,
          role: editRole,
          base_salary: Number(editBaseSalary),
        })
        .eq('id', editingEmployee.id);

      if (error) throw error;

      alert("Employee records updated successfully!");
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Failed to update employee details");
    }
  }

  // 4. Wipe an employee profile cleanly out of database systems
  async function handleDeleteEmployee(id: string, employeeName: string) {
    if (!confirm(`Are you sure you want to completely remove ${employeeName}?`)) return;

    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      alert("Worker deleted from systems.");
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Failed to execute worker deletion request.");
    }
  }

  // Calculate quick high-level business stats
  const totalStaff = employees.length;
  const totalMonthlyPayroll = employees.reduce((sum, emp) => sum + (Number(emp.base_salary) || 0), 0);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner Branding Layer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-slate-800" /> HRBharat Admin Control Center
          </h1>
          <p className="text-sm text-slate-500">Real-time overview of your business operations, staff metrics, and finances</p>
        </div>
        <button
          onClick={() => setShowAddDrawer(!showAddDrawer)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" /> Quick Onboard Staff
        </button>
      </div>

      {/* Metrics Row Layer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Headcount</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalStaff} Workers</h3>
          </div>
          <div className="p-3 bg-slate-50 text-slate-700 rounded-xl"><Users className="w-5 h-5" /></div>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Monthly Payroll Cost</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatINR(totalMonthlyPayroll)}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Onboarding Form Drawer Accordion */}
      {showAddDrawer && (
        <form onSubmit={handleAddEmployee} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 grid gap-4 sm:grid-cols-3 items-end transition-all">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
            <input 
              type="text" placeholder="e.g., Rajesh Kumar" value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900" required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Designation / Role</label>
            <input 
              type="text" placeholder="e.g., Warehouse Manager" value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900" required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Base Pay (₹)</label>
              <input 
                type="number" placeholder="25000" value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900" required
              />
            </div>
            <button type="submit" className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center shadow-sm">
              Save
            </button>
          </div>
        </form>
      )}

      {/* Main Staff Roster Control Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Staff Management Directory</h2>
        {loading ? (
          <p className="text-slate-400 text-sm py-6">Syncing database changes...</p>
        ) : employees.length === 0 ? (
          <p className="text-slate-400 text-sm bg-slate-50 border p-6 text-center rounded-2xl">No employees onboarded to display.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Employee Details</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4">Base Salary</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                            {emp?.name ? emp.name.charAt(0) : "E"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{emp.name || "Unnamed Employee"}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {emp.id.substring(0,8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold">{emp.role || "Not Specified"}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-bold">{formatINR(emp.base_salary)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/dashboard/employees/${emp.id}`} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition" title="View Details">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setEditingEmployee(emp);
                              setEditName(emp.name || '');
                              setEditRole(emp.role || '');
                              setEditBaseSalary(emp.base_salary || 0);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteEmployee(emp.id, emp.name || 'this employee')} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Remove Worker">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pop-Up Edit Overlay Modal Layer */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="font-bold text-lg text-slate-800">Modify Staff Profile</h3>
              <button onClick={() => setEditingEmployee(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation / Role</label>
                <input type="text" value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base Monthly Salary (₹)</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><IndianRupee className="w-4 h-4" /></div>
                  <input type="number" value={editBaseSalary} onChange={(e) => setEditBaseSalary(e.target.value)} className="w-full pl-9 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
                <button type="button" onClick={() => setEditingEmployee(null)} className="py-3 bg-slate-50 rounded-xl text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="py-3 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}