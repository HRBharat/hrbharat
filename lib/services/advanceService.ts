import { supabase } from '../supabase';

export interface AdvanceRequest {
  id?: string;
  employee_id: string;
  amount_requested: number;
  reason: string;
  status?: 'pending' | 'approved' | 'rejected';
  repayment_type: 'full_next_month' | 'emi';
  emi_months?: number;
  balance_remaining: number;
}

export const advanceService = {
  // 1. Employee submits a new advance request
  async createRequest(request: Omit<AdvanceRequest, 'status' | 'balance_remaining'>) {
    const { data, error } = await supabase
      .from('advances')
      .insert([
        {
          ...request,
          status: 'pending',
          balance_remaining: request.amount_requested, // Initial balance matches request amount
        },
      ])
      .select();

    if (error) throw error;
    return data;
  },

  // 2. Owner/Employee fetches all requests safely
  async getRequests(status?: 'pending' | 'approved' | 'rejected') {
    let query = supabase
      .from('advances')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  // 3. Owner approves or rejects the request
  async updateStatus(id: string, status: 'approved' | 'rejected') {
    const { data, error } = await supabase
      .from('advances')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  }
};