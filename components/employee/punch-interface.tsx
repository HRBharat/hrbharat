'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PunchProps {
  employeeId: string;
  companyId: string;
  initialAttendance: any;
}

export default function AttendancePunchInterface({ employeeId, companyId, initialAttendance }: PunchProps) {
  const supabase = createClient();
  const [attendance, setAttendance] = useState(initialAttendance);
  const [syncing, setSyncing] = useState(false);

  const triggerClockOperation = async () => {
    setSyncing(true);
    const rightNow = new Date();
    const dateString = rightNow.toISOString().split('T')[0];

    // Read real-time native geospatial sensor data matrices directly
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      if (!attendance) {
        // Run check-in insertion routine safely
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            company_id: companyId,
            employee_id: employeeId,
            date: dateString,
            check_in: rightNow.toISOString(),
            check_in_lat: latitude,
            check_in_lng: longitude,
            status: 'Present'
          })
          .select()
          .single();

        if (!error) setAttendance(data);
      } else if (!attendance.check_out) {
        // Run check-out adjustment routine safely
        const { data, error } = await supabase
          .from('attendance')
          .update({
            check_out: rightNow.toISOString(),
            check_out_lat: latitude,
            check_out_lng: longitude,
          })
          .eq('id', attendance.id)
          .select()
          .single();

        if (!error) setAttendance(data);
      }
      setSyncing(false);
    }, () => {
      alert('Geospatial access coordinates required for verification.');
      setSyncing(false);
    });
  };

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center space-y-4">
      <div>
        <h4 className="text-sm font-bold text-slate-800">Operational Realtime Shift Tracker</h4>
        <p className="text-xs text-slate-400 mt-1">General Cluster Shift: 09:30 AM - 06:30 PM</p>
      </div>

      <button
        onClick={triggerClockOperation}
        disabled={syncing || (attendance && attendance.check_out)}
        className={`w-32 h-32 rounded-full mx-auto border-4 flex flex-col items-center justify-center font-bold shadow-md transform active:scale-95 transition-all ${
          !attendance 
            ? 'bg-emerald-500 border-emerald-100 text-white' 
            : !attendance.check_out 
              ? 'bg-rose-500 border-rose-100 text-white' 
              : 'bg-slate-100 border-slate-200 text-slate-400 pointer-events-none'
        }`}
      >
        <span className="text-base tracking-wide">
          {!attendance ? 'PUNCH IN' : !attendance.check_out ? 'PUNCH OUT' : 'COMPLETED'}
        </span>
      </button>

      {attendance && (
        <div className="text-xs text-slate-500 flex justify-center space-x-4 border-t border-slate-50 pt-3">
          <p>In: <b>{new Date(attendance.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</b></p>
          {attendance.check_out && (
            <p>Out: <b>{new Date(attendance.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</b></p>
          )}
        </div>
      )}
    </div>
  );
}