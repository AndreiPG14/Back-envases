import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import AlertasMerma from '../components/AlertasMerma';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <AlertasMerma />
    </div>
  );
}
