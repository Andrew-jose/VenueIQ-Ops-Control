import { useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { useZoneDensity } from '../hooks/useZoneDensity';
import { Users, TrendingUp, Send, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function densityClass(val) {
  if (val > 0.8) return 'high';
  if (val > 0.5) return 'mid';
  return 'low';
}
function densityColor(val) {
  if (val > 0.8) return 'var(--thermal-high)';
  if (val > 0.5) return 'var(--thermal-mid)';
  return 'var(--thermal-low)';
}

export default function ZoneGrid() {
  const { densities } = useZoneDensity();
  const [alerting, setAlerting] = useState({});

  const handleSendAlert = async (zoneId, zoneName) => {
    setAlerting(prev => ({ ...prev, [zoneId]: true }));
    try {
      const res = await fetch('http://localhost:8002/notify/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_id: zoneId, message: `Staff needed at ${zoneName}` }),
      });
      if (res.ok) toast.success(`Alert sent to ${zoneName}`);
      else throw new Error();
    } catch {
      toast.error(`Failed to notify ${zoneName}`);
    } finally {
      setAlerting(prev => ({ ...prev, [zoneId]: false }));
    }
  };

  return (
    <div className="zone-grid">
      {densities.map(zone => {
        const cls   = densityClass(zone.density);
        const color = densityColor(zone.density);
        const pct   = Math.round(zone.density * 100);
        return (
          <div key={zone.id} className={`zone-card ${cls}`} id={`zone-${zone.id}`}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {zone.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <Users size={10} color="var(--text-secondary)" />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {zone.id}
                  </span>
                </div>
              </div>
              <span className="tag" style={{
                fontSize: 9, padding: '2px 7px',
                background: zone.confidence === 'High' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                color: zone.confidence === 'High' ? '#34D399' : '#F59E0B',
                borderColor: zone.confidence === 'High' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
              }}>
                {zone.confidence === 'High' ? <CheckCircle size={8} /> : <AlertCircle size={8} />}
                {' '}{zone.confidence}
              </span>
            </div>

            {/* Density value + bar */}
            <div style={{ marginBottom: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Load</span>
                <span className="zone-density-label number-display">{pct}%</span>
              </div>
              <div className="zone-bar-track">
                <div className="zone-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Sparkline + alert button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <TrendingUp size={9} color="var(--text-muted)" />
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    30m forecast
                  </span>
                </div>
                <div style={{ height: 32 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={zone.forecastData}>
                      <Line type="monotone" dataKey="density" stroke={color} strokeWidth={1.5} dot={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 10 }}
                        formatter={(v) => [`${Math.round(v * 100)}%`, 'Density']}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <button
                id={`alert-btn-${zone.id}`}
                aria-label={`Alert staff for ${zone.name}`}
                disabled={alerting[zone.id]}
                onClick={() => handleSendAlert(zone.id, zone.name)}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none',
                  background: alerting[zone.id] ? 'var(--bg-elevated)' : 'linear-gradient(135deg,#F59E0B,#FB923C)',
                  color: alerting[zone.id] ? 'var(--text-muted)' : '#060A0B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: alerting[zone.id] ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  boxShadow: alerting[zone.id] ? 'none' : '0 4px 12px rgba(245,158,11,0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Send size={14} style={{ animation: alerting[zone.id] ? 'pulseGlow 1s infinite' : 'none' }} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
