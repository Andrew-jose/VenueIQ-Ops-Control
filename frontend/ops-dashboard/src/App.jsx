import { useState, useEffect } from 'react';
import { Activity, Shield, AlertTriangle, LayoutDashboard, Database, Send, Clock, Menu, X, Bell } from 'lucide-react';
import ZoneGrid from './components/ZoneGrid';
import WhatIfPanel from './components/WhatIfPanel';
import AlertFeed from './components/AlertFeed';
import LiveStatsTable from './components/LiveStatsTable';
import { Toaster } from 'react-hot-toast';

function App() {
  const [time, setTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans flex flex-col md:flex-row overflow-hidden">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' }
      }} />

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 border-r border-white/5 flex flex-col`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.04em' }} className="tracking-tight text-white">VenueIQ</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Ops Control</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active />
          <NavItem icon={<Activity size={18} />} label="Live Density" />
          <NavItem icon={<Database size={18} />} label="Analytics" />
          <NavItem icon={<Bell size={18} />} label="Alert Management" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
            <p className="text-xs text-blue-400 font-medium mb-1">System Health</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-slate-300">All services nominal</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 glass border-b border-white/5 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-slate-400 hover:text-white">
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            <h2 className="text-lg font-medium text-slate-400">Command Dashboard</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-2 text-slate-200 font-mono text-xl font-bold">
                <Clock size={18} className="text-blue-500" />
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Live System Time</span>
            </div>
            
            <div className="h-8 w-px bg-white/10" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/10 flex items-center justify-center text-xs font-bold">
                OP
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard */}
        <main className="flex-1 overflow-y-auto bg-slate-950/30 p-8">
          <div className="max-w-[1600px] mx-auto space-y-8">
            <div className="flex flex-col xl:flex-row gap-8">
              {/* Left Column (60%) */}
              <div className="xl:w-[65%] space-y-8">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Activity className="text-blue-500" size={20} />
                      Live Zone Density
                    </h3>
                    <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded border border-white/5">Auto-refreshing every 3s</span>
                  </div>
                  <ZoneGrid />
                </section>
                
                <section>
                  <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
                    <Send className="text-blue-500" size={20} />
                    Predictive Simulation
                  </h3>
                  <WhatIfPanel />
                </section>
              </div>

              {/* Right Column (35%) */}
              <div className="xl:w-[35%] space-y-8">
                <section className="h-full flex flex-col">
                  <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
                    <AlertTriangle className="text-amber-500" size={20} />
                    Incident Feed
                  </h3>
                  <div className="flex-1">
                    <AlertFeed />
                  </div>
                  <div className="mt-8">
                    <LiveStatsTable />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 transition-colors'}`}>{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

export default App;
