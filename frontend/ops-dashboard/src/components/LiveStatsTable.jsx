import { useState, useEffect } from 'react';
import { Download, ArrowUpDown, ChevronUp, ChevronDown, ListFilter } from 'lucide-react';

const ZONES = [
  "Gate A1", "Gate A2", "North Concourse", "South Concourse",
  "East Wing", "West Wing", "VIP Lounge", "Food Court A",
  "Food Court B", "Restroom North", "Restroom South", "Merch Stand"
];

export default function LiveStatsTable() {
  const [data, setData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'zone', direction: 'asc' });

  useEffect(() => {
    const generateInitialData = () => {
      return ZONES.map(zone => ({
        zone,
        avgDensity: Math.random() * 0.9,
        peakDensity: Math.random() * 0.9 + 0.1,
        transactions: Math.floor(Math.random() * 5000),
      }));
    };

    let currentData = generateInitialData();
    setData(currentData);

    const interval = setInterval(() => {
      currentData = currentData.map(row => {
        const delta = (Math.random() - 0.5) * 0.1;
        const newAvg = Math.max(0, Math.min(1, row.avgDensity + delta));
        return {
          ...row,
          avgDensity: newAvg,
          peakDensity: Math.max(row.peakDensity, newAvg),
          transactions: row.transactions + Math.floor(Math.random() * 5)
        };
      });
      setData([...currentData]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusInfo = (avg) => {
    if (avg > 0.8) return { label: 'CRITICAL', color: 'text-red-400 bg-red-400/10 border-red-400/20' };
    if (avg > 0.5) return { label: 'WATCH', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
    return { label: 'NORMAL', color: 'text-green-400 bg-green-400/10 border-green-400/20' };
  };

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListFilter className="text-blue-500" size={18} />
          <h4 className="text-sm font-black uppercase tracking-widest text-white">Live Data Grid</h4>
        </div>
        <button 
          onClick={() => {}} 
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-bold text-slate-300 transition-all"
        >
          <Download size={14} />
          EXPORT CSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              {[
                { key: 'zone', label: 'Sector' },
                { key: 'avgDensity', label: 'Avg Load' },
                { key: 'peakDensity', label: 'Peak' },
                { key: 'transactions', label: 'Actions' },
                { key: 'status', label: 'Status' }
              ].map((col) => (
                <th 
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortConfig.key === col.key ? (
                      sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : <ArrowUpDown size={10} className="opacity-30" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedData.map((row) => {
              const status = getStatusInfo(row.avgDensity);
              return (
                <tr key={row.zone} className="hover:bg-blue-500/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-white">{row.zone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-slate-400 number-display">{(row.avgDensity * 100).toFixed(1)}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-slate-400 number-display">{(row.peakDensity * 100).toFixed(1)}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-slate-400">{row.transactions.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black tracking-widest border ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
