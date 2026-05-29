"use client";

import { useState, useEffect } from 'react';
import { advanceService } from '../../../lib/services/advanceService';
import { formatINR } from '../../../lib/utils';
import { IndianRupee, Send, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function AdvanceDashboard() {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [repayment, setRepayment] = useState<'full_next_month' | 'emi'>('full_next_month');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  // Dummy employee ID for session mock — replace with active auth employee profile token context later
  const mockEmployeeId = "PASTE_AN_EXISTING_EMPLOYEE_UUID_HERE_FOR_TESTING"; 

  useEffect(() => {
    fetchMyRequests();
  }, []);

  async function fetchMyRequests() {
    try {
      const data = await advanceService.getRequests();
      setRequests(data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return alert("Please enter a valid amount");

    setLoading(true);
    try {
      await advanceService.createRequest({
        employee_id: mockEmployeeId,
        amount_requested: Number(amount),
        reason,
        repayment_type: repayment,
      });
      alert("Advance Request Submitted Successfully!");
      setAmount('');
      setReason('');
      fetchMyRequests();
    } catch (err: any) {
      alert(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-emerald-600" /> Request Salary Advance
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Amount Needed (₹)</label>
            <input 
              type="number" 
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Reason / Remarks</label>
            <input 
              type="text" 
              placeholder="e.g. Medical Emergency / Rent"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full mt-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Repayment Tenure</label>
            <select 
              value={repayment} 
              onChange={(e) => setRepayment(e.target.value as any)}
              className="w-full mt-1 p-3 border border-slate-200 rounded-xl bg-white focus:outline-none"
            >
              <option value="full_next_month">Deduct Full Amount Next Month</option>
              <option value="emi">Split into Monthly Installments (EMI)</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {loading ? "Submitting..." : "Send Request to Owner"}
          </button>
        </form>
      </div>

      {/* History Feed List View */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Your Advance History</h3>
        {requests.map((req) => (
          <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">{formatINR(req.amount_requested)}</p>
              <p className="text-xs text-slate-400">{req.reason}</p>
            </div>
            <div>
              {req.status === 'pending' && <span className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>}
              {req.status === 'approved' && <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</span>}
              {req.status === 'rejected' && <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}