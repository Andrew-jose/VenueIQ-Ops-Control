import React, { useMemo } from 'react';
import { GoogleMap, HeatmapLayer, Marker } from '@react-google-maps/api';
import { STADIUM_CENTER, ZONE_COORDINATES } from '../config/maps';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
  zoom: 16,
  disableDefaultUI: true,
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  ],
};

const getMarkerIcon = (density) => {
  const isHighDensity = density > 0.8;
  const isLowDensity = density < 0.5;

  let color = '#f59e0b'; // amber/medium
  if (isHighDensity) color = '#ef4444'; // red/high
  if (isLowDensity) color = '#22c55e'; // green/low

  return {
    path: window.google ? window.google.maps.SymbolPath.CIRCLE : 0,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: isHighDensity ? 14 : 10,
  };
};

export const StadiumHeatmap = ({ zones, onZoneClick }) => {
  const heatmapData = useMemo(() => {
    if (!window.google || !window.google.maps || !window.google.maps.LatLng) return [];
    return zones
      .filter((zone) => ZONE_COORDINATES[zone.node_id])
      .map((zone) => {
        const coord = ZONE_COORDINATES[zone.node_id];
        return {
          location: new window.google.maps.LatLng(coord.lat, coord.lng),
          weight: zone.density || 0,
        };
      });
  }, [zones]);

  const renderDemoMap = () => {
    // Map of zone labels to coordinates in the 1000x1000 SVG space
    const stadiumLayout = {
      'gate_a1': { x: 500, y: 150, abbr: 'A1' },
      'gate_a2': { x: 500, y: 850, abbr: 'A2' },
      'gate_b1': { x: 150, y: 500, abbr: 'B1' },
      'gate_b2': { x: 850, y: 500, abbr: 'B2' },
      'concourse_n': { x: 300, y: 300, abbr: 'CN' },
      'concourse_s': { x: 700, y: 700, abbr: 'CS' },
      'concourse_e': { x: 700, y: 300, abbr: 'CE' },
      'concourse_w': { x: 300, y: 700, abbr: 'CW' },
      'zone_1': { x: 200, y: 200, abbr: 'Z1' },
      'zone_2': { x: 800, y: 200, abbr: 'Z2' },
      'zone_3': { x: 200, y: 800, abbr: 'Z3' },
      'zone_4': { x: 800, y: 800, abbr: 'Z4' },
    };

    return (
      <div className="w-full h-full bg-[#0F172A] flex items-center justify-center relative overflow-hidden">
        <svg viewBox="0 0 1000 1000" className="w-full h-full max-w-4xl max-h-[80vh]">
          {/* External Stadium Perimeter */}
          <ellipse cx="500" cy="500" rx="450" ry="400" fill="none" stroke="#1E293B" strokeWidth="40" />
          
          {/* Main Field */}
          <ellipse cx="500" cy="500" rx="300" ry="250" fill="#1E293B" stroke="#334155" strokeWidth="4" />
          <ellipse cx="500" cy="500" rx="200" ry="150" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="10 10" />
          
          {zones.map((zone) => {
             const layout = stadiumLayout[zone.node_id.toLowerCase()];
             if (!layout) return null;
             
             const density = zone.density || 0;
             const isHigh = density > 0.8;
             const isLow = density < 0.5;
             const color = isHigh ? '#EF4444' : isLow ? '#10B981' : '#F59E0B';
             
             return (
               <g key={zone.node_id} transform={`translate(${layout.x}, ${layout.y})`} className="cursor-pointer group" onClick={() => onZoneClick(zone.node_id)}>
                 {/* Pulse for high density */}
                 {isHigh && (
                   <circle cx="0" cy="0" r="45" fill="none" stroke={color} strokeWidth="4">
                     <animate attributeName="r" from="45" to="90" dur="1.5s" repeatCount="indefinite" />
                     <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                   </circle>
                 )}
                 
                 {/* Main Zone Circle */}
                 <circle 
                   cx="0" cy="0" 
                   r={isHigh ? 50 : 45} 
                   fill={color} 
                   className="transition-all duration-300 group-hover:r-55"
                   stroke="#fff" 
                   strokeWidth="3" 
                 />
                 
                 {/* Text Labels */}
                 <text x="0" y="-5" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif" className="pointer-events-none">
                   {layout.abbr}
                 </text>
                 <text x="0" y="20" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800" fontFamily="'Plus Jakarta Sans', sans-serif" className="pointer-events-none number-display">
                   {Math.round(density * 100)}%
                 </text>
               </g>
             );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#10B981]" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Available</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Moderate</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Crowded</span>
          </div>
        </div>

        {/* Demo Text */}
        <div className="absolute bottom-6 right-6">
          <span className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.2em]">
            Demo Mode — Connect Maps API for live map
          </span>
        </div>
      </div>
    );
  };

  try {
    if ((typeof __DEMO_MODE__ !== 'undefined' && __DEMO_MODE__) || !window.google) {
      return renderDemoMap();
    }

    return (
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={STADIUM_CENTER}
        options={mapOptions}
      >
        {heatmapData.length > 0 && (
          <HeatmapLayer
            data={heatmapData}
            options={{
              radius: 40,
              opacity: 0.6,
            }}
          />
        )}

        {zones.map((zone) => {
          const coord = ZONE_COORDINATES[zone.node_id];
          if (!coord) return null;
          
          return (
            <Marker
              key={zone.node_id}
              position={coord}
              icon={getMarkerIcon(zone.density)}
              onClick={() => onZoneClick(zone.node_id)}
              aria-label={`Zone ${zone.node_name || zone.node_id}: ${Math.round(zone.density * 100)}% density`}
              aria-hidden="false"
            />
          );
        })}
      </GoogleMap>
    );
  } catch (err) {
    console.error("Map rendering failed, falling back to SVG", err);
    return renderDemoMap();
  }
};
