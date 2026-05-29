"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { Button } from '../../../../components/ui/button';
import { Select } from '../../../../components/ui/select';
import { Camera, MapPin, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function CameraCheckInGateway() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [geo, setGeo] = useState<{ lat: string; lng: string } | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchActiveStaffNodeData();
    initializeGeolocationTrackingPipeline();
    return () => stopHardwareLensFeeds();
  }, []);

  async function fetchActiveStaffNodeData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    if (profile?.company_id) {
      const { data } = await supabase.from('employees').select('id, full_name, employee_code').eq('company_id', profile.company_id).eq('status', 'Active');
      setEmployees(data || []);
      if (data && data.length > 0) setSelectedEmpId(data[0].id);
    }
  }

  function initializeGeolocationTrackingPipeline() {
    if (!navigator.geolocation) {
      setErrorMsg('Internal hardware matrix definition context missing GPS location processing units.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() }),
      () => setErrorMsg('Access tracking authorization denied for satellite localization data.'),
      { enableHighAccuracy: true }
    );
  }

  const startLensHardwareFeeds = async () => {
    setErrorMsg(null);
    setCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setErrorMsg('Camera access failed. Verify hardware configuration links.');
      setCapturing(false);
    }
  };

  const stopHardwareLensFeeds = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
  };

  const processAttendancePayloadSubmission = async () => {
    if (!selectedEmpId || !geo) {
      setErrorMsg('Ensure staff selection and localization data coordinates are confirmed.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    const companyId = profile!.company_id;

    // Check configuration parameters for lateness verification
    const { data: comp } = await supabase.from('companies').select('default_check_in').eq('id', companyId).single();
    const currentTime = new Date();
    const [defH, defM] = (comp?.default_check_in || '09:30:00').split(':');
    const boundaryTime = new Date();
    boundaryTime.setHours(Number(defH), Number(defM), 0);

    const calculatedStatus = currentTime > boundaryTime ? 'Late' : 'Present';

    const { error } = await supabase.from('attendance').insert({
      company_id: companyId,
      employee_id: selectedEmpId,
      date: currentTime.toISOString().split('T')[0],
      check_in: currentTime.toISOString(),
      latitude: geo.lat,
      longitude: geo.lng,
      status: calculatedStatus,
    });

    if (error) {
      setErrorMsg('Duplicate entry conflict matching profile timeline token sequence.');
    } else {
      stopHardwareLensFeeds();
      router.push('/dashboard/attendance');
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <button onClick={() => { stopHardwareLensFeeds(); router.push('/dashboard/attendance'); }} className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-all space-x-1.5">
        <ArrowLeft className="w-4 h-4" />
        <span>Exit Lens Feed</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Verification Camera Interface</h2>
          <p className="text-xs text-slate-400 font-medium">Instant localized time check validation</p>
        </div>

        {errorMsg && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">{errorMsg}</div>}

        <Select
          label="Target Identity Profile Match"
          options={employees.map(e => ({ label: `${e.full_name} (${e.employee_code})`, value: e.id }))}
          value={selectedEmpId}
          onChange={(e) => setSelectedEmpId(e.target.value)}
        />

        <div className="relative bg-slate-950 aspect-video rounded-2xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center">
          {!capturing ? (
            <button onClick={startLensHardwareFeeds} className="flex flex-col items-center space-y-2 text-xs font-bold uppercase tracking-wider text-teal-400 hover:text-teal-300 transition-all">
              <Camera className="w-8 h-8 scale-110" />
              <span>Initialize Lens System</span>
            </button>
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
          )}
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>Telemetry Context Lock</span>
          </span>
          <span className="font-mono text-xs text-slate-700 font-bold">
            {geo ? `${Number(geo.lat).toFixed(4)}, ${Number(geo.lng).toFixed(4)}` : 'Searching tracking links...'}
          </span>
        </div>

        <Button onClick={processAttendancePayloadSubmission} disabled={!geo} className="pt-3.5 pb-3.5 font-bold tracking-wide uppercase">
          Confirm Capture Verification Sign
        </Button>
      </div>
    </div>
  );
}