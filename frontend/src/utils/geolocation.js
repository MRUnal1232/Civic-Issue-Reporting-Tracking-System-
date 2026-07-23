// Geolocation utility functions for getting current location and reverse geocoding

/**
 * Get current location coordinates using browser geolocation API
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

/**
 * Reverse geocode coordinates to get address using OpenStreetMap's Nominatim API.
 * Chosen over the Google Geocoding API because that API rejects HTTP-referrer-restricted
 * keys (REQUEST_DENIED), and this project already uses Leaflet/OSM for its map view.
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string>} Formatted address
 */
export const reverseGeocode = async (latitude, longitude) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });
  } catch (error) {
    throw new Error(`Failed to get address: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(`Geocoding failed: HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Geocoding failed: ${data.error}`);
  }

  if (!data.display_name) {
    throw new Error('No address found for the given coordinates');
  }

  return data.display_name;
};

/**
 * Get current location and return formatted address
 * @returns {Promise<{address: string, coordinates: {lat: number, lng: number}}>}
 */
export const getCurrentAddress = async () => {
  const location = await getCurrentLocation();
  const address = await reverseGeocode(location.latitude, location.longitude);

  return {
    address,
    coordinates: {
      lat: location.latitude,
      lng: location.longitude
    }
  };
};
