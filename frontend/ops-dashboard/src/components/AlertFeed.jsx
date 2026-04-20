import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

const MOCK_MESSAGES = [
  { template: 'Zone {zone} density exceeded 0.8 — critical threshold', severity: 'critical' },
  { template: 'Staff alert dispatched to {zone}', severity: 'warning' },
  { template: 'Crowd redirect notification sent to {num} attendees', severity: 'info' },
  { template: '{zone} ingress rate dropped 15% in last 5m', severity: 'info' },
  { template: 'Automated barrier activated at {zone}', severity: 'warning' },
];

const ZONES = [
  'Gate A1', 'Gate A2', 'North Concourse', 'South Concourse',
  'East Wing', 'West Wing', 'VIP Lounge', 'Food Court A',
  'Food Court B', 'Restroom North', 'Merch Stand',
];

const SEV_CONFIG = {
  critical: { dot: 'critical', bg: 'rgba(255,77,77,0.08)',   border: 'rgba(255,77,77,0.2)',   color: '#FF8080', Icon: AlertCircle   },
  warning:  { dot: 'warning',  bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)',  color: '#F59E0B', Icon: AlertTriangle },
  info:     { dot: 'info',     bg: 'rgba(16,185,129,0.07)',  border: 'rgba(16,185,129,0.15)', color: '#34D399', Icon: Info         },
};

function createAlert(offsetMs = 0) {
  const def  = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
  const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
  const num  = Math.floor(Math.random() * 500) + 100;
  return {
    id:        Math.random().toString(36).slice(2),
    timestamp: new Date(Date.now() - offsetMs),
    zone,
    message:   def.template.replace('{zone}', zone).replace('{num}', num),
    severity:  def.severity,
  };
}

export default function AlertFeed() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    setAlerts(Array.from({ length: 6 }, (_, i) => createAlert(i * 12000)).sort((a, b) => b.timestamp - a.timestamp));
    const iv = setInterval(() => {
      setAlerts(prev => [createAlert(0), ...prev].slice(0, 12));
    }, 12000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ maxHeight: 360, overflowY: 'auto' }} aria-live="polite">
      {alerts.map(alert => {
        const cfg = SEV_CONFIG[alert.severity];
        return (
          <div
            key={alert.id}
            className="alert-item"
            style={{ background: cfg.bg, borderLeft: `3px solid ${cfg.border}` }}
          >
            <div className={`alert-dot ${cfg.dot}`} style={{ marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </span>
                <span className="tag" style={{ fontSize: 9, padding: '2px 7px', background: 'rgba(0,0,0,0.3)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                  {alert.zone}
                </span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: cfg.color, lineHeight: 1.4, margin: 0 }}>
                {alert.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
