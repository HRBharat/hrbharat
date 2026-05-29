
"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '../../../../lib/supabase';
import { formatINR } from '../../../../lib/utils';
import { ArrowLeft, User, Phone, Briefcase, Calendar, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecord() {
      const { data } = await supabase.from('employees').select('*').eq('id', resolvedParams.id).single();
      setEmployee(data);
      setLoading(false);
    }
    fetchRecord();
  }, [resolvedParams.id]);

  if (loading) return <div className="p-8 text-center text-xs animate-pulse font-bold tracking-widest text-slate-400 uppercase">Accessing record indexes...</div>;
  if (!employee) return <div className="p-8 text-center text-xs font-bold text-red-500 uppercase">Target schema structural data not found contextually</div>;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/employees" className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-all space-x-1.5">
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Control Matrix</span>
      </Link>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="bg-teal-50 p-4 rounded-2xl border border-teal-200">
            <User className="w-8 h-8 text-teal-700" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{employee.full_name}</h2>
            <div className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md inline-block mt-1 font-bold">{employee.employee_code}</div>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl w-full md:w-auto text-left md:text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Allocated Wage Structure</span>
          <span className="text-2xl font-black text-teal-700">{formatINR(employee.monthly_salary)}</span>
          <span className="text-slate-400 text-xs font-medium"> / Month</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Structural Alignment Metrics</h3>
          <div className="flex items-center space-x-3 text-sm">
            <Briefcase className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Operational Title Allocation</p>
              <p className="font-bold text-slate-800">{employee.designation} ({employee.department})</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Registry Onboarding Datetime</p>
              <p className="font-bold text-slate-800">{new Date(employee.joining_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <Phone className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Primary Contact Route</p>
              <p className="font-bold text-slate-800">+91 {employee.phone_number}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Banking Settlement Gateway Configuration</h3>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Virtual Payment Address (UPI)</p>
            <p className="font-mono text-sm bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-slate-800 mt-1 font-bold">
              {employee.upi_id || 'unconfigured_gateway_route@upi'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase block">Account Sequence</span>
              <span className="font-mono text-sm text-slate-800 block mt-0.5 font-bold">************</span>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase block">IFSC Identifier Network</span>
              <span className="font-mono text-sm text-slate-800 block mt-0.5 font-bold">SBIN0001923</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}