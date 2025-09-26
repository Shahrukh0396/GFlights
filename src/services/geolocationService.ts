import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationError {
  code: number;
  message: string;
}

class GeolocationService {
  // Request location permissions for Android
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return true; // iOS permissions are handled in Info.plist
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to find nearby airports.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission granted');
        return true;
      } else {
        console.log('Location permission denied');
        return false;
      }
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      return false;
    }
  }

  // Get current location with error handling
  async getCurrentLocation(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      // First check if we have permission
      this.requestLocationPermission().then((hasPermission) => {
        if (!hasPermission) {
          reject({
            code: 1,
            message: 'Location permission denied'
          });
          return;
        }

        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log(`Current location: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
            
            resolve({
              latitude,
              longitude,
              accuracy
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            
            let errorMessage = 'Unable to get your location';
            
            switch (error.code) {
              case 1:
                errorMessage = 'Location permission denied';
                break;
              case 2:
                errorMessage = 'Location unavailable';
                break;
              case 3:
                errorMessage = 'Location request timed out';
                break;
              default:
                errorMessage = 'Unknown location error';
            }

            reject({
              code: error.code,
              message: errorMessage
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
            distanceFilter: 100,
          }
        );
      });
    });
  }

  // Get location with fallback to default coordinates
  async getLocationWithFallback(): Promise<LocationCoordinates> {
    try {
      const location = await this.getCurrentLocation();
      return location;
    } catch (error: any) {
      console.log('Using fallback location due to error:', error.message);
      
      // Show user-friendly error message
      Alert.alert(
        'Location Unavailable',
        'Unable to get your current location. Using default location (New York City). You can manually select your location on the map.',
        [{ text: 'OK' }]
      );

      // Return default coordinates (New York City)
      return {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: undefined
      };
    }
  }

  // Watch location changes (for future use)
  watchLocation(
    onLocationUpdate: (location: LocationCoordinates) => void,
    onError: (error: LocationError) => void
  ): number {
    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        onLocationUpdate({ latitude, longitude, accuracy });
      },
      (error) => {
        onError({
          code: error.code,
          message: error.message
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        distanceFilter: 100,
      }
    );

    return watchId;
  }

  // Stop watching location
  clearWatch(watchId: number): void {
    Geolocation.clearWatch(watchId);
  }

  // Calculate distance between two coordinates (in kilometers)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export default new GeolocationService();
