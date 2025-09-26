import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Airport } from '../types/flight';
import flightService from '../services/flightService';
import geolocationService, { LocationCoordinates } from '../services/geolocationService';

type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  AirportMap: undefined;
  FlightSearch: { selectedAirports: { origin?: Airport; destination?: Airport } };
  FlightResults: { searchRequest: any };
};

type AirportMapScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AirportMap'
>;

interface Props {
  navigation: AirportMapScreenNavigationProp;
}

const AirportMapScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedOrigin, setSelectedOrigin] = useState<Airport | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Airport | null>(null);
  const [nearbyAirports, setNearbyAirports] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAirportModal, setShowAirportModal] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination'>('origin');
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 10,
    longitudeDelta: 10,
  });

  // Default location (New York City)
  const defaultRegion = {
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 10,
    longitudeDelta: 10,
  };

  useEffect(() => {
    initializeLocationAndAirports();
  }, []);

  const initializeLocationAndAirports = async () => {
    try {
      setIsLocationLoading(true);
      
      // Get current location
      const location = await geolocationService.getLocationWithFallback();
      setCurrentLocation(location);
      
      // Update map region to current location
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 2, // Closer zoom for current location
        longitudeDelta: 2,
      });
      
      // Load nearby airports based on current location
      await loadNearbyAirports(location.latitude, location.longitude);
      
    } catch (error) {
      console.error('Error initializing location:', error);
      // Fallback to default location
      const defaultLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
      };
      setCurrentLocation(defaultLocation);
      await loadNearbyAirports(defaultLocation.latitude, defaultLocation.longitude);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const loadNearbyAirports = async (latitude?: number, longitude?: number) => {
    try {
      setIsLoading(true);
      
      // Use provided coordinates or current location
      const lat = latitude || currentLocation?.latitude || 40.7128;
      const lng = longitude || currentLocation?.longitude || -74.0060;
      
      console.log(`Loading nearby airports for coordinates: ${lat}, ${lng}`);
      const response = await flightService.getNearbyAirports(lat, lng);
      console.log('Nearby airports response:', response.data);
      
      // Transform the API response to match our Airport interface
      const nearbyAirportsData = (response.data as any)?.data?.nearby || [];
      const transformedAirports = transformAirportData(nearbyAirportsData);
      console.log('Transformed airports:', transformedAirports);
      setNearbyAirports(transformedAirports);
      
      // Update map region based on loaded airports
      if (transformedAirports.length > 0) {
        updateMapRegion(transformedAirports);
      }
    } catch (error: any) {
      console.error('Error loading nearby airports:', error);
      Alert.alert('Error', 'Failed to load airports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Airport coordinates mapping for major airports
  const getAirportCoordinates = (iataCode: string, airportName: string): { latitude: number; longitude: number } => {
    const coordinates: Record<string, { latitude: number; longitude: number }> = {
      'JFK': { latitude: 40.6413, longitude: -73.7781 },
      'LGA': { latitude: 40.7769, longitude: -73.8740 },
      'EWR': { latitude: 40.6895, longitude: -74.1745 },
      'NYCA': { latitude: 40.7128, longitude: -74.0060 }, // New York City area
      'LHR': { latitude: 51.4700, longitude: -0.4543 },
      'LGW': { latitude: 51.1481, longitude: -0.1903 },
      'STN': { latitude: 51.8860, longitude: 0.2389 },
      'LTN': { latitude: 51.8747, longitude: -0.3683 },
      'LAX': { latitude: 33.9416, longitude: -118.4085 },
      'SFO': { latitude: 37.6213, longitude: -122.3790 },
      'ORD': { latitude: 41.9786, longitude: -87.9048 },
      'DFW': { latitude: 32.8968, longitude: -97.0380 },
      'ATL': { latitude: 33.6407, longitude: -84.4277 },
      'MIA': { latitude: 25.7959, longitude: -80.2870 },
      'LAS': { latitude: 36.0840, longitude: -115.1537 },
      'SEA': { latitude: 47.4502, longitude: -122.3088 },
      'DEN': { latitude: 39.8561, longitude: -104.6737 },
      'BOS': { latitude: 42.3656, longitude: -71.0096 },
      'CDG': { latitude: 49.0097, longitude: 2.5479 },
      'FRA': { latitude: 50.0379, longitude: 8.5622 },
      'AMS': { latitude: 52.3105, longitude: 4.7683 },
      'DXB': { latitude: 25.2532, longitude: 55.3657 },
      'NRT': { latitude: 35.7720, longitude: 140.3928 },
      'ICN': { latitude: 37.4602, longitude: 126.4407 },
      'SYD': { latitude: -33.9399, longitude: 151.1753 },
    };

    // First try exact IATA code match
    if (coordinates[iataCode]) {
      return coordinates[iataCode];
    }

    // Try to extract IATA code from airport name (e.g., "New York John F. Kennedy (JFK)")
    const iataMatch = airportName.match(/\(([A-Z]{3})\)/);
    if (iataMatch && coordinates[iataMatch[1]]) {
      return coordinates[iataMatch[1]];
    }

    // Default coordinates based on city name patterns
    if (airportName.toLowerCase().includes('new york')) {
      return { latitude: 40.7128, longitude: -74.0060 };
    }
    if (airportName.toLowerCase().includes('london')) {
      return { latitude: 51.5074, longitude: -0.1278 };
    }
    if (airportName.toLowerCase().includes('los angeles')) {
      return { latitude: 34.0522, longitude: -118.2437 };
    }
    if (airportName.toLowerCase().includes('chicago')) {
      return { latitude: 41.8781, longitude: -87.6298 };
    }

    // Default fallback to NYC coordinates
    return { latitude: 40.7128, longitude: -74.0060 };
  };

  // Transform API response data to Airport interface
  const transformAirportData = (apiAirports: any[]): Airport[] => {
    return apiAirports.map((airport) => {
      console.log('Transformed airport:', airport);
      const iataCode = airport.skyId || airport.navigation?.relevantFlightParams?.skyId || 'N/A';
      const airportName = airport.navigation?.localizedName || airport.presentation?.title || 'Unknown Airport';
      const coordinates = getAirportCoordinates(iataCode, airportName);

      return {
        type: 'AIRPORT',
        subType: 'AIRPORT',
        name: airportName,
        detailedName: airport.presentation?.title || airportName,
        id: airport.navigation?.entityId || Math.random().toString(),
        skyId: airport.skyId || airport.navigation?.relevantFlightParams?.skyId,
        entityId: airport.navigation?.entityId,
        self: {
          href: '',
          methods: ['GET']
        },
        timeZoneOffset: '+00:00', // Default timezone
        iataCode: iataCode,
        geoCode: coordinates,
        address: {
          cityName: extractCityFromTitle(airport.presentation?.title || ''),
          cityCode: '',
          countryName: airport.presentation?.subtitle || 'Unknown',
          countryCode: '',
          regionCode: ''
        },
        analytics: {
          travelers: {
            score: 0
          }
        }
      };
    });
  };

  // Helper function to extract city name from title
  const extractCityFromTitle = (title: string): string => {
    // Extract city name from titles like "New York John F. Kennedy (JFK)" or "New York (Any)"
    const match = title.match(/^([^(]+)/);
    return match ? match[1].trim() : title;
  };

  // Update map region to fit all airports
  const updateMapRegion = (airports: Airport[]) => {
    if (airports.length === 0) return;

    // Filter out airports with invalid coordinates
    const validAirports = airports.filter(airport => 
      airport.geoCode.latitude !== 0 && 
      airport.geoCode.longitude !== 0 &&
      !isNaN(airport.geoCode.latitude) &&
      !isNaN(airport.geoCode.longitude)
    );

    if (validAirports.length === 0) {
      console.log('No valid airports with coordinates found');
      return;
    }

    console.log('Valid airports for map region:', validAirports);

    // Calculate bounds
    const latitudes = validAirports.map(airport => airport.geoCode.latitude);
    const longitudes = validAirports.map(airport => airport.geoCode.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calculate deltas with padding
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.1); // At least 0.1 degrees
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.1); // At least 0.1 degrees

    const newRegion = {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };

    console.log('Updating map region to:', newRegion);
    setMapRegion(newRegion);
  };

  const handleMarkerPress = (airport: Airport) => {
    setSelectedAirport(airport);
    setShowAirportModal(true);
  };

  const handleAirportSelect = (airport: Airport) => {
    if (selectionMode === 'origin') {
      setSelectedOrigin(airport);
    } else {
      setSelectedDestination(airport);
    }
    setShowAirportModal(false);
  };

  const handleContinue = () => {
    if (!selectedOrigin || !selectedDestination) {
      Alert.alert('Missing Selection', 'Please select both origin and destination airports.');
      return;
    }

    if (selectedOrigin.id === selectedDestination.id) {
      Alert.alert('Invalid Selection', 'Origin and destination airports cannot be the same.');
      return;
    }

    navigation.navigate('FlightSearch', {
      selectedAirports: {
        origin: selectedOrigin,
        destination: selectedDestination,
      },
    });
  };

  const handleSwapAirports = () => {
    const temp = selectedOrigin;
    setSelectedOrigin(selectedDestination);
    setSelectedDestination(temp);
  };

  const openSelectionModal = (mode: 'origin' | 'destination') => {
    setSelectionMode(mode);
    setShowAirportModal(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Airports</Text>
        <Text style={styles.headerSubtitle}>Choose your origin and destination</Text>
      </View>

      {/* Selected Airports Display */}
      <View style={styles.selectedAirportsContainer}>
        <TouchableOpacity
          style={[styles.airportCard, selectedOrigin && styles.airportCardSelected]}
          onPress={() => openSelectionModal('origin')}
        >
          <Text style={styles.airportCardLabel}>From</Text>
          <Text style={styles.airportCardText}>
            {selectedOrigin ? `${selectedOrigin.iataCode} - ${selectedOrigin.name}` : 'Select origin airport'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.swapButton} onPress={handleSwapAirports}>
          <Text style={styles.swapButtonText}>⇄</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.airportCard, selectedDestination && styles.airportCardSelected]}
          onPress={() => openSelectionModal('destination')}
        >
          <Text style={styles.airportCardLabel}>To</Text>
          <Text style={styles.airportCardText}>
            {selectedDestination ? `${selectedDestination.iataCode} - ${selectedDestination.name}` : 'Select destination airport'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {isLocationLoading || isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {isLocationLoading ? 'Getting your location...' : 'Loading airports...'}
            </Text>
            {currentLocation && (
              <Text style={styles.locationText}>
                Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.mapContainer}>
            {/* Refresh Location Button */}
            <TouchableOpacity 
              style={styles.refreshLocationButton}
              onPress={initializeLocationAndAirports}
            >
              <Text style={styles.refreshLocationButtonText}>📍</Text>
            </TouchableOpacity>
            
            <MapView
              style={styles.map}
              initialRegion={defaultRegion}
              region={mapRegion}
              showsUserLocation={true}
              showsMyLocationButton={true}
              onMapReady={() => console.log('Map is ready!')}
            >
            {nearbyAirports.map((airport) => (
              <Marker
                key={airport.id}
                coordinate={{
                  latitude: airport.geoCode.latitude,
                  longitude: airport.geoCode.longitude,
                }}
                title={airport.name}
                description={`${airport.iataCode} - ${airport.address.cityName}, ${airport.address.countryName}`}
                onPress={() => handleMarkerPress(airport)}
                pinColor={
                  selectedOrigin?.id === airport.id ? '#4CAF50' :
                  selectedDestination?.id === airport.id ? '#F44336' : '#007AFF'
                }
              />
            ))}
            </MapView>
          </View>
        )}
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedOrigin || !selectedDestination) && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedOrigin || !selectedDestination}
        >
          <Text style={styles.continueButtonText}>Continue to Search</Text>
        </TouchableOpacity>
      </View>

      {/* Airport Selection Modal */}
      <Modal
        visible={showAirportModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {selectionMode === 'origin' ? 'Origin' : 'Destination'} Airport
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAirportModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.airportList}>
            {nearbyAirports.map((airport) => (
              <TouchableOpacity
                key={airport.id}
                style={styles.airportItem}
                onPress={() => handleAirportSelect(airport)}
              >
                <View style={styles.airportItemContent}>
                  <Text style={styles.airportCode}>{airport.iataCode}</Text>
                  <View style={styles.airportDetails}>
                    <Text style={styles.airportName}>{airport.name}</Text>
                    <Text style={styles.airportLocation}>
                      {airport.address.cityName}, {airport.address.countryName}
                    </Text>
                  </View>
                </View>
                <View style={styles.airportMarker}>
                  <Text style={styles.airportMarkerText}>📍</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  selectedAirportsContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  airportCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  airportCardSelected: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  airportCardLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  airportCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  swapButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  swapButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  locationText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  refreshLocationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  refreshLocationButtonText: {
    fontSize: 24,
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalCloseButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#666666',
  },
  airportList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  airportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  airportItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  airportCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 60,
  },
  airportDetails: {
    flex: 1,
    marginLeft: 12,
  },
  airportName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  airportLocation: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  airportMarker: {
    marginLeft: 12,
  },
  airportMarkerText: {
    fontSize: 20,
  },
});

export default AirportMapScreen;

