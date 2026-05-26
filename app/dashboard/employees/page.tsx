"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { formatINR } from '../../../lib/utils';
import Link from 'next/link';
import { UserPlus, UserCheck, Trash2, Edit, X, Eye, IndianRupee } from 'lucide-react';

export default function EmployeesDashboard() {
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
      alert("Failed to load employee list.");
    } finally {
      setLoading(false);
    }
  }

  // 2. Write a new employee record to the database
  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !role || !baseSalary) return alert("Please fill out all fields");

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([
          {
            name,
            role,
            base_salary: Number(baseSalary),
          }
        ])
        .select();

      if (error) throw error;

      alert(`${name} successfully registered in staff log!`);
      setName('');
      setRole('');
      setBaseSalary('');
      setShowAddDrawer(false);
      fetchEmployees(); // Refresh list immediately
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
      setEditingEmployee(null); // Close modal
      fetchEmployees(); // Refresh roster layout instantly
    } catch (err: any) {
      alert(err.message || "Failed to update employee details");
    }
  }

  // 4. Wipe an employee profile cleanly out of database systems
  async function handleDeleteEmployee(id: string, employeeName: string) {
    if (!confirm(`Are you sure you want to completely remove ${employeeName} from HRBharat? This actions deletes all historical records.`)) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert("Worker deleted from systems.");
      fetchEmployees(); // Refresh roster layout
    } catch (err: any) {
      alert(err.message || "Failed to execute worker termination request.");
    }
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Staff Management</h1>
          <p className="text-sm text-slate-500">Onboard, track, modify, or terminate employee record structures</p>
        </div>
        <button
          onClick={() => setShowAddDrawer(!showAddDrawer)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" /> Onboard New Worker
        </button>
      </div>

      {/* Onboarding Input Accordion Drawer */}
      {showAddDrawer && (
        <form onSubmit={handleAddEmployee} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 grid gap-4 sm:grid-cols-3 items-end transition-all">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g., Rajesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Designation / Role</label>
            <input 
              type="text" 
              placeholder="e.g., Delivery Executive"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Base Pay (₹)</label>
              <input 
                type="number" 
                placeholder="18000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center shadow-sm"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Roster View Feed */}
      {loading ? (
        <p className="text-center text-slate-400 font-medium py-12 text-sm">Accessing active workforce matrix...</p>
      ) : employees.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl">
          <p className="text-slate-400 text-sm font-semibold">Your worker directory is currently completely empty!</p>
          <p className="text-xs text-slate-300 mt-1">Click the top button to onboard your first team member.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee Details</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4">Base Salary</th>
                  <th className="px-6 py-4 text-right">Actions Dashboard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                          {(emp.name || "Employee").charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {emp.id.substring(0,8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-bold">
                      {formatINR(emp.base_salary)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link 
                          href={`/dashboard/employees/${emp.id}`}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setEditName(emp.name || '');
                            setEditRole(emp.role || '');
                            setEditBaseSalary(emp.base_salary || 0);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Profile Data"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Terminate Account Record"
                        >
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

      {/* Pop-Up Modal Layout Overlay for Real-Time Changes */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="font-bold text-lg text-slate-800">Modify Staff Profile</h3>
              </div>
              <button 
                onClick={() => setEditingEmployee(null)} 
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation / Role</label>
                <input 
                  type="text" 
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base Monthly Salary (₹)</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <input 
                    type="number" 
                    value={editBaseSalary}
                    onChange={(e) => setEditBaseSalary(e.target.value)}
                    className="w-full pl-9 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
                <button 
                  type="button" 
                  onClick={() => setEditingEmployee(null)}
                  className="py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}