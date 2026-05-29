"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { MapPin, Navigation, CheckCircle, Clock, Building } from 'lucide-react';

export default function IntegratedBranchAttendanceTerminal() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState<any>(null);
  const [companyConfig, setCompanyConfig] = useState<any>(null);
  const [employeeShift, setEmployeeShift] = useState<any>(null);
  const [assignedBranch, setAssignedBranch] = useState<any>(null);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [geoStatus, setGeoStatus] = useState<{ type: 'checking' | 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });

  const loadAttendanceTerminalState = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Pull core authorization profile mapping
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setEmployeeProfile(profile);

    if (profile?.company_id) {
      // 2. Pull company master configurations (Central Headquarters fallback metadata)
      const { data: company } = await supabase.from('companies').select('*').eq('id', profile.company_id).single();
      setCompanyConfig(company);

      // 3. Fetch precise employee details including their assigned branch and shift nodes
      const { data: empData } = await supabase
        .from('employees')
        .select('shift_id, branch_id, shifts(*), branches(*)')
        .eq('id', user.id)
        .maybeSingle();

      if (empData) {
        if (empData.shifts) setEmployeeShift(empData.shifts);
        if (empData.branches) setAssignedBranch(empData.branches);
      }

      // 4. Check if they already punched in today
      const todayString = new Date().toISOString().split('T')[0];
      const { data: log } = await supabase
        .from('attendance')
        .select('*, branches(branch_name)')
        .eq('employee_id', user.id)
        .eq('date', todayString)
        .maybeSingle();

      setTodayLog(log);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAttendanceTerminalState();
  }, []);

  // --- THE HAVERSINE MATHEMATICAL GEOLOCATION FORMULA ---
  const calculateDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  // --- MULTI-LOCATION & SHIFT-AWARE PUNCH HANDLER ---
  const handleVerifyAndPunchIn = () => {
    if (!navigator.geolocation) {
      setGeoStatus({ type: 'error', message: '❌ Geolocation is not supported by your browser engine.' });
      return;
    }

    setSubmitting(true);
    setGeoStatus({ type: 'checking', message: '📡 Syncing high-accuracy satellite coordinates...' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        // --- DYNAMIC TARGET BRANCH OR HEADQUARTERS COORDINATE ROUTING ---
        // If employee has an explicitly assigned branch, use its parameters; otherwise fallback to main office
        const officeLat = Number(assignedBranch ? assignedBranch.latitude : companyConfig?.office_latitude) || 28.6139;
        const officeLon = Number(assignedBranch ? assignedBranch.longitude : companyConfig?.office_longitude) || 77.2090;
        const maxAllowedRadius = assignedBranch ? assignedBranch.allowed_radius_meters : (companyConfig?.allowed_radius_meters || 100);

        // Execute precise distance tracking math
        const computedDistance = calculateDistanceInMeters(userLat, userLon, officeLat, officeLon);

        if (computedDistance > maxAllowedRadius) {
          setGeoStatus({
            type: 'error',
            message: `🔒 Access Denied! You are ${Math.round(computedDistance)} meters away from your assigned workspace area (${assignedBranch ? assignedBranch.branch_name : 'Headquarters'}). Max allowed radius is ${maxAllowedRadius}m.`
          });
          setSubmitting(false);
          return;
        }

        // --- SUCCESS: Inside the correct geofence perimeter loop. Run Lateness metrics ---
        const todayString = new Date().toISOString().split('T')[0];
        const currentTime = new Date();
        const currentTimeString = currentTime.toLocaleTimeString('en-US', { hour12: false });

        const shiftStartTime = employeeShift?.start_time || "09:00:00"; 
        const graceMinutes = employeeShift?.grace_period_minutes || 15;

        const [currentHours, currentMinutes] = currentTimeString.split(':').map(Number);
        const [shiftHours, shiftMinutes] = shiftStartTime.split(':').map(Number);

        const currentTotalMinutes = (currentHours * 60) + currentMinutes;
        const shiftTotalMinutes = (shiftHours * 60) + shiftMinutes;
        const lateThresholdMinutes = shiftTotalMinutes + graceMinutes;

        const isLate = currentTotalMinutes > lateThresholdMinutes;
        const minutesLate = isLate ? (currentTotalMinutes - shiftTotalMinutes) : 0;

        // --- LOG COMPREHENSIVE DATA MATRIX TO SUPABASE ---
        const { error } = await supabase
          .from('attendance')
          .insert({
            employee_id: employeeProfile.id,
            company_id: employeeProfile.company_id,
            branch_id: assignedBranch?.id || null, // Logs the branch link for branch-wise admin filtering
            date: todayString,
            punch_in_time: currentTimeString,
            status: isLate ? 'Late' : 'Present',
            is_late: isLate,
            minutes_late: minutesLate,
            shift_id: employeeShift?.id || null,
            punch_in_latitude: userLat,
            punch_in_longitude: userLon,
            distance_from_office_meters: computedDistance
          });

        if (error) {
          setGeoStatus({ type: 'error', message: `Database logging failed: ${error.message}` });
        } else {
          setGeoStatus({ 
            type: 'success', 
            message: isLate 
              ? `⚠️ Punch-in authorized at ${assignedBranch ? assignedBranch.branch_name : 'Headquarters'}. You are logged as ${minutesLate} minutes late.` 
              : `🎉 Punch-in verified successfully inside the ${assignedBranch ? assignedBranch.branch_name : 'Headquarters'} boundary perimeter!` 
          });
          loadAttendanceTerminalState(); // Hot-reload terminal visual interface card
        }
        setSubmitting(false);
      },
      (error) => {
        setGeoStatus({ type: 'error', message: `❌ Location access blocked: ${error.message}. Ensure location tracking is unlocked for this app site URL.` });
        setSubmitting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (loading) return <div className="p-6 text-xs text-slate-400 font-bold animate-pulse">CONNECTING SECURE WORKSPACE SATELLITE CHANNELS...</div>;

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Geo-Fenced Shift Node</h2>
        <p className="text-xs text-slate-500 font-medium">Verify structural attendance parameters via encrypted live GPS check loops</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-6 text-center">
        
        <div className="flex justify-center">
          <div className={`p-4 rounded-full ${todayLog ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 animate-pulse'}`}>
            <MapPin className="w-8 h-8" />
          </div>
        </div>

        {todayLog ? (
          /* --- SHIFT ACTIVE DISCLOSURE CARD --- */
          <div className="space-y-2">
            <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${todayLog.is_late ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{todayLog.is_late ? 'Logged Late' : 'Shift Active'}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Your clock-in metrics have been processed and locked inside the organization ledger log.</p>
            
            <div className="bg-slate-50 p-3 rounded-2xl text-left border border-slate-100 font-mono text-xs space-y-1 mt-4">
              <p className="text-slate-600"><b className="text-slate-800 font-bold">Logged Site:</b> {todayLog.branches?.branch_name || 'Main Corporate HQ'}</p>
              <p className="text-slate-600"><b className="text-slate-800 font-bold">Punch-In Time:</b> {todayLog.punch_in_time}</p>
              <p className="text-slate-600"><b className="text-slate-800 font-bold">Shift Status:</b> {todayLog.status}</p>
              {todayLog.is_late && <p className="text-amber-700 font-semibold">⚠️ Delay Margin: +{todayLog.minutes_late} minutes</p>}
              <p className="text-slate-600"><b className="text-slate-800 font-bold">Fence Offset:</b> {todayLog.distance_from_office_meters ? `${Math.round(todayLog.distance_from_office_meters)}m from point` : 'Verified Zone'}</p>
            </div>
          </div>
        ) : (
          /* --- READY TO PUNCH FIELD ACTIONS --- */
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center space-x-3 text-left">
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-700"><Building className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Assigned Station</p>
                <p className="text-xs font-black text-slate-900 mt-0.5">{assignedBranch ? assignedBranch.branch_name : `${companyConfig?.name || 'Workspace'} (Main HQ)`}</p>
                {assignedBranch?.address && <p className="text-[10px] text-slate-400 font-medium truncate max-w-[240px]">{assignedBranch.address}</p>}
              </div>
            </div>

            {employeeShift && (
              <div className="text-left font-mono">
                <span className="text-[10px] text-teal-800 bg-teal-50 border border-teal-100 font-bold px-2.5 py-1 rounded-lg block w-fit">
                  🕒 Shift timings: {employeeShift.name} ({employeeShift.start_time.substring(0,5)} - {employeeShift.end_time.substring(0,5)})
                </span>
              </div>
            )}

            {geoStatus.message && (
              <div className={`p-3 text-xs font-bold rounded-xl border text-left ${
                geoStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                geoStatus.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                {geoStatus.message}
              </div>
            )}

            <button
              onClick={handleVerifyAndPunchIn}
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm"
            >
              <Navigation className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
              <span>{submitting ? 'Verifying Station Perimeter...' : 'Authenticate & Punch In'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}