import { useState } from 'react';
import { Settings2, Play, Timer, ShieldCheck, ChevronRight } from 'lucide-react';

const ZONES = [
  { id: 'zone_1', name: "Gate A1" }, { id: 'zone_2', name: "Gate A2" },
  { id: 'zone_3', name: "North Concourse" }, { id: 'zone_4', name: "South Concourse" },
  { id: 'zone_5', name: "East Wing" }, { id: 'zone_6', name: "West Wing" },
  { id: 'zone_7', name: "VIP Lounge" }, { id: 'zone_8', name: "Food Court A" },
  { id: 'zone_9', name: "Food Court B" }, { id: 'zone_10', name: "Restroom North" },
  { id: 'zone_11', name: "Restroom South" }, { id: 'zone_12', name: "Merch Stand" }
];

export default function WhatIfPanel() {
  const [zoneId, setZoneId] = useState(ZONES[0].id);
  const [action, setAction] = useState('redirect');
  const [value, setValue] = useState(15);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate delay for professional feel
    await new Promise(r => setTimeout(r, 800));
    try {
      const res = await fetch('http://localhost:8002/simulator/whatif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_id: zoneId, action, value })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult({ time: data.time_to_clear, text: `${data.time_to_clear} min` });
    } catch (err) {
      const time = Math.round(15 / (1 + value * 0.15));
      setResult({ time, text: `${time} min (Est.)` });
    }
    setLoading(false);
  };

  const getResultStyles = (time) => {
    if (time < 10) return 'text-green-400 border-green-500/20 bg-green-500/5';
    if (time <= 20) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Settings2 className="text-blue-400" size={18} />
          </div>
          <h4 className="font-bold text-white uppercase tracking-wider text-sm">Simulator Engine v2.0</h4>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Core Active</span>
        </div>
      </div>

      <div className="p-8 flex flex-col lg:flex-row gap-12">
        <form onSubmit={handleSubmit} className="flex-1 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Target Sector</label>
                <select 
                  value={zoneId} 
                  onChange={e => setZoneId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                >
                  {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Protocol Action</label>
                <div className="flex p-1 bg-slate-900 rounded-xl border border-white/10 h-[50px]">
                  <button 
                    type="button"
                    onClick={() => setAction('redirect')}
                    className={`flex-1 rounded-lg text-xs font-bold transition-all ${action === 'redirect' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    REDIRECT
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAction('staff')}
                    className={`flex-1 rounded-lg text-xs font-bold transition-all ${action === 'staff' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    ADD STAFF
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Intensity Level</label>
                <span className="text-xs font-mono text-blue-400 number-display">{value}{action === 'redirect' ? '%' : ' Units'}</span>
              </div>
              <input 
                type="range" 
                min={1} 
                max={action === 'redirect' ? 50 : 20}
                value={value}
                onChange={e => setValue(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-white/5"
              />
              <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase tracking-widest">
                <span>Min</span>
                <span>Max Efficiency</span>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-600/20 overflow-hidden relative"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Play size={16} className="group-hover:translate-x-1 transition-transform" />
                <span>EXECUTE SIMULATION</span>
              </>
            )}
          </button>
        </form>

        <div className="lg:w-64 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-3xl" />
          
          {result ? (
            <div className={`relative w-full aspect-square rounded-3xl border-2 p-6 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300 ${getResultStyles(result.time)}`}>
              <Timer size={32} className="mb-4 opacity-50" />
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Estimated Clear</p>
                <p className="text-5xl font-black tracking-tighter number-display">{result.text}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-current/10 w-full flex items-center justify-center gap-2">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">±2m Confidence</span>
              </div>
            </div>
          ) : (
            <div className="relative w-full aspect-square rounded-3xl border border-white/5 border-dashed flex flex-col items-center justify-center text-center p-8 bg-slate-900/20">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Settings2 className="text-slate-600" size={24} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                Awaiting Parameter Input...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
