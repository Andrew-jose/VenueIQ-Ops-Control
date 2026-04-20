import { useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useZoneDensity } from '../hooks/useZoneDensity';
import { Users, TrendingUp, AlertCircle, CheckCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

function ConfidenceBadge({ confidence }) {
  const isHigh = confidence === 'High';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
      isHigh ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }`}>
      {isHigh ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
      {confidence}
    </span>
  );
}

export default function ZoneGrid() {
  const { densities } = useZoneDensity();
  const [alerting, setAlerting] = useState({});

  const handleSendAlert = async (zoneId, zoneName) => {
    setAlerting(prev => ({ ...prev, [zoneId]: true }));
    try {
      const response = await fetch('http://localhost:8002/notify/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_id: zoneId, message: `Staff needed at ${zoneName}` })
      });
      
      if (response.ok) {
        toast.success(`Alert sent to ${zoneName}`);
      } else {
        throw new Error();
      }
    } catch (e) {
      toast.error(`Failed to notify ${zoneName}`);
    } finally {
      setAlerting(prev => ({ ...prev, [zoneId]: false }));
    }
  };

  const getStatusColor = (val) => {
    if (val < 0.5) return 'from-green-500/40 to-green-500/10 text-green-400 border-green-500/30';
    if (val <= 0.8) return 'from-amber-500/40 to-amber-500/10 text-amber-400 border-amber-500/30';
    return 'from-red-500/40 to-red-500/10 text-red-400 border-red-500/30';
  };

  const getBarColor = (val) => {
    if (val < 0.5) return 'bg-green-500';
    if (val <= 0.8) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {densities.map((zone) => (
        <div key={zone.id} className="group relative glass rounded-2xl p-5 hover:border-white/20 transition-all duration-300 overflow-hidden">
          {/* Subtle gradient background on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10 space-y-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h4 className="font-bold text-white tracking-tight">{zone.name}</h4>
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-slate-500" />
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Zone ID: {zone.id}</span>
                </div>
              </div>
              <ConfidenceBadge confidence={zone.confidence} />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Current Load</span>
                <span className={`text-2xl font-black tracking-tighter number-display ${(zone.density > 0.8) ? 'text-red-400' : (zone.density > 0.5) ? 'text-amber-400' : 'text-green-400'}`}>
                  {(zone.density * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                <div 
                  className={`h-full ${getBarColor(zone.density)} shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-out`}
                  style={{ width: `${zone.density * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-4 border-t border-white/5">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <TrendingUp size={10} />
                  30m Forecast
                </div>
                <div className="h-10 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={zone.forecastData}>
                      <Line 
                        type="monotone" 
                        dataKey="density" 
                        stroke={zone.density > 0.8 ? '#f87171' : '#3b82f6'} 
                        strokeWidth={2} 
                        dot={false}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <button
                aria-label={`Alert staff for ${zone.name}`}
                disabled={alerting[zone.id]}
                onClick={() => handleSendAlert(zone.id, zone.name)}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                  alerting[zone.id] ? 'bg-slate-800 border-white/10' : 'bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20'
                }`}
              >
                <Send size={18} className={alerting[zone.id] ? 'animate-pulse' : ''} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
