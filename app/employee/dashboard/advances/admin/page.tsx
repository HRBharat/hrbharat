"use client";

import { useState, useEffect } from 'react';
import { advanceService } from '../../../../lib/services/advanceService';
import { IndianRupee, Check, X, User, Calendar, FileText } from 'lucide-react';

export default function AdminAdvanceApproval() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  async function loadPendingRequests() {
    try {
      setLoading(true);
      // Fetch only pending requests that need immediate action
      const data = await advanceService.getRequests('pending');
      setRequests(data || []);
    } catch (err) {
      console.error("Error loading advance requests:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    if (!confirm(`Are you sure you want to mark this request as ${action}?`)) return;

    try {
      await advanceService.updateStatus(id, action);
      alert(`Request successfully ${action}!`);
      loadPendingRequests(); // Refresh the list automatically
    } catch (err: any) {
      alert(err.message || "Failed to update request status");
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Advance Salary Approvals</h1>
          <p className="text-sm text-slate-500">Review and manage employee udhaar/advance requests</p>
        </div>
        <button 
          onClick={loadPendingRequests}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-3 py-2 rounded-lg transition"
        >
          Refresh Feed
        </button>
      </div>

      {loading ? (
        <p className="text-center text-sm text-slate-400 py-10">Loading active requests...</p>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-400 text-sm">No pending advance requests found!</p>
          <p className="text-xs text-slate-300 mt-1">Everything is up to date.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Header Info */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      {/* Note: Temporary fallback while working on direct profile joins */}
                      <p className="text-xs text-slate-400 font-mono">ID: {req.employee_id.substring(0,8)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 flex items-center justify-end">
                      ₹{Number(req.amount_requested).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-50 px-2 py-0.5 rounded">
                      {req.repayment_type === 'full_next_month' ? 'Next Month Ded.' : 'EMI Split'}
                    </span>
                  </div>
                </div>

                {/* Reason & Date Text block */}
                <div className="bg-slate-50 rounded-xl p-3 text-slate-600 text-sm flex items-start gap-2">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="italic">"{req.reason || 'No reason provided'}"</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                <button
                  onClick={() => handleAction(req.id, 'rejected')}
                  className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  onClick={() => handleAction(req.id, 'approved')}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}