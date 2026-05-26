"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { IndianRupee, Plus, AlertCircle, CheckCircle, Wallet } from 'lucide-react';

export default function AdvanceSalaryManagementEngine() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [amount, setAmount] = useState('');
  const [deduction, setDeduction] = useState('');

  const loadAdvanceSystemState = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single();
    if (!profile?.company_id) return;

    const { data: empList } = await supabase.from('employees').select('id, full_name, employee_code').eq('company_id', profile.company_id).eq('status', 'Active');
    const { data: advList } = await supabase.from('salary_advances').select('*, employees(full_name, employee_code)').eq('company_id', profile.company_id).order('created_at', { ascending: false });

    setEmployees(empList || []);
    setAdvances(advList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAdvanceSystemState();
  }, []);

  const handleIssueAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !amount || !deduction) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user?.id).single();

    await supabase.from('salary_advances').insert({
      employee_id: selectedEmp,
      company_id: profile?.company_id,
      advance_amount: parseFloat(amount),
      repayment_monthly_deduction: parseFloat(deduction),
      remaining_balance: parseFloat(amount),
      status: 'Active'
    });

    setSelectedEmp(''); setAmount(''); setDeduction('');
    loadAdvanceSystemState();
  };

  if (loading) return <div className="p-6 text-xs text-slate-400 font-bold animate-pulse">COMPILING SALARY ADVANCE RECORDS LEDGERS...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Salary Advance Ledger</h2>
        <p className="text-xs text-slate-500 font-medium">Issue cash balances and track automated payroll recovery installments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LOG ADVANCE ENTRY FORM */}
        <form onSubmit={handleIssueAdvance} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center space-x-1">
            <Wallet className="w-4 h-4 text-slate-600" />
            <span>Issue New Advance</span>
          </h3>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Select Employee</label>
            <select required value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none">
              <option value="">-- Choose Staff Teammate --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Advance Principal Amount (₹)</label>
            <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="Total cash requested..." className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none" />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Monthly Payroll Recovery Deduction (₹)</label>
            <input type="number" required value={deduction} onChange={e => setDeduction(e.target.value)} placeholder="Deduction cut per month..." className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none" />
          </div>

          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1">
            <Plus className="w-4 h-4" />
            <span>Approve & Issue Cash</span>
          </button>
        </form>

        {/* ACTIVE ADVANCES SUMMARY AUDIT LOG */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider">Active Advances Ledger History</h3>
          </div>
          {advances.length === 0 ? (
            <p className="text-xs text-slate-400 font-bold text-center py-12">No advance transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-medium">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Issued Principal</th>
                    <th className="py-3 px-4">Monthly Installment</th>
                    <th className="py-3 px-4">Remaining Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {advances.map(adv => (
                    <tr key={adv.id} className="hover:bg-slate-50/40 transition-all">
                      <td className="py-3 px-4">
                        <p className="font-black text-slate-900">{adv.employees?.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-bold">{adv.employees?.employee_code}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">₹{adv.advance_amount}</td>
                      <td className="py-3 px-4 text-red-600 font-black">₹{adv.repayment_monthly_deduction}/mo</td>
                      <td className="py-3 px-4 text-slate-900 font-black">₹{adv.remaining_balance}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${adv.status === 'Active' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {adv.status}
                        </span>
                      </td>
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