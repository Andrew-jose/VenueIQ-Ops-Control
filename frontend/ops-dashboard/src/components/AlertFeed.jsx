import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, BellRing } from 'lucide-react';

const MOCK_MESSAGES = [
  { template: "Zone {zone} density exceeded 0.8 threshold", severity: "critical" },
  { template: "Staff alert sent to {zone}", severity: "warning" },
  { template: "Crowd redirect notification sent to {num} attendees", severity: "info" },
  { template: "{zone} ingress rate dropped 15%", severity: "info" }
];

const ZONES = [
  "Gate A1", "Gate A2", "North Concourse", "South Concourse",
  "East Wing", "West Wing", "VIP Lounge", "Food Court A",
  "Food Court B", "Restroom North", "Restroom South", "Merch Stand"
];

export default function AlertFeed() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const initialAlerts = Array.from({ length: 5 }).map((_, i) => createRandomAlert(i * 15000));
    setAlerts(initialAlerts.sort((a, b) => b.timestamp - a.timestamp));

    const interval = setInterval(() => {
      setAlerts(prev => {
        const newAlert = createRandomAlert(0);
        return [newAlert, ...prev].slice(0, 10);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const createRandomAlert = (timeOffsetMs = 0) => {
    const msgDef = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
    const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
    const num = Math.floor(Math.random() * 500) + 100;
    const message = msgDef.template.replace('{zone}', zone).replace('{num}', num);
    
    return {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(Date.now() - timeOffsetMs),
      zone: zone,
      message: message,
      severity: msgDef.severity
    };
  };

  const getSeverityStyles = (severity) => {
    if (severity === 'critical') return 'bg-red-500/10 border-red-500/20 text-red-400';
    if (severity === 'warning') return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
  };

  const getIcon = (severity) => {
    if (severity === 'critical') return <AlertCircle size={16} />;
    if (severity === 'warning') return <AlertTriangle size={16} />;
    return <Info size={16} />;
  };

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col h-[350px]">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
        <BellRing className="text-blue-500" size={16} />
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Security Real-time Feed</h4>
      </div>
      
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
        aria-live="polite"
      >
        {alerts.map(alert => (
          <div 
            key={alert.id} 
            className={`group rounded-xl border p-4 flex gap-4 items-start transition-all duration-300 hover:scale-[1.02] ${getSeverityStyles(alert.severity)}`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {getIcon(alert.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold opacity-60">
                  {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-black/20 font-black tracking-widest uppercase border border-white/5">
                  {alert.zone}
                </span>
              </div>
              <p className="text-sm font-medium leading-snug line-clamp-2">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
