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

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100 flex flex-col font-sans">
      <NotificationBanner />
      
      {/* Top Bar */}
      <header className="absolute top-0 w-full z-20 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight text-blue-900">VenueIQ</h1>
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
        className={`absolute bottom-0 left-0 w-full bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] rounded-t-3xl transition-transform duration-300 ease-in-out z-30 ${selectedZone ? 'translate-y-0' : 'translate-y-full'}`}
        role="dialog"
        aria-label="Zone details"
        aria-modal="false"
      >
        {selectedZone && (
          <div className="p-6 max-w-lg mx-auto w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 zone-name">{selectedZone.node_name || selectedZone.node_id}</h2>
              <button 
                onClick={() => setSelectedZoneId(null)}
                className="p-2 rounded-full hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close details"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-gray-700">Current Density</span>
                <span className="text-sm font-bold text-gray-900 number-display">{Math.round(selectedZone.density * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 rounded-full ${selectedZone.density > 0.8 ? 'bg-red-500' : selectedZone.density < 0.5 ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${selectedZone.density * 100}%` }}
                ></div>
              </div>
            </div>

            {selectedZone.predicted_density && selectedZone.predicted_density.length >= 3 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Forecast</h3>
                <div className="flex justify-between gap-3">
                  {selectedZone.predicted_density.map((pred, idx) => {
                    const pct = Math.round(pred * 100);
                    let colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
                    if (pred > 0.8) colorClass = 'bg-red-100 text-red-800 border-red-200';
                    if (pred < 0.5) colorClass = 'bg-green-100 text-green-800 border-green-200';
                    
                    return (
                      <div key={idx} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border ${colorClass}`}>
                        <span className="text-xs uppercase tracking-wider font-semibold opacity-80 mb-1">+{idx + 1}0 min</span>
                        <span className="text-lg font-bold number-display">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <button 
                onClick={() => handleNavigate(ZONE_COORDINATES[selectedZone.node_id])}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl min-h-[44px] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

export default App;
