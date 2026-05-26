"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Wallet, AlertTriangle, RefreshCw, Download, FileText, Send } from 'lucide-react';
import { formatINR } from '../../../lib/utils';
import { jsPDF } from 'jspdf';

export default function AdministrativePayrollEngine() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('HRBharat Workspace');
  const [currentMonth, setCurrentMonth] = useState('');
  const [payrollRoster, setPayrollRoster] = useState<any[]>([]);
  const [dbError, setDbError] = useState<string | null>(null); // Dynamic Error Diagnostic Node

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      setDbError(null);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      if (!profile?.company_id) return;
      
      const { data: company } = await supabase.from('companies').select('name').eq('id', profile.company_id).single();
      if (company?.name) setCompanyName(company.name);
      
      const dateObj = new Date();
      const billingPeriod = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      setCurrentMonth(billingPeriod);

      // Fetch from view with explicit client-side tracking error catches
      const { data: calculatedData, error: viewError } = await supabase
        .from('payroll_calculations')
        .select('*')
        .eq('company_id', profile.company_id);

      if (viewError) throw viewError;

      setPayrollRoster(calculatedData || []);
    } catch (err: any) {
      console.error("Database connection logs: ", err);
      setDbError(err.message || "An unexpected database synchronization failure occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const handleExportBankClearingSheet = () => {
    if (payrollRoster.length === 0) return;
    const headers = ["Beneficiary Name", "Account Number", "IFSC Code", "Net Payout Amount (INR)", "Transaction Narrative", "Corporate Email"];
    const csvContentRows = payrollRoster.map(w => [
      `"${w.full_name}"`, `"${w.account_number || ''}"`, `"${w.ifsc_code || ''}"`, Number(w.net_payout).toFixed(2), `"SALARY DISPATCH ${currentMonth}"`, `"${w.email}"`
    ]);
    const csvStringData = [headers.join(","), ...csvContentRows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvStringData], { type: "text/csv;charset=utf-8;" });
    const blobUrl = URL.createObjectURL(blob);
    const hiddenLinkNode = document.createElement("a");
    hiddenLinkNode.setAttribute("href", blobUrl);
    hiddenLinkNode.setAttribute("download", `HRBharat_Bank_Payout_${currentMonth}.csv`);
    document.body.appendChild(hiddenLinkNode);
    hiddenLinkNode.click();
    document.body.removeChild(hiddenLinkNode);
  };

  const handleDownloadPDFPayslip = (worker: any) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(15, 23, 42);
    doc.text(companyName.toUpperCase(), 14, 25);
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
    doc.text(`MONTHLY SALARY DISBURSEMENT SLIP • STATEMENT PERIOD: ${currentMonth}`, 14, 32);
    doc.setDrawColor(226, 232, 240); doc.line(14, 38, 196, 38);
    
    doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE METADATA LEDGER", 14, 48);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`Employee Code: ${worker.employee_code || 'N/A'}`, 14, 56);
    doc.text(`Full Identity: ${worker.full_name}`, 14, 62);
    doc.text(`Department: ${worker.department} (${worker.designation || 'Staff'})`, 14, 68);
    
    doc.setFont("helvetica", "bold"); doc.text("EARNINGS & ADJUSTMENT MATRIX", 14, 88);
    doc.setFont("helvetica", "normal"); doc.line(14, 102, 196, 102);
    doc.text("Base Core Monthly Salary Structure", 14, 110);
    doc.text(`Rs. ${Number(worker.monthly_salary).toFixed(2)}`, 150, 110);
    
    doc.setTextColor(220, 38, 38);
    doc.text(`Unexcused Absence Penalty Cuts (${worker.unexcused_absences} Days)`, 14, 118);
    doc.text(`- Rs. ${Number(worker.total_deductions).toFixed(2)}`, 150, 118);
    
    doc.setTextColor(22, 163, 74);
    doc.text("Approved Reimbursement Claims / Expenses", 14, 126);
    doc.text(`+ Rs. ${Number(worker.total_reimbursements).toFixed(2)}`, 150, 126);
    
    doc.line(14, 132, 196, 132); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold");
    doc.text("NET PAYABLE AMOUNT CLOSURE", 14, 140);
    doc.text(`Rs. ${Number(worker.net_payout).toFixed(2)}`, 150, 140);
    
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(148, 163, 184);
    doc.text(`Settlement Destination Account: ${worker.account_number || '---'} • IFSC Code: ${worker.ifsc_code || '---'}`, 14, 155);
    doc.save(`Payslip_${worker.full_name}_${currentMonth}.pdf`);
  };

  const handleShareViaWhatsApp = (worker: any) => {
    const defaultContactPhone = worker.phone_number ? worker.phone_number.replace(/\D/g, '') : '';
    const messageTemplate = `*SALARY DISPATCH DISCLOSURE* 🔔%0A%0AHello *${worker.full_name}*,%0AYour monthly salary payout statement for the billing cycle *${currentMonth}* has been processed by *${companyName}*.%0A%0A*FINANCIAL RUN SUMMARY:*%0A▫️ Base Salary: ₹${worker.monthly_salary}%0A▫️ Absence Penalty Cuts: -₹${Number(worker.total_deductions).toFixed(2)} (${worker.unexcused_absences} days absent)%0A▫️ Approved Expense Reimbursements: +₹${Number(worker.total_reimbursements).toFixed(2)}%0A🚀 *Net Final Credit: ₹${Number(worker.net_payout).toFixed(2)}*%0A%0AYour downloadable ledger statement has been added to your worker dashboard panel layout. Thank you!`;
    window.open(`https://api.whatsapp.com/send?phone=91${defaultContactPhone}&text=${messageTemplate}`, '_blank');
  };

  if (loading) return <div className="p-6 text-xs text-slate-400 font-bold animate-pulse">STREAMLINING REAL-TIME PAYROLL RECONCILIATION MATRICES...</div>;

  // --- RENDERS THE SECURITY EXCEPTION ERROR TERMINAL INSTANTLY ---
  if (dbError) return (
    <div className="p-6 max-w-xl mx-auto mt-10 bg-red-50 border border-red-200 rounded-3xl text-center shadow-xs">
      <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
      <h3 className="text-xs font-black text-red-900 uppercase tracking-wide">Database Pipeline Blocked</h3>
      <p className="text-xs text-red-700 font-mono mt-2 bg-white p-4 rounded-2xl border border-red-100 text-left overflow-x-auto whitespace-pre-wrap shadow-inner">{dbError}</p>
      <button onClick={fetchPayrollData} className="mt-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-xs">
        Retry Sync Connection
      </button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Automated Payroll Core</h2>
          <p className="text-xs text-slate-500 font-medium">Workspace: <b className="text-slate-800 font-bold">{companyName}</b> • Cycle: <b className="text-teal-700 font-mono font-bold">{currentMonth}</b></p>
        </div>
        <button onClick={handleExportBankClearingSheet} disabled={payrollRoster.length === 0} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all">
          <Download className="w-4 h-4" /> <span>Download Bulk Bank Sheet</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Automated Calculation Sheet</h3>
          <button onClick={fetchPayrollData} className="text-slate-400 hover:text-slate-600 transition-all"><RefreshCw className="w-4 h-4" /></button>
        </div>

        {payrollRoster.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold flex flex-col items-center justify-center space-y-1">
            <AlertTriangle className="w-5 h-5 text-slate-300" /> <span>No active employee files detected in your database tracking matrix.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Staff Personnel</th>
                  <th className="py-3 px-4">Base Payout</th>
                  <th className="py-3 px-4">Absence Cuts</th>
                  <th className="py-3 px-4">Approved Claims</th>
                  <th className="py-3 px-4">Net Final Payout</th>
                  <th className="py-3 px-4 text-right">Statement Deliveries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {payrollRoster.map((worker) => (
                  <tr key={worker.employee_id} className="hover:bg-slate-50/50 transition-all font-medium">
                    <td className="py-3.5 px-4">
                      <p className="font-black text-slate-900">{worker.full_name}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{worker.employee_code || 'STAFF NODE'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatINR(worker.monthly_salary)}</td>
                    <td className="py-3.5 px-4 text-red-600 font-semibold">
                      -{formatINR(worker.total_deductions)} <span className="text-[9px] text-slate-400 font-medium font-mono">({worker.unexcused_absences}d)</span>
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 font-semibold">+{formatINR(worker.total_reimbursements)}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">{formatINR(worker.net_payout)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => handleDownloadPDFPayslip(worker)} className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-all flex items-center space-x-1 border border-slate-200 bg-white shadow-xs"><FileText className="w-3.5 h-3.5" /><span className="text-[10px] font-bold px-0.5">PDF</span></button>
                        <button onClick={() => handleShareViaWhatsApp(worker)} className="text-emerald-600 hover:text-white p-1.5 rounded-lg hover:bg-emerald-600 border border-emerald-200 bg-emerald-50/50 transition-all flex items-center space-x-1 shadow-xs"><Send className="w-3.5 h-3.5" /><span className="text-[10px] font-bold px-0.5">Share</span></button>
                      </div>
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