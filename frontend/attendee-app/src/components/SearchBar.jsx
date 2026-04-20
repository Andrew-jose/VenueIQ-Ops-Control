import React, { useState } from 'react';
import { ZONE_COORDINATES } from '../config/maps';

export const SearchBar = ({ zones, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const zoneContext = zones
        .map((z) => 
          `${z.node_id}: density=${Math.round((z.density || 0)*100)}%, confidence=${z.confidence_score || 'Medium'}`)
        .join('\n');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are VenueIQ, a smart stadium navigation assistant. 
A stadium attendee asks: "${query}"

Current zone densities (lower % = less crowded = better):
${zoneContext}

Respond in this exact JSON format only, no markdown:
{
  "recommendation": "Zone name here",
  "zone_id": "zone_id_here", 
  "reason": "One sentence explaining why this zone is best",
  "walk_time": "X min walk",
  "density_percent": 45
}

Pick the zone most relevant to the query with the lowest density.`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 200
            }
          })
        }
      );

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
      setRecommendation(parsed);
      
    } catch (err) {
      console.error(err);
      // Fallback: find lowest density zone relevant to query
      if (zones && zones.length > 0) {
        const sortedZones = [...zones].sort((a, b) => a.density - b.density);
        const lowest = sortedZones[0];
        if (lowest) {
          setRecommendation({
            recommendation: lowest.node_name || lowest.node_id,
            zone_id: lowest.node_id,
            reason: "Nearest available low-density zone",
            walk_time: "2 min walk",
            density_percent: Math.round(lowest.density * 100)
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateClick = () => {
    if (recommendation && recommendation.zone_id) {
      onNavigate(recommendation.zone_id);
      setRecommendation(null);
      setQuery('');
    }
  };

  return (
    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md z-10" style={{ pointerEvents: 'auto' }}>
      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="search-input" className="sr-only">Search for amenities</label>
        <div className="relative flex items-center bg-white rounded-full shadow-lg overflow-hidden p-1 border border-gray-200">
          <input
            id="search-input"
            type="text"
            className="flex-1 px-4 py-3 min-h-[44px] text-gray-800 focus:outline-none"
            placeholder="Search for amenities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded-full px-6 py-3 min-h-[44px] font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : (
              'Find'
            )}
          </button>
        </div>
      </form>

      {recommendation && (
        <div className="mt-3 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                {recommendation.recommendation}
              </h3>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                {recommendation.walk_time}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <span className="text-blue-500 text-lg">✦</span>
              <p className="text-sm font-medium leading-tight">
                {recommendation.reason}
              </p>
            </div>

            <div className="flex items-center justify-between mb-5 bg-gray-50 p-3 rounded-xl">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Density Level</span>
              <span className="text-2xl font-extrabold text-gray-900 number-display">
                {recommendation.density_percent}%
              </span>
            </div>

            <button
              onClick={handleNavigateClick}
              className="w-full bg-blue-600 text-white min-h-[48px] py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              Start Navigation
            </button>
            
            <p className="text-[9px] text-center text-gray-400 mt-4 uppercase tracking-widest font-medium">
              Powered by Gemini Flash
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
