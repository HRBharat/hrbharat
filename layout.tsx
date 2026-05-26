import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HRBharat - Payroll & Attendance for Indian SMBs',
  description: 'Manage employee attendance, leave allocations, and generate compliant payroll structures in 1-click.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen antialiased text-slate-900">{children}</body>
    </html>
  );
}