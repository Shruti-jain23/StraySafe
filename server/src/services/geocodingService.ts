class GeocodingService {
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      // In production, use Google Maps Geocoding API
      if (process.env.GOOGLE_MAPS_API_KEY) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          return data.results[0].formatted_address;
        }
      }
      
      // Fallback to coordinates
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  }

  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      if (process.env.GOOGLE_MAPS_API_KEY) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          return { lat: location.lat, lng: location.lng };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();