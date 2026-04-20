import React, { useState } from 'react';

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

  const getDensityColor = (density) => {
    if (density > 80) return '#EF4444';
    if (density < 50) return '#10B981';
    return '#F59E0B';
  };

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md z-10" style={{ pointerEvents: 'auto' }}>
      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="search-input" className="sr-only">Search for amenities</label>
        <div className="relative flex items-center bg-[#0F1A1C]/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden p-1 border border-[#1A2E30] focus-within:border-[#F59E0B] focus-within:ring-2 focus-within:ring-[#F59E0B]/20 transition-all">
          <input
            id="search-input"
            type="text"
            className="flex-1 px-4 py-3 min-h-[44px] text-[#F0F4F5] bg-transparent focus:outline-none"
            placeholder="Search for amenities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#F59E0B] text-[#080C0E] rounded-xl px-6 py-3 min-h-[44px] font-bold hover:bg-[#FB923C] disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-[#080C0E]/30 border-t-[#080C0E] rounded-full" />
                Find
              </span>
            ) : (
              'Find'
            )}
          </button>
        </div>
      </form>

      {recommendation && (
        <div className="mt-4 bg-[#0F1A1C]/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-[#1A2E30] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-extrabold text-[#F0F4F5] tracking-tighter">
                {recommendation.recommendation}
              </h3>
              <span className="bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap border border-[#F59E0B]/20 tracking-widest uppercase">
                {recommendation.walk_time}
              </span>
            </div>
            
            <div className="flex items-start gap-2 mb-4 text-[#F0F4F5]">
              <span className="text-[#F59E0B] text-lg mt-[-2px]">✦</span>
              <p className="text-sm font-bold leading-tight text-[#6B8A8D]">
                {recommendation.reason}
              </p>
            </div>

            <div className="flex items-center justify-between mb-5 bg-[#152124] p-3 rounded-xl border border-[#1A2E30]">
              <span className="text-[10px] font-bold text-[#6B8A8D] uppercase tracking-widest">Density Level</span>
              <span className="text-2xl font-black number-display" style={{ color: getDensityColor(recommendation.density_percent) }}>
                {recommendation.density_percent}%
              </span>
            </div>

            <button
              onClick={handleNavigateClick}
              className="w-full bg-gradient-to-r from-[#F59E0B] to-[#FB923C] text-[#080C0E] min-h-[52px] py-3 rounded-xl font-black shadow-lg shadow-[#F59E0B]/20 transition-all active:scale-[0.98] hover:opacity-90"
            >
              Start Navigation
            </button>
            
            <p className="text-[9px] text-center text-[#2A4A4D] mt-4 uppercase tracking-widest font-black">
              Powered by Gemini Flash
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
