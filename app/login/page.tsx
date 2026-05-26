"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import Link from 'next/link';

const loginSchema = zod.object({
  email: zod.string().email('Invalid email structure definition'),
  password: zod.string().min(1, 'Password field required execution validation data'),
});

type LoginValues = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State to track if logging in as an Employer (Owner) or Employee
  const [loginType, setLoginType] = useState<'owner' | 'employee'>('owner');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginValues) => {
    setLoading(true);
    setError(null);

    // 1. Authenticate standard credentials against Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Extra Safety Check: Verify if their database role matches what they selected on screen
    if (authData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profile && profile.role !== loginType) {
        // Gently catch them if they try to log into the wrong terminal portal
        setError(`This account is registered as an ${profile.role}. Please switch the selector above.`);
        setLoading(false);
        return;
      }
    }

    // Success! Route straight into the smart client dashboard layout panel
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Access HRBharat</h2>
        <p className="mt-2 text-sm text-slate-600">
          Sign into your {loginType === 'owner' ? 'Enterprise Management' : 'Employee Work'} Gate
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 shadow rounded-3xl sm:px-10">
          
          {/* PREMIUM SLIDING ROLE SELECTOR TRACK CONTAINER */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => { setLoginType('owner'); setError(null); }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
                loginType === 'owner' 
                  ? 'bg-white text-teal-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              💼 Employer / Admin
            </button>
            <button
              type="button"
              onClick={() => { setLoginType('employee'); setError(null); }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
                loginType === 'employee' 
                  ? 'bg-white text-teal-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🏃 Employee Portal
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-bold text-red-600 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Input label="Registered Email" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Account Password" type="password" {...register('password')} error={errors.password?.message} />
            
            <Button type="submit" disabled={loading} className="mt-6">
              {loading ? 'Validating Secure Token Handshake...' : `Sign In As ${loginType === 'owner' ? 'Employer' : 'Employee'}`}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500 font-medium">
            New organization setup? <Link href="/signup" className="text-teal-700 font-bold hover:underline">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}