if (!import.meta.env.VITE_MAPS_API_KEY || 
    import.meta.env.VITE_MAPS_API_KEY.includes('REPLACE')) {
  console.warn('VenueIQ: Running in demo mode - using mock map data');
}

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY || "";

export const STADIUM_CENTER = { lat: 13.0827, lng: 80.2707 };

export const ZONE_COORDINATES = {
  gate_A1: { lat: 13.0835, lng: 80.2697 },
  gate_A2: { lat: 13.0838, lng: 80.2702 },
  gate_B1: { lat: 13.0820, lng: 80.2697 },
  gate_B2: { lat: 13.0818, lng: 80.2702 },
  concourse_N: { lat: 13.0833, lng: 80.2707 },
  concourse_S: { lat: 13.0821, lng: 80.2707 },
  concourse_E: { lat: 13.0827, lng: 80.2715 },
  concourse_W: { lat: 13.0827, lng: 80.2699 },
  zone_1: { lat: 13.0831, lng: 80.2719 },
  zone_2: { lat: 13.0823, lng: 80.2719 },
  zone_3: { lat: 13.0831, lng: 80.2695 },
  zone_4: { lat: 13.0823, lng: 80.2695 },
};
