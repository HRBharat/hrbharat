"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';

export default function CorporateSettingsNode() {
  const [compData, setCompData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCompanyMeta() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (profile?.company_id) {
        const { data } = await supabase.from('companies').select('*').eq('id', profile.company_id).single();
        setCompData(data);
      }
      setLoading(false);
    }
    loadCompanyMeta();
  }, []);

  const handleUpdateConfigSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    
    await supabase.from('companies').update({
      name: form.get('name') as string,
      gst_number: form.get('gst') as string,
      working_days: Number(form.get('days')),
      default_check_in: form.get('checkIn') as string
    }).eq('id', compData.id);

    setSaving(false);
    alert('System operational parameters configurations successfully flash-locked in DB state.');
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold tracking-widest text-slate-400 animate-pulse uppercase">Reading configuration clusters...</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Platform Core Parameters Configuration</h2>
        <p className="text-xs text-slate-500 font-medium">Fine-tune system variables, structural divisions, and validation logic</p>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <form onSubmit={handleUpdateConfigSubmit} className="space-y-1">
          <Input label="Enterprise Legal Corporate Entity Name" name="name" defaultValue={compData?.name} />
          <Input label="GSTIN Identification Identifier (Optional)" name="gst" defaultValue={compData?.gst_number || ''} />
          <Input label="Standardized Base Monthly Work Dividend Days Pool" type="number" name="days" defaultValue={compData?.working_days || 26} />
          <Input label="Shift Boundary Trigger Check-In Cutoff Time (HH:MM:SS)" name="checkIn" defaultValue={compData?.default_check_in || '09:30:00'} />
          
          <Button type="submit" disabled={saving} className="mt-4">
            {saving ? 'Flash Committing Modifications Matrix...' : 'Lock Parameters Securely'}
          </Button>
        </form>
      </div>
    </div>
  );
}