import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: "HRBharat - Workspace Control Node",
  description: "Automated Operational Attendance & Payroll Ledger Core",
  manifest: "/manifest.json", // References the file inside public/ automatically
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HRBharat",
  },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents mobile layout zooming inside the standalone app frame
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