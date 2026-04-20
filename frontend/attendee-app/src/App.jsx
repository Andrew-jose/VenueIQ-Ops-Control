import React, { useState, useMemo, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useZoneDensity } from './hooks/useZoneDensity';
import { StadiumHeatmap } from './components/StadiumHeatmap';
import { SearchBar } from './components/SearchBar';
import { NotificationBanner } from './components/NotificationBanner';
import { ConfidenceBadge } from './components/ConfidenceBadge';
import { GOOGLE_MAPS_API_KEY, ZONE_COORDINATES } from './config/maps';

const LIBRARIES = ['places'];

function App() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const { zones, loading, error } = useZoneDensity();
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  
  const handleNavigate = useCallback((coords) => {
    // In a real app, this would route or pan the map
    console.log("Navigating to:", coords);
  }, []);

  const overallConfidence = useMemo(() => {
    if (!zones.length) return undefined;
    const confidences = zones.map(z => z.confidence_score);
    if (confidences.includes('low')) return 'low';
    if (confidences.includes('medium')) return 'medium';
    return 'high';
  }, [zones]);

  const selectedZone = useMemo(() => {
    if (!selectedZoneId || !zones) return null;
    return zones.find((z) => z.node_id === selectedZoneId) || null;
  }, [selectedZoneId, zones]);

  const getDensityColor = (density) => {
    if (density > 0.8) return '#EF4444';
    if (density < 0.5) return '#10B981';
    return '#F59E0B';
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#080C0E] flex flex-col font-sans">
      <NotificationBanner />
      
      {/* Top Bar */}
      <header className="absolute top-0 w-full z-20 bg-[#080C0E]/95 backdrop-blur-md border-b border-[#1A2E30]">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <h1 className="text-xl font-black tracking-tight text-[#F0F4F5]">
            Venue<span className="text-[#F59E0B]">IQ</span>
          </h1>
          <ConfidenceBadge confidence={overallConfidence} />
        </div>
      </header>

      {/* Floating Search Bar */}
      <SearchBar zones={zones} onNavigate={handleNavigate} />

      {/* Map Area */}
      <main className="flex-1 w-full h-full relative z-0">
        <StadiumHeatmap zones={zones} onZoneClick={setSelectedZoneId} />
      </main>

      {/* Bottom Sheet */}
      <div 
        className={`absolute bottom-0 left-0 w-full bg-[#0F1A1C] shadow-[0_-8px_30px_rgba(0,0,0,0.4)] rounded-t-3xl transition-transform duration-300 ease-in-out z-30 ${selectedZone ? 'translate-y-0' : 'translate-y-full'}`}
        role="dialog"
        aria-label="Zone details"
        aria-modal="false"
      >
        {selectedZone && (
          <div className="p-6 max-w-lg mx-auto w-full">
            <div className="w-12 h-1 bg-[#1A2E30] rounded-full mx-auto mb-6" />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[#F0F4F5] tracking-tighter leading-none mb-1">
                  {selectedZone.node_name || selectedZone.node_id}
                </h2>
                <span className="text-[11px] font-bold text-[#6B8A8D] uppercase tracking-widest">Zone Statistics</span>
              </div>
              <button 
                onClick={() => setSelectedZoneId(null)}
                className="p-2 rounded-full hover:bg-[#152124] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors focus:outline-none"
                aria-label="Close details"
              >
                <X className="w-5 h-5 text-[#6B8A8D]" />
              </button>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[11px] font-bold text-[#6B8A8D] uppercase tracking-wider">Current Density</span>
                <span className={`text-3xl font-black number-display`} style={{ color: getDensityColor(selectedZone.density) }}>
                  {Math.round(selectedZone.density * 100)}%
                </span>
              </div>
              <div className="w-full bg-[#1A2E30] rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000`}
                  style={{ 
                    width: `${selectedZone.density * 100}%`,
                    backgroundColor: getDensityColor(selectedZone.density)
                  }}
                />
              </div>
            </div>

            {selectedZone.predicted_density && selectedZone.predicted_density.length >= 3 && (
              <div className="mb-8">
                <h3 className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-widest mb-4">AI Forecast</h3>
                <div className="flex justify-between gap-3">
                  {selectedZone.predicted_density.map((pred, idx) => {
                    const pct = Math.round(pred * 100);
                    const color = getDensityColor(pred);
                    
                    return (
                      <div key={idx} className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border border-[#1A2E30] bg-[#152124]`}>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B8A8D] mb-1">+{idx + 1}0 min</span>
                        <span className="text-lg font-black number-display" style={{ color }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="mt-8">
              <button 
                onClick={() => handleNavigate(ZONE_COORDINATES[selectedZone.node_id])}
                className="w-full bg-gradient-to-r from-[#F59E0B] to-[#FB923C] text-[#080C0E] font-black py-4 px-4 rounded-2xl transition-all shadow-lg shadow-[#F59E0B]/20 active:scale-[0.98] hover:opacity-90"
              >
                Navigate Here
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function X(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
  );
}

export default App;
