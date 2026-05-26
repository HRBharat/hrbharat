export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          owner_id: string
          name: string
          business_type: string
          gst_number: string | null
          address: string
          phone: string
          logo_url: string | null
          working_days: number
          default_check_in: string
          default_check_out: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          business_type: string
          gst_number?: string | null
          address: string
          phone: string
          logo_url?: string | null
          working_days?: number
          default_check_in?: string
          default_check_out?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          business_type?: string
          gst_number?: string | null
          address?: string
          phone?: string
          logo_url?: string | null
          working_days?: number
          default_check_in?: string
          default_check_out?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          company_id: string | null
          full_name: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          company_id?: string | null
          full_name: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          full_name?: string
          role?: string
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          company_id: string
          employee_code: string
          full_name: string
          phone_number: string
          email: string | null
          designation: string
          department: string
          monthly_salary: number
          joining_date: string
          employment_type: string
          status: string
          bank_name: string | null
          account_number: string | null
          ifsc_code: string | null
          upi_id: string | null
          emergency_contact: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          employee_code: string
          full_name: string
          phone_number: string
          email?: string | null
          designation: string
          department: string
          monthly_salary: number
          joining_date: string
          employment_type?: string
          status?: string
          bank_name?: string | null
          account_number?: string | null
          ifsc_code?: string | null
          upi_id?: string | null
          emergency_contact?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          employee_code?: string
          full_name?: string
          phone_number?: string
          email?: string | null
          designation?: string
          department?: string
          monthly_salary?: number
          joining_date?: string
          employment_type?: string
          status?: string
          bank_name?: string | null
          account_number?: string | null
          ifsc_code?: string | null
          upi_id?: string | null
          emergency_contact?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          company_id: string
          employee_id: string
          date: string
          check_in: string | null
          check_out: string | null
          latitude: string | null
          longitude: string | null
          selfie_url: string | null
          status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave'
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          employee_id: string
          date?: string
          check_in?: string | null
          check_out?: string | null
          latitude?: string | null
          longitude?: string | null
          selfie_url?: string | null
          status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave'
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          employee_id?: string
          date?: string
          check_in?: string | null
          check_out?: string | null
          latitude?: string | null
          longitude?: string | null
          selfie_url?: string | null
          status?: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave'
          created_at?: string
        }
      }
      leave_requests: {
        Row: {
          id: string
          company_id: string
          employee_id: string
          leave_type: 'Casual Leave' | 'Sick Leave' | 'Unpaid Leave'
          start_date: string
          end_date: string
          reason: string
          status: 'Pending' | 'Approved' | 'Rejected'
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          employee_id: string
          leave_type: 'Casual Leave' | 'Sick Leave' | 'Unpaid Leave'
          start_date: string
          end_date: string
          reason: string
          status?: 'Pending' | 'Approved' | 'Rejected'
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          employee_id?: string
          leave_type?: 'Casual Leave' | 'Sick Leave' | 'Unpaid Leave'
          start_date?: string
          end_date?: string
          reason?: string
          status?: 'Pending' | 'Approved' | 'Rejected'
          created_at?: string
        }
      }
      payroll: {
        Row: {
          id: string
          company_id: string
          employee_id: string
          month: string
          present_days: number
          per_day_salary: number
          gross_salary: number
          overtime: number
          bonus: number
          advance_deduction: number
          leave_deduction: number
          net_salary: number
          payment_status: 'Pending' | 'Paid' | 'Failed'
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          employee_id: string
          month: string
          present_days: number
          per_day_salary: number
          gross_salary: number
          overtime?: number
          bonus?: number
          advance_deduction?: number
          leave_deduction?: number
          net_salary: number
          payment_status?: 'Pending' | 'Paid' | 'Failed'
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          employee_id?: string
          month?: string
          present_days?: number
          per_day_salary?: number
          gross_salary?: number
          overtime?: number
          bonus?: number
          advance_deduction?: number
          leave_deduction?: number
          net_salary?: number
          payment_status?: 'Pending' | 'Paid' | 'Failed'
          created_at?: string
        }
      }
    }
  }
}