import './globals.css';
import "./theme.css";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "HRBharat - Workspace Control Node",
  description: "Automated Operational Attendance & Payroll Ledger Core",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-teal-700 selection:text-white">
        {children}
      </body>
    </html>
  );
}