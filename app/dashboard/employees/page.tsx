"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Users, Shield, Building, Clock, Briefcase } from 'lucide-react';

export default function AdministrativeEmployeeRosterEngine() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Roster arrays state hooks
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);

  // Form input field state parameters
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [department, setDepartment] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  
  // High-value operational parameters
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedShift, setSelectedShift] = useState('');

  const loadRosterSystemState = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    if (!profile?.company_id) return;

    // 1. Fetch active company staff profile parameters
    const { data: staffData } = await supabase
      .from('employees')
      .select('*, branches(branch_name), shifts(name)')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    // 2. Fetch multi-location branches configuration deck
    const { data: branchData } = await supabase
      .from('branches')
      .select('id, branch_name')
      .eq('company_id', profile.company_id);

    // 3. Fetch shifts configuration matrix tables
    const { data: shiftData } = await supabase
      .from('shifts')
      .select('id, name, start_time')
      .eq('company_id', profile.company_id);

    setEmployees(staffData || []);
    setBranches(branchData || []);
    setShifts(shiftData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadRosterSystemState();
  }, []);

  const handleOnboardEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !empCode || !monthlySalary || !selectedShift) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single();

    // Log the unified operational metadata directly into the employee baseline row
    const { error } = await supabase.from('employees').insert({
      company_id: profile?.company_id,
      full_name: fullName,
      email: email.toLowerCase().trim(),
      employee_code: empCode.toUpperCase().trim(),
      department,
      monthly_salary: parseFloat(monthlySalary),
      account_number: accountNumber || null,
      ifsc_code: ifscCode || null,
      branch_id: selectedBranch || null, // Linked Branch Node Link
      shift_id: selectedShift,           // Linked Shift Control parameters
      status: 'Active'
    });

    if (error) {
      alert(`Onboarding validation flag raised: ${error.message}`);
    } else {
      // Clear intake form fields cleanly
      setFullName(''); setEmail(''); setEmpCode(''); setDepartment(''); setMonthlySalary('');
      setAccountNumber(''); setIfscCode(''); setSelectedBranch(''); setSelectedShift('');
      loadRosterSystemState(); // Instant live update refresh
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-6 text-xs text-slate-400 font-bold animate-pulse">SYNCHRONIZING REPOSITORY ROSTER NODES...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Staff Onboarding & Roster</h2>
        <p className="text-xs text-slate-500 font-medium">Add new team personnel, assign operational shift parameters, and deploy branch geofences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: STAFF REGISTRATION DRAWER */}
        <form onSubmit={handleOnboardEmployee} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center space-x-1.5 border-b border-slate-50 pb-2">
            <Plus className="w-4 h-4 text-slate-700" />
            <span>Onboard Staff Personnel</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Full Name</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g., Rajesh Kumar" className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none" />
            </div>

            <div>
              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Corporate Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="rajesh@company.com" className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Employee ID Code</label>
                <input type="text" required value={empCode} onChange={e => setEmpCode(e.target.value)} placeholder="HRB-102" className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none uppercase font-mono" />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Department</label>
                <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g., Operations" className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Monthly Base Salary (₹)</label>
                <input type="number" required value={monthlySalary} onChange={e => setMonthlySalary(e.target.value)} placeholder="25000" className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none" />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Bank IFSC Code</label>
                <input type="text" value={ifscCode} onChange={e => setIfscCode(e.target.value)} placeholder="HDFC0001234" className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none uppercase font-mono" />
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Bank Account Routing Number</label>
              <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="50100249581024" className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none font-mono" />
            </div>

            {/* --- CORE OPERATIONAL INTAKE ROUTING DOWNSTREAM OVERLAYS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-50">
              <div>
                <label className="text-[9px] uppercase font-bold text-teal-800 block mb-0.5 flex items-center space-x-0.5">
                  <Building className="w-3 h-3" /> <span>Work Station Branch</span>
                </label>
                <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="w-full text-xs font-bold px-2 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none">
                  <option value="">HQ Main Office</option>
                  {branches.map(br => (
                    <option key={br.id} value={br.id}>{br.branch_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-indigo-800 block mb-0.5 flex items-center space-x-0.5">
                  <Clock className="w-3 h-3" /> <span>Assigned Shift</span>
                </label>
                <select required value={selectedShift} onChange={e => setSelectedShift(e.target.value)} className="w-full text-xs font-bold px-2 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none">
                  <option value="">-- Choose Shift --</option>
                  {shifts.map(sf => (
                    <option key={sf.id} value={sf.id}>{sf.name}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          <button type="submit" disabled={submitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm">
            {submitting ? 'Registering Worker Record...' : 'Complete Staff Onboarding'}
          </button>
        </form>

        {/* RIGHT COLUMN: ACTIVE STAFF MATRIX RECORD TABLE FEED */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center space-x-1">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Active Employee Master Roster</span>
            </h3>
          </div>

          {employees.length === 0 ? (
            <div className="p-12 text-center text-xs font-medium text-slate-400">No active workers registered on the roster file yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Personnel Profile</th>
                    <th className="py-3 px-4">Identification</th>
                    <th className="py-3 px-4">Assigned Location</th>
                    <th className="py-3 px-4">Roster Shift</th>
                    <th className="py-3 px-4 text-right">Base Wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="py-3.5 px-4">
                        <p className="font-black text-slate-900">{emp.full_name}</p>
                        <p className="text-[10px] text-slate-400">{emp.email}</p>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <span className="bg-slate-100 text-slate-700 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md">{emp.employee_code}</span>
                        <p className="text-[10px] text-slate-400 font-semibold">{emp.department || 'General Operations'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">
                        <span className="inline-flex items-center space-x-1 text-slate-700 bg-slate-50 border border-slate-100 rounded-md px-2 py-0.5 text-[10px]">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{emp.branches?.branch_name || 'HQ Main Office'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1 text-teal-800 bg-teal-50 border border-teal-100/60 rounded-md px-2 py-0.5 text-[10px] font-black">
                          <Clock className="w-3 h-3 text-teal-600" />
                          <span>{emp.shifts?.name || 'General Shift'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">₹{emp.monthly_salary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}