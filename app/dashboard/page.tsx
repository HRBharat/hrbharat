"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatINR } from '../../lib/utils';
import Link from 'next/link';
import { UserPlus, Trash2, Edit, X, Eye, IndianRupee, Users, TrendingUp, LayoutDashboard, Building2, Calendar, Phone, Mail, FileSpreadsheet } from 'lucide-react';

export default function AdminMainDashboard() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  // --- NEW ADVANCED ONBOARDING FORM STATES ---
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0]);
  const [branchName, setBranchName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // "Edit Employee" Modal States
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editBaseSalary, setEditBaseSalary] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

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

  // Handle comprehensive onboarding save
  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !role || !baseSalary || !email) return alert("Name, Designation, Salary, and Login Email are required fields!");

    try {
      const { error } = await supabase
        .from('employees')
        .insert([{ 
          name, 
          role, 
          base_salary: Number(baseSalary),
          email,
          mobile_number: mobileNumber,
          emp_code: empCode,
          date_of_joining: dateOfJoining,
          branch_name: branchName,
          bank_name: bankName,
          account_number: accountNumber,
          ifsc_code: ifscCode
        }]);

      if (error) throw error;

      alert(`${name} successfully registered with Login Access ID!`);
      
      // Reset form states cleanly
      setName(''); setRole(''); setBaseSalary(''); setEmail(''); setMobileNumber('');
      setEmpCode(''); setBranchName(''); setBankName(''); setAccountNumber(''); setIfscCode('');
      setShowAddDrawer(false);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Failed to onboard new worker");
    }
  }

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
          {showAddDrawer ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showAddDrawer ? "Close Form Panel" : "Onboard New Worker"}
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
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><IndianRupee className="w-5 h-5" /></div>
        </div>
      </div>

      {/* COMPREHENSIVE ONBOARDING FORM EXPANSION */}
      {showAddDrawer && (
        <form onSubmit={handleAddEmployee} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6 transition-all">
          
          {/* Section 1: Core Company Credentials */}
          <div>
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 border-b border-slate-200 pb-1">1. Workplace & Login Credentials</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Employee Code</label>
                <input type="text" placeholder="e.g. HB-104" value={empCode} onChange={(e) => setEmpCode(e.target.value)} className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Login Email ID *</label>
                <input type="email" placeholder="rajesh@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none" required />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Assigned Branch Location</label>
                <input type="text" placeholder="e.g. Okhla Phase-3" value={branchName} onChange={(e) => setBranchName(e.target.value)} className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Date of Joining</label>
                <input type="date" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Section 2: Personal Profile & Pay */}
          <div>
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 border-b border-slate-200 pb-1">2. Employee Profile & Compensation</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Full Name *</label>
                <input type="text" placeholder="Rajesh Kumar" value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none" required />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Mobile / WhatsApp Number</label>
                <input type="text" placeholder="98765xxxxx" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Designation / Role *</label>
                <input type="text" placeholder="e.g. Supervisor" value={role} onChange={(e) => setRole(e.target.value)} className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none" required />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Monthly Base Pay (₹) *</label>
                <input type="number" placeholder="22000" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none" required />
              </div>
            </div>
          </div>

          {/* Section 3: Bank Account Matrix */}
          <div>
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 border-b border-slate-200 pb-1">3. Bank Settlement Details (For Salary Payouts)</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Bank Name</label>
                <input type="text" placeholder="e.g. HDFC Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Account Number</label>
                <input type="text" placeholder="50100xxxxxxxx" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">IFSC Code</label>
                <input type="text" placeholder="HDFC000xxxx" value={ifscCode} onChange={(e) => setテックIFSCCode(e.target.value)} className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button type="button" onClick={() => setShowAddDrawer(false)} className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-semibold text-slate-700">Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm">Save & Onboard Employee</button>
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
                    <th className="px-6 py-4">Designation & Branch</th>
                    <th className="px-6 py-4">Contact Info</th>
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
                            {(emp.name || "Employee").charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              {emp.name || "Unnamed Employee"} 
                              {emp.emp_code && <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">#{emp.emp_code}</span>}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">DOJ: {emp.date_of_joining || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-800">{emp.role || "Not Specified"}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" /> {emp.branch_name || "Main Office"}</p>
                      </td>
                      <td className="px-6 py-4 space-y-0.5 text-xs text-slate-500">
                        {emp.email && <p className="flex items-center gap-1 text-slate-700"><Mail className="w-3 h-3 text-slate-400" /> {emp.email}</p>}
                        {emp.mobile_number && <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {emp.mobile_number}</p>}
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