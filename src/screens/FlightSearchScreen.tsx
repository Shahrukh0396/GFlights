import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useFlight } from '../context/FlightContext';
import { FlightSearchRequest, FlightOffer, Airport } from '../types/flight';
import flightService from '../services/flightService';
import {Calendar, LocaleConfig} from 'react-native-calendars';

// Configure calendar locale
LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
  dayNames: [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today'
};
LocaleConfig.defaultLocale = 'en';

type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  AirportMap: undefined;
  FlightSearch: { selectedAirports?: { origin?: Airport; destination?: Airport } };
  FlightResults: { searchRequest: FlightSearchRequest };
};

type FlightSearchScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'FlightSearch'
>;

type FlightSearchScreenRouteProp = RouteProp<
  RootStackParamList,
  'FlightSearch'
>;

interface Props {
  navigation: FlightSearchScreenNavigationProp;
  route: FlightSearchScreenRouteProp;
}

const FlightSearchScreen: React.FC<Props> = ({ navigation, route }) => {
  const { searchFlights, isLoading, searchError } = useFlight();
  const insets = useSafeAreaInsets();
  
  const [searchRequest, setSearchRequest] = useState<FlightSearchRequest>({
    originLocationCode: '',
    destinationLocationCode: '',
    departureDate: '',
    returnDate: '',
    adults: 1,
    children: 0,
    infants: 0,
    travelClass: 'ECONOMY',
    currencyCode: 'USD',
  });

  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [showAirportModal, setShowAirportModal] = useState(false);
  const [selectedAirportType, setSelectedAirportType] = useState<'origin' | 'destination'>('origin');
  const [airportSearchQuery, setAirportSearchQuery] = useState('');
  const [airportSearchResults, setAirportSearchResults] = useState<Airport[]>([]);
  const [isSearchingAirports, setIsSearchingAirports] = useState(false);
  const [selectedAirports, setSelectedAirports] = useState<{
    origin?: Airport;
    destination?: Airport;
  }>({});
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDateType, setSelectedDateType] = useState<'departure' | 'return'>('departure');

  // Format date for input
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle date selection from calendar
  const handleDateSelect = (day: any) => {
    const selectedDate = day.dateString;
    console.log('Selected date:', selectedDate, 'Type:', selectedDateType);
    
    if (selectedDateType === 'departure') {
      setSearchRequest(prev => ({ ...prev, departureDate: selectedDate }));
    } else {
      setSearchRequest(prev => ({ ...prev, returnDate: selectedDate }));
    }
    
    setShowCalendarModal(false);
  };

  // Open calendar modal for date selection
  const openCalendarModal = (dateType: 'departure' | 'return') => {
    setSelectedDateType(dateType);
    setShowCalendarModal(true);
  };

  // Get today's date and tomorrow's date
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  useEffect(() => {
    setSearchRequest(prev => ({
      ...prev,
      departureDate: formatDateForInput(tomorrow),
      returnDate: isRoundTrip ? formatDateForInput(new Date(tomorrow.getTime() + 7 * 24 * 60 * 60 * 1000)) : '',
    }));
  }, [isRoundTrip]);

  // Handle selected airports from map screen
  useEffect(() => {
    if (route.params?.selectedAirports) {
      const { origin, destination } = route.params.selectedAirports;
      
      if (origin) {
        setSearchRequest(prev => ({
          ...prev,
          originLocationCode: origin.skyId || origin.iataCode,
          originEntityId: origin.entityId || origin.id,
        }));
        setSelectedAirports(prev => ({ ...prev, origin }));
      }
      
      if (destination) {
        setSearchRequest(prev => ({
          ...prev,
          destinationLocationCode: destination.skyId || destination.iataCode,
          destinationEntityId: destination.entityId || destination.id,
        }));
        setSelectedAirports(prev => ({ ...prev, destination }));
      }
    }
  }, [route.params?.selectedAirports]);

  const handleSearch = async () => {
    if (!searchRequest.originLocationCode || !searchRequest.destinationLocationCode || !searchRequest.departureDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (searchRequest.originLocationCode === searchRequest.destinationLocationCode) {
      Alert.alert('Invalid Route', 'Origin and destination cannot be the same');
      return;
    }

    console.log('Search request data:', JSON.stringify(searchRequest, null, 2));

    try {
      await searchFlights(searchRequest);
      navigation.navigate('FlightResults', { searchRequest });
    } catch (error: any) {
      Alert.alert('Search Error', error.message || 'Failed to search flights');
    }
  };

  // Search airports
  const searchAirports = async (query: string) => {
    if (query.length < 2) {
      setAirportSearchResults([]);
      return;
    }

    try {
      setIsSearchingAirports(true);
      const response = await flightService.searchAirports(query);
      setAirportSearchResults(response.data);
    } catch (error: any) {
      console.error('Airport search error:', error);
      Alert.alert('Search Error', error.message || 'Failed to search airports');
    } finally {
      setIsSearchingAirports(false);
    }
  };

  const handleAirportSelect = (airport: Airport) => {
    console.log('Selected airport:', airport);
    
    if (selectedAirportType === 'origin') {
      setSearchRequest(prev => ({ 
        ...prev, 
        originLocationCode: airport.skyId || airport.iataCode, // Use skyId if available, fallback to iataCode
        originEntityId: airport.entityId || airport.id // Use entityId if available, fallback to id
      }));
      setSelectedAirports(prev => ({ ...prev, origin: airport }));
    } else {
      setSearchRequest(prev => ({ 
        ...prev, 
        destinationLocationCode: airport.skyId || airport.iataCode, // Use skyId if available, fallback to iataCode
        destinationEntityId: airport.entityId || airport.id // Use entityId if available, fallback to id
      }));
      setSelectedAirports(prev => ({ ...prev, destination: airport }));
    }
    setShowAirportModal(false);
    setAirportSearchQuery('');
    setAirportSearchResults([]);
  };

  const handleAirportCodeSelect = (airportCode: string) => {
    // For hardcoded airport codes, we'll need to search for the airport to get the entity ID
    // This is a fallback for the popular airports
    const popularAirportMap: Record<string, { name: string; skyId: string; entityId: string }> = {
      'JFK': { name: 'John F. Kennedy International', skyId: 'NYCA', entityId: '27537542' },
      'LAX': { name: 'Los Angeles International', skyId: 'LAXA', entityId: '27537542' },
      'SFO': { name: 'San Francisco International', skyId: 'SFOA', entityId: '27537542' },
      'ORD': { name: 'Chicago O\'Hare International', skyId: 'CHIA', entityId: '27537542' },
      'DFW': { name: 'Dallas/Fort Worth International', skyId: 'DFWA', entityId: '27537542' },
      'ATL': { name: 'Hartsfield-Jackson Atlanta International', skyId: 'ATLA', entityId: '27537542' },
      'LHR': { name: 'London Heathrow', skyId: 'LOND', entityId: '27544008' },
      'CDG': { name: 'Charles de Gaulle', skyId: 'PARI', entityId: '27544008' },
      'NRT': { name: 'Narita International', skyId: 'TOKY', entityId: '27544008' },
      'DXB': { name: 'Dubai International', skyId: 'DUBA', entityId: '27544008' },
    };

    const airportInfo = popularAirportMap[airportCode];
    if (airportInfo) {
      const mockAirport: Airport = {
        type: 'airport',
        subType: 'airport',
        name: airportInfo.name,
        detailedName: `${airportCode} - ${airportInfo.name}`,
        id: airportInfo.entityId,
        skyId: airportInfo.skyId,
        entityId: airportInfo.entityId,
        self: { href: '', methods: ['GET'] },
        timeZoneOffset: '+00:00',
        iataCode: airportCode,
        geoCode: { latitude: 0, longitude: 0 },
        address: {
          cityName: '',
          cityCode: airportCode,
          countryName: '',
          countryCode: '',
          regionCode: ''
        },
        analytics: { travelers: { score: 0 } }
      };
      handleAirportSelect(mockAirport);
    }
  };

  const swapAirports = () => {
    setSearchRequest(prev => ({
      ...prev,
      originLocationCode: prev.destinationLocationCode,
      destinationLocationCode: prev.originLocationCode,
    }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Flights</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trip Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Type</Text>
          <View style={styles.tripTypeContainer}>
            <TouchableOpacity
              style={[
                styles.tripTypeButton,
                !isRoundTrip && styles.tripTypeButtonActive
              ]}
              onPress={() => setIsRoundTrip(false)}
            >
              <Text style={[
                styles.tripTypeButtonText,
                !isRoundTrip && styles.tripTypeButtonTextActive
              ]}>
                One Way
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tripTypeButton,
                isRoundTrip && styles.tripTypeButtonActive
              ]}
              onPress={() => setIsRoundTrip(true)}
            >
              <Text style={[
                styles.tripTypeButtonText,
                isRoundTrip && styles.tripTypeButtonTextActive
              ]}>
                Round Trip
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Airports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From & To</Text>
          <View style={styles.airportContainer}>
            <TouchableOpacity
              style={styles.airportInput}
              onPress={() => {
                setSelectedAirportType('origin');
                setShowAirportModal(true);
              }}
            >
              <Text style={styles.airportLabel}>From</Text>
              <Text style={[
                styles.airportCode,
                !searchRequest.originLocationCode && styles.airportCodePlaceholder
              ]}>
                {searchRequest.originLocationCode || 'Select airport'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.swapButton} onPress={swapAirports}>
              <Text style={styles.swapButtonText}>⇄</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.airportInput}
              onPress={() => {
                setSelectedAirportType('destination');
                setShowAirportModal(true);
              }}
            >
              <Text style={styles.airportLabel}>To</Text>
              <Text style={[
                styles.airportCode,
                !searchRequest.destinationLocationCode && styles.airportCodePlaceholder
              ]}>
                {searchRequest.destinationLocationCode || 'Select airport'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Departure Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => openCalendarModal('departure')}
          >
            <Text style={[
              styles.dateButtonText,
              !searchRequest.departureDate && styles.dateButtonPlaceholder
            ]}>
              {searchRequest.departureDate 
                ? formatDateForDisplay(searchRequest.departureDate)
                : 'Select departure date'
              }
            </Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
          
          {isRoundTrip && (
            <>
              <Text style={styles.sectionTitle}>Return Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => openCalendarModal('return')}
              >
                <Text style={[
                  styles.dateButtonText,
                  !searchRequest.returnDate && styles.dateButtonPlaceholder
                ]}>
                  {searchRequest.returnDate 
                    ? formatDateForDisplay(searchRequest.returnDate)
                    : 'Select return date'
                  }
                </Text>
                <Text style={styles.calendarIcon}>📅</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Passengers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passengers</Text>
          <View style={styles.passengerContainer}>
            <View style={styles.passengerRow}>
              <Text style={styles.passengerLabel}>Adults</Text>
              <View style={styles.passengerControls}>
                <TouchableOpacity
                  style={styles.passengerButton}
                  onPress={() => setSearchRequest(prev => ({
                    ...prev,
                    adults: Math.max(1, prev.adults - 1)
                  }))}
                >
                  <Text style={styles.passengerButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.passengerCount}>{searchRequest.adults}</Text>
                <TouchableOpacity
                  style={styles.passengerButton}
                  onPress={() => setSearchRequest(prev => ({
                    ...prev,
                    adults: Math.min(9, prev.adults + 1)
                  }))}
                >
                  <Text style={styles.passengerButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.passengerRow}>
              <Text style={styles.passengerLabel}>Children (2-11)</Text>
              <View style={styles.passengerControls}>
                <TouchableOpacity
                  style={styles.passengerButton}
                  onPress={() => setSearchRequest(prev => ({
                    ...prev,
                    children: Math.max(0, (prev.children || 0) - 1)
                  }))}
                >
                  <Text style={styles.passengerButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.passengerCount}>{searchRequest.children}</Text>
                <TouchableOpacity
                  style={styles.passengerButton}
                  onPress={() => setSearchRequest(prev => ({
                    ...prev,
                    children: Math.min(9, (prev.children || 0) + 1)
                  }))}
                >
                  <Text style={styles.passengerButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Class */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Class</Text>
          <View style={styles.classContainer}>
            {['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'].map((className) => (
              <TouchableOpacity
                key={className}
                style={[
                  styles.classButton,
                  searchRequest.travelClass === className && styles.classButtonActive
                ]}
                onPress={() => setSearchRequest(prev => ({ 
                  ...prev, 
                  travelClass: className as any 
                }))}
              >
                <Text style={[
                  styles.classButtonText,
                  searchRequest.travelClass === className && styles.classButtonTextActive
                ]}>
                  {className.charAt(0) + className.slice(1).toLowerCase().replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.searchButtonText}>Search Flights</Text>
          )}
        </TouchableOpacity>

        {searchError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{searchError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Airport Selection Modal */}
      <Modal
        visible={showAirportModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {selectedAirportType === 'origin' ? 'Origin' : 'Destination'} Airport
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAirportModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Airport Search */}
            <View style={styles.searchSection}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search airports..."
                value={airportSearchQuery}
                onChangeText={(text) => {
                  setAirportSearchQuery(text);
                  searchAirports(text);
                }}
                autoFocus
              />
              {isSearchingAirports && (
                <ActivityIndicator style={styles.searchLoader} color="#007AFF" />
              )}
            </View>

            {/* Search Results */}
            {airportSearchResults.length > 0 && (
              <View style={styles.searchResultsSection}>
                <Text style={styles.searchResultsTitle}>Search Results</Text>
                {airportSearchResults.map((airport) => (
                  <TouchableOpacity
                    key={airport.id}
                    style={styles.airportResultItem}
                    onPress={() => handleAirportSelect(airport)}
                  >
                    <Text style={styles.airportResultCode}>{airport.iataCode}</Text>
                    <View style={styles.airportResultDetails}>
                      <Text style={styles.airportResultName}>{airport.name}</Text>
                      <Text style={styles.airportResultLocation}>
                        {airport.address.cityName}, {airport.address.countryName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Popular airports for quick selection */}
            <View style={styles.popularAirportsSection}>
              <Text style={styles.popularAirportsTitle}>Popular Airports</Text>
              {['JFK', 'LAX', 'SFO', 'ORD', 'DFW', 'ATL', 'LHR', 'CDG', 'NRT', 'DXB'].map((code) => (
                <TouchableOpacity
                  key={code}
                  style={styles.popularAirportItem}
                  onPress={() => handleAirportCodeSelect(code)}
                >
                  <Text style={styles.popularAirportCode}>{code}</Text>
                  <Text style={styles.popularAirportName}>
                    {code === 'JFK' && 'John F. Kennedy International'}
                    {code === 'LAX' && 'Los Angeles International'}
                    {code === 'SFO' && 'San Francisco International'}
                    {code === 'ORD' && 'Chicago O\'Hare International'}
                    {code === 'DFW' && 'Dallas/Fort Worth International'}
                    {code === 'ATL' && 'Hartsfield-Jackson Atlanta International'}
                    {code === 'LHR' && 'London Heathrow'}
                    {code === 'CDG' && 'Charles de Gaulle'}
                    {code === 'NRT' && 'Narita International'}
                    {code === 'DXB' && 'Dubai International'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {selectedDateType === 'departure' ? 'Departure' : 'Return'} Date
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCalendarModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDateSelect}
              minDate={selectedDateType === 'departure' ? formatDateForInput(new Date()) : searchRequest.departureDate}
              maxDate={selectedDateType === 'departure' ? '2025-12-31' : '2025-12-31'}
              markedDates={{
                ...(searchRequest.departureDate && {
                  [searchRequest.departureDate]: {
                    selected: true,
                    selectedColor: '#007AFF',
                    selectedTextColor: '#ffffff'
                  }
                }),
                ...(searchRequest.returnDate && {
                  [searchRequest.returnDate]: {
                    selected: true,
                    selectedColor: '#007AFF',
                    selectedTextColor: '#ffffff'
                  }
                })
              }}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#007AFF',
                selectedDayBackgroundColor: '#007AFF',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#007AFF',
                dayTextColor: '#1a1a1a',
                textDisabledColor: '#d9d9d9',
                dotColor: '#007AFF',
                selectedDotColor: '#ffffff',
                arrowColor: '#007AFF',
                disabledArrowColor: '#d9d9d9',
                monthTextColor: '#1a1a1a',
                indicatorColor: '#007AFF',
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14
              }}
            />
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  tripTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
  },
  tripTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tripTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  tripTypeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  tripTypeButtonTextActive: {
    color: '#ffffff',
  },
  airportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  airportInput: {
    flex: 1,
  },
  airportLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  airportCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  airportCodePlaceholder: {
    color: '#999999',
    fontWeight: '400',
  },
  swapButton: {
    marginHorizontal: 16,
    padding: 8,
  },
  swapButtonText: {
    fontSize: 20,
    color: '#007AFF',
  },
  passengerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passengerLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  passengerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  passengerCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  classContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  classButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  classButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  classButtonTextActive: {
    color: '#ffffff',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  searchButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#666666',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  popularAirportsSection: {
    marginBottom: 24,
  },
  popularAirportsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  popularAirportItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularAirportCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 60,
  },
  popularAirportName: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  searchSection: {
    marginBottom: 20,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchLoader: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  searchResultsSection: {
    marginBottom: 20,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  airportResultItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  airportResultCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    width: 50,
  },
  airportResultDetails: {
    flex: 1,
    marginLeft: 12,
  },
  airportResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  airportResultLocation: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  dateButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  dateButtonPlaceholder: {
    color: '#999999',
  },
  calendarIcon: {
    fontSize: 18,
  },
  calendarContainer: {
    flex: 1,
    padding: 20,
  },
});

export default FlightSearchScreen;
