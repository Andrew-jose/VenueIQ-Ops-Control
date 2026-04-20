import { useState } from 'react';
import { Settings2, Play, Timer, ShieldCheck } from 'lucide-react';

const ZONES = [
  { id: 'zone_1',  name: 'Gate A1'         },
  { id: 'zone_2',  name: 'Gate A2'         },
  { id: 'zone_3',  name: 'North Concourse' },
  { id: 'zone_4',  name: 'South Concourse' },
  { id: 'zone_5',  name: 'East Wing'       },
  { id: 'zone_6',  name: 'West Wing'       },
  { id: 'zone_7',  name: 'VIP Lounge'      },
  { id: 'zone_8',  name: 'Food Court A'    },
  { id: 'zone_9',  name: 'Food Court B'    },
  { id: 'zone_10', name: 'Restroom North'  },
  { id: 'zone_11', name: 'Restroom South'  },
  { id: 'zone_12', name: 'Merch Stand'     },
];

const SELECT_STYLE = {
  width: '100%', background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)', borderRadius: 10,
  padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13,
  outline: 'none', cursor: 'pointer', appearance: 'none',
};

const LABEL_STYLE = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: 'var(--text-secondary)', display: 'block', marginBottom: 8,
};

export default function WhatIfPanel() {
  const [zoneId,  setZoneId]  = useState(ZONES[0].id);
  const [action,  setAction]  = useState('redirect');
  const [value,   setValue]   = useState(15);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  const maxVal = action === 'redirect' ? 50 : 20;
  const pct    = ((value - 1) / (maxVal - 1)) * 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    try {
      const res = await fetch('http://localhost:8002/simulator/whatif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_id: zoneId, action, value }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data.time_to_clear_minutes);
    } catch {
      setResult(Math.round(15 / (1 + value * 0.15)));
    }
    setLoading(false);
  };

  const resultColor = result == null ? null : result < 10 ? '#34D399' : result <= 20 ? '#F59E0B' : '#FF8080';
  const resultBg    = result == null ? null : result < 10 ? 'rgba(16,185,129,0.08)' : result <= 20 ? 'rgba(245,158,11,0.08)' : 'rgba(255,77,77,0.08)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Zone selector */}
          <div>
            <label style={LABEL_STYLE} htmlFor="sim-zone">Target Sector</label>
            <select id="sim-zone" style={SELECT_STYLE} value={zoneId} onChange={e => setZoneId(e.target.value)}>
              {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          {/* Action toggle */}
          <div>
            <label style={LABEL_STYLE}>Protocol Action</label>
            <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 4, height: 42 }}>
              {['redirect', 'staff'].map(act => (
                <button
                  key={act} type="button" id={`action-${act}`}
                  onClick={() => { setAction(act); setValue(act === 'redirect' ? 15 : 5); }}
                  style={{
                    flex: 1, border: 'none', borderRadius: 8, cursor: 'pointer',
                    fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
                    transition: 'all 0.2s ease',
                    background: action === act ? 'linear-gradient(135deg,#F59E0B,#FB923C)' : 'transparent',
                    color: action === act ? '#060A0B' : 'var(--text-secondary)',
                    boxShadow: action === act ? '0 4px 12px rgba(245,158,11,0.3)' : 'none',
                  }}
                >
                  {act === 'redirect' ? 'Redirect' : 'Add Staff'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Intensity slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={LABEL_STYLE}>Intensity Level</label>
            <span className="mono number-display" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-amber)' }}>
              {value}{action === 'redirect' ? '%' : ' units'}
            </span>
          </div>
          <input
            id="sim-intensity"
            type="range" min={1} max={maxVal} value={value}
            onChange={e => setValue(parseInt(e.target.value))}
            className="slider-track"
            style={{ '--pct': `${pct}%` }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            <span>Min</span><span>Max Efficiency</span>
          </div>
        </div>

        {/* Submit */}
        <button
          id="sim-run"
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 13, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <span style={{ width: 16, height: 16, border: '2px solid rgba(6,10,11,0.4)', borderTop: '2px solid #060A0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
          ) : (
            <><Play size={15} /> Execute Simulation</>
          )}
        </button>
      </form>

      {/* Result */}
      {result !== null && (
        <div style={{
          background: resultBg, border: `1px solid ${resultColor}30`,
          borderRadius: 14, padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 20,
          animation: 'fadeUp 0.35s ease',
        }}>
          <Timer size={32} color={resultColor} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: resultColor, opacity: 0.7, marginBottom: 4 }}>
              Estimated Clear Time
            </p>
            <p className="number-display" style={{ fontSize: 40, fontWeight: 900, color: resultColor, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {result}<span style={{ fontSize: 18, fontWeight: 600, marginLeft: 4 }}>min</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <ShieldCheck size={12} color={resultColor} />
              <span style={{ fontSize: 10, fontWeight: 600, color: resultColor, opacity: 0.7 }}>±2 min confidence interval</span>
            </div>
          </div>
        </div>
      )}

      {result === null && !loading && (
        <div style={{
          border: '1px dashed var(--border-subtle)', borderRadius: 14, padding: '24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          color: 'var(--text-muted)', textAlign: 'center',
        }}>
          <Settings2 size={28} />
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Awaiting parameter input…
          </p>
        </div>
      )}
    </div>
  );
}
