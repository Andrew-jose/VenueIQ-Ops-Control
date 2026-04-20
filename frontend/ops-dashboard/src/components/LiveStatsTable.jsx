import { useState, useEffect } from 'react';
import { ArrowUpDown, ChevronUp, ChevronDown, Download } from 'lucide-react';

const ZONES = [
  'Gate A1', 'Gate A2', 'North Concourse', 'South Concourse',
  'East Wing', 'West Wing', 'VIP Lounge', 'Food Court A',
  'Food Court B', 'Restroom North', 'Restroom South', 'Merch Stand',
];

function statusTag(avg) {
  if (avg > 0.8) return { label: 'CRITICAL', bg: 'rgba(255,77,77,0.1)',  color: '#FF8080', border: 'rgba(255,77,77,0.2)'  };
  if (avg > 0.5) return { label: 'WATCH',    bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: 'rgba(245,158,11,0.2)' };
  return              { label: 'NORMAL',    bg: 'rgba(16,185,129,0.1)', color: '#34D399', border: 'rgba(16,185,129,0.2)' };
}

export default function LiveStatsTable() {
  const [data, setData]           = useState([]);
  const [sort, setSort]           = useState({ key: 'zone', dir: 'asc' });

  useEffect(() => {
    let rows = ZONES.map(zone => ({
      zone,
      avgDensity:   Math.random() * 0.9,
      peakDensity:  Math.random() * 0.9 + 0.1,
      transactions: Math.floor(Math.random() * 5000),
    }));
    setData(rows);
    const iv = setInterval(() => {
      rows = rows.map(r => {
        const d   = (Math.random() - 0.5) * 0.1;
        const avg = Math.max(0, Math.min(1, r.avgDensity + d));
        return { ...r, avgDensity: avg, peakDensity: Math.max(r.peakDensity, avg), transactions: r.transactions + Math.floor(Math.random() * 5) };
      });
      setData([...rows]);
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  const toggleSort = (key) => setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const sorted = [...data].sort((a, b) => {
    const [va, vb] = [a[sort.key], b[sort.key]];
    if (va < vb) return sort.dir === 'asc' ? -1 : 1;
    if (va > vb) return sort.dir === 'asc' ? 1  : -1;
    return 0;
  });

  const SortIcon = ({ k }) => sort.key === k
    ? (sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
    : <ArrowUpDown size={10} style={{ opacity: 0.3 }} />;

  const COLS = [
    { key: 'zone',         label: 'Sector'   },
    { key: 'avgDensity',   label: 'Avg Load' },
    { key: 'peakDensity',  label: 'Peak'     },
    { key: 'transactions', label: 'Txns'     },
    { key: 'status',       label: 'Status'   },
  ];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            {COLS.map(col => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                id={`sort-${col.key}`}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {col.label}
                  <SortIcon k={col.key} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => {
            const st = statusTag(row.avgDensity);
            return (
              <tr key={row.zone}>
                <td style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{row.zone}</td>
                <td className="mono number-display" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {(row.avgDensity * 100).toFixed(1)}%
                </td>
                <td className="mono number-display" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {(row.peakDensity * 100).toFixed(1)}%
                </td>
                <td className="mono number-display" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {row.transactions.toLocaleString()}
                </td>
                <td>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 20, border: `1px solid ${st.border}`,
                    background: st.bg, color: st.color,
                  }}>
                    {st.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
