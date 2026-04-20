import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';

const ZONES = [
  "Gate A1", "Gate A2", "North Concourse", "South Concourse",
  "East Wing", "West Wing", "VIP Lounge", "Food Court A",
  "Food Court B", "Restroom North", "Restroom South", "Merch Stand"
];

export function useZoneDensity() {
  const [densities, setDensities] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;
    const useMock = true; // Fallback to mock

    const generateMockData = () => {
      const newData = ZONES.map((name, index) => {
        const baseDensity = Math.random();
        
        let current = baseDensity;
        const forecastData = Array.from({ length: 3 }).map((_, i) => {
          const delta = (Math.random() * 0.2) - 0.1; // -0.1 to +0.1
          current = Math.max(0, Math.min(1, current + delta));
          return { time: `t+${i+1}`, density: current };
        });

        return {
          id: `zone_${index + 1}`,
          name,
          density: baseDensity,
          forecastData,
          confidence: Math.random() > 0.2 ? 'High' : 'Medium'
        };
      });
      setDensities(newData);
    };

    if (useMock) {
      generateMockData();
      interval = setInterval(generateMockData, 3000);
    } else {
      const densityRef = ref(database, 'zones');
      const unsubscribe = onValue(densityRef, (snapshot) => {
        if (snapshot.exists()) {
          // Process real data here
        } else {
          generateMockData();
        }
      }, (err) => {
        console.error("Firebase error, using mock:", err);
        generateMockData();
        interval = setInterval(generateMockData, 3000);
        setError(err);
      });
      return () => {
        unsubscribe();
        if (interval) clearInterval(interval);
      };
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return { densities, error };
}
