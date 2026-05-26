"use client";

import { useEffect, useState } from 'react';
import { 
  Users, CheckCircle, Clock, FileCheck, MapPin, 
  UserCheck, Calendar, Wallet, FileText, ArrowUpRight,
  ThumbsUp, ThumbsDown, Receipt, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { formatINR } from '../../lib/utils';
import Link from 'next/link';

export default function SmartDashboardRouter() {
  const [role, setRole] = useState<'owner' | 'employee' | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');

  // --- STATE STACKS ---
  const [ownerMetrics, setOwnerMetrics] = useState({
    totalEmployees: 0, presentToday: 0, absentToday: 0, lateToday: 0, payrollCost: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);

  const [employeeMetrics, setEmployeeMetrics] = useState({
    name: '', presentCount: 0, absentCount: 0, lateCount: 0, leavesLeft: 12, lastCheckIn: '--:--'
  });
  const [myClaims, setMyClaims] = useState<any[]>([]);
  
  // Expense Form State
  const [claimTitle, setClaimTitle] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimCategory, setClaimCategory] = useState('Fuel/Travel');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // --- CORE DATA FETCH PIPELINE ---
  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: profile } = await supabase.from('profiles').select('full_name, role, company_id').eq('id', user.id).single();
    if (!profile) return;

    setRole(profile.role as 'owner' | 'employee');
    setCompanyId(profile.company_id || '');
    const todayString = new Date().toISOString().split('T')[0];

    if (profile.role === 'owner') {
      // --- ADMIN CORE LOADING ---
      const [empRes, attRes, leaveRes, payRes] = await Promise.all([
        supabase.from('employees').select('id, department', { count: 'exact' }).eq('company_id', profile.company_id).eq('status', 'Active'),
        supabase.from('attendance').select('status').eq('company_id', profile.company_id).eq('date', todayString),
        supabase.from('leave_requests').select('id, employee_id, leave_type, start_date, end_date, reason, profiles(full_name)').eq('company_id', profile.company_id).eq('status', 'Pending').limit(3),
        supabase.from('payroll').select('net_salary').eq('company_id', profile.company_id).like('month', `${new Date().getFullYear()}%`)
      ]);

      const attList = attRes.data || [];
      const costTotal = (payRes.data || []).reduce((acc, current) => acc + Number(current.net_salary), 0);
      const deptMap: { [key: string]: number } = {};
      (empRes.data || []).forEach(emp => { deptMap[emp.department] = (deptMap[emp.department] || 0) + 1; });

      setOwnerMetrics({
        totalEmployees: empRes.count || 0,
        presentToday: attList.filter(a => a.status === 'Present' || a.status === 'Late').length,
        absentToday: attList.filter(a => a.status === 'Absent').length,
        lateToday: attList.filter(a => a.status === 'Late').length,
        payrollCost: costTotal
      });
      setPendingLeaves(leaveRes.data || []);
      setChartData(Object.keys(deptMap).map(key => ({ name: key, Employees: deptMap[key] })));
    } else {
      // --- EMPLOYEE CORE LOADING ---
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [attRes, leaveRes, claimsRes] = await Promise.all([
        supabase.from('attendance').select('status, time_in').eq('employee_id', user.id).like('date', `${currentMonth}%`),
        supabase.from('leave_requests').select('status').eq('employee_id', user.id),
        supabase.from('reimbursements').select('*').eq('employee_id', user.id).order('created_at', { ascending: false }).limit(3)
      ]);

      const myAtt = attRes.data || [];
      setEmployeeMetrics({
        name: profile.full_name || 'Team Member',
        presentCount: myAtt.filter(a => a.status === 'Present').length,
        absentCount: myAtt.filter(a => a.status === 'Absent').length,
        lateCount: myAtt.filter(a => a.status === 'Late').length,
        leavesLeft: 12 - (leaveRes.data?.filter(l => l.status === 'Approved').length || 0),
        lastCheckIn: myAtt[0]?.time_in || '--:--'
      });
      setMyClaims(claimsRes.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // --- ACTION HANDLERS ---
  const handleLeaveDecision = async (id: string, action: 'Approved' | 'Rejected') => {
    await supabase.from('leave_requests').update({ status: action }).eq('id', id);
    loadDashboardData(); // Refresh metrics instantly
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimTitle || !claimAmount) return;
    setFormSubmitting(true);

    await supabase.from('reimbursements').insert({
      company_id: companyId,
      employee_id: userId,
      title: claimTitle,
      amount: parseFloat(claimAmount),
      category: claimCategory
    });

    setClaimTitle('');
    setClaimAmount('');
    setFormSubmitting(false);
    loadDashboardData(); // Refresh ledger log list
  };

  if (loading) return <div className="p-6 space-y-6 animate-pulse"><div className="h-8 bg-slate-200 rounded-xl w-1/4"></div><div className="grid grid-cols-4 gap-4"><div className="h-28 bg-slate-200 rounded-3xl col-span-4"></div></div></div>;

  // =========================================================================
  // VIEW RENDER A: COMPANY OWNER VIEW PORTAL
  // =========================================================================
  if (role === 'owner') {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Enterprise Control Deck</h2>
          <p className="text-xs text-slate-500 font-medium">Real-time macro workspace metrics</p>
        </div>

        {/* Core Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Total Active Staff', value: ownerMetrics.totalEmployees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { title: 'Present Today', value: ownerMetrics.presentToday, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { title: 'Late Arrivals', value: ownerMetrics.lateToday, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
            { title: 'Gross Payroll Liability', value: formatINR(ownerMetrics.payrollCost), icon: Wallet, color: 'text-teal-600', bg: 'bg-teal-50' },
          ].map((card, i) => (
            <div key={i} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center space-x-4">
              <div className={`p-3 rounded-2xl ${card.bg}`}><card.icon className={`w-5 h-5 ${card.color}`} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.title}</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* DYNAMIC LEAVE APPROVAL QUEUE INTERACTION CARD */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Rapid Leave Approval Queue</h3>
              <p className="text-xs text-slate-400 font-medium">Pending field teammate operational time-off requests</p>
            </div>
            <Link href="/dashboard/leave" className="text-xs font-bold text-teal-700 hover:underline">View All</Link>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl text-xs font-bold text-slate-400">
              🎉 No pending leave applications waiting for validation clearance!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((request) => (
                <div key={request.id} className="border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-50 transition-all">
                  <div>
                    <span className="text-xs font-black text-slate-900">{(request.profiles as any)?.full_name || 'Staff User'}</span>
                    <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase tracking-wider">{request.leave_type}</span>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Duration: {request.start_date} to {request.end_date}</p>
                    <p className="text-xs text-slate-400 italic mt-1">" {request.reason} "</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleLeaveDecision(request.id, 'Approved')} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 p-2 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all">
                      <ThumbsUp className="w-4 h-4" /> <span>Approve</span>
                    </button>
                    <button onClick={() => handleLeaveDecision(request.id, 'Rejected')} className="bg-red-50 text-red-700 hover:bg-red-100 p-2 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all">
                      <ThumbsDown className="w-4 h-4" /> <span>Deny</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart Metric Graph Display Wrapper */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Staff Distribution Matrix</h3>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.length ? chartData : [{name: 'Onboarding', Employees: 1}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="Employees" fill="#0f766e" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW RENDER B: INDIVIDUAL EMPLOYEE VIEW PORTAL
  // =========================================================================
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back, {employeeMetrics.name}</h2>
        <p className="text-xs text-slate-500 font-medium">Personal operation terminal node</p>
      </div>

      {/* Profile Overview Banner Block Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white p-5 rounded-3xl shadow-sm flex flex-col justify-between min-h-[140px]">
          <div>
            <span className="bg-teal-600/50 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">Shift Status</span>
            <p className="text-xl font-black mt-3">{employeeMetrics.lastCheckIn !== '--:--' ? '🟢 Present on Field' : '⚪ Not Clocked In'}</p>
          </div>
          <Link href="/dashboard/attendance/check-in" className="mt-4 bg-white text-teal-900 text-xs font-bold py-2 px-4 rounded-xl text-center shadow-sm block hover:bg-slate-100 transition-all">
            Open Attendance Log Stamp Terminal
          </Link>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col justify-between min-h-[140px]">
          <div>
            <span className="bg-slate-100 text-slate-600 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">Leave Balances</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{employeeMetrics.leavesLeft} Days Left</p>
          </div>
          <Link href="/dashboard/leave" className="text-xs font-bold text-teal-700 hover:underline flex items-center space-x-1">
            <span>File Leave Form</span> <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col justify-between min-h-[140px]">
          <div>
            <span className="bg-slate-100 text-slate-600 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">Current Month Logs</span>
            <div className="flex space-x-4 mt-3 text-xs font-bold text-slate-500">
              <div>🟢 Present: <b className="text-slate-900">{employeeMetrics.presentCount}</b></div>
              <div>🟡 Late: <b className="text-slate-900">{employeeMetrics.lateCount}</b></div>
              <div>🔴 Absent: <b className="text-slate-900">{employeeMetrics.absentCount}</b></div>
            </div>
          </div>
          <Link href="/dashboard/payroll" className="text-xs font-bold text-teal-700 hover:underline flex items-center space-x-1">
            <span>View Compensation Vault</span> <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* NEW SIDE-BY-SIDE SPLIT EXPENSE SYSTEM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SUBSECTION A: CLAIM DISPATCH SUBMISSION FORM */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1 flex items-center space-x-1">
            <Receipt className="w-4 h-4 text-teal-700" />
            <span>File Reimbursement Claim</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mb-4">Upload work expenses for executive approval</p>

          <form onSubmit={handleExpenseSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block mb-1">Expense Description</label>
              <input type="text" placeholder="e.g., Client Site Fuel Outlay" value={claimTitle} onChange={e => setClaimTitle(e.target.value)} required className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 bg-slate-50/50" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block mb-1">Amount (₹)</label>
                <input type="number" placeholder="450" value={claimAmount} onChange={e => setClaimAmount(e.target.value)} required className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 bg-slate-50/50" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block mb-1">Category Type</label>
                <select value={claimCategory} onChange={e => setClaimCategory(e.target.value)} className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 bg-slate-50">
                  <option value="Fuel/Travel">Fuel & Travel</option>
                  <option value="Client Meals">Client Meals</option>
                  <option value="Office Supplies">Supplies/Tools</option>
                  <option value="Emergency Misc">Other Misc</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={formSubmitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm mt-2">
              {formSubmitting ? 'Filing Audit Record...' : 'Submit Claim Voucher'}
            </button>
          </form>
        </div>

        {/* SUBSECTION B: CLAIM DISPATCH LOG HISTORICAL LEDGER */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">Reimbursement Ledger History</h3>
          <p className="text-[11px] text-slate-400 font-medium mb-4">Real-time status of your filed expense records</p>

          {myClaims.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-xs text-slate-400 font-bold">
              <AlertCircle className="w-5 h-5 text-slate-300 mb-1" />
              <span>No expense claims logged for this billing period yet.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {myClaims.map((claim) => (
                <div key={claim.id} className="p-3 border border-slate-50 bg-slate-50/40 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-all">
                  <div>
                    <p className="text-xs font-black text-slate-900">{claim.title}</p>
                    <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-slate-400 font-bold">
                      <span className="text-teal-700">{claim.category}</span>
                      <span>•</span>
                      <span>{new Date(claim.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">{formatINR(claim.amount)}</p>
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md inline-block mt-1 ${
                      claim.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                      claim.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}