import { useState, useEffect } from 'react';

const MOCK_NODE_IDS = [
  'gate_A1', 'gate_A2', 'gate_B1', 'gate_B2',
  'concourse_N', 'concourse_S', 'concourse_E', 'concourse_W',
  'zone_1', 'zone_2', 'zone_3', 'zone_4'
];

export const useZoneDensity = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mockInterval;
    
    const generateMockData = () => {
      const mockZones = MOCK_NODE_IDS.map((id) => {
        const density = 0.3 + Math.random() * 0.6;
        return {
          node_id: id,
          node_name: id.replace('_', ' ').toUpperCase(),
          density,
          predicted_density: [
            Math.min(1, Math.max(0, density + (Math.random() * 0.2 - 0.1))), 
            Math.min(1, Math.max(0, density + (Math.random() * 0.2 - 0.1))), 
            Math.min(1, Math.max(0, density + (Math.random() * 0.2 - 0.1)))
          ],
          confidence_score: Math.random() > 0.2 ? "high" : "medium"
        };
      });
      setZones(mockZones);
      setLoading(false);
    };

    generateMockData();
    mockInterval = setInterval(generateMockData, 5000);

    return () => {
      if (mockInterval) clearInterval(mockInterval);
    };
  }, []);

  return { zones, loading, error };
};
