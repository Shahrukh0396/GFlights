import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFlight } from '../context/FlightContext';
import { FlightSearchRequest, FlightOffer } from '../types/flight';

type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  FlightSearch: undefined;
  FlightResults: { searchRequest: FlightSearchRequest };
};

type FlightSearchScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'FlightSearch'
>;

interface Props {
  navigation: FlightSearchScreenNavigationProp;
}

const FlightSearchScreen: React.FC<Props> = ({ navigation }) => {
  const { searchFlights, isLoading, searchError } = useFlight();
  
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

  // Format date for input
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
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

  const handleSearch = async () => {
    if (!searchRequest.originLocationCode || !searchRequest.destinationLocationCode || !searchRequest.departureDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (searchRequest.originLocationCode === searchRequest.destinationLocationCode) {
      Alert.alert('Invalid Route', 'Origin and destination cannot be the same');
      return;
    }

    try {
      await searchFlights(searchRequest);
      navigation.navigate('FlightResults', { searchRequest });
    } catch (error: any) {
      Alert.alert('Search Error', error.message || 'Failed to search flights');
    }
  };

  const handleAirportSelect = (airportCode: string) => {
    if (selectedAirportType === 'origin') {
      setSearchRequest(prev => ({ ...prev, originLocationCode: airportCode }));
    } else {
      setSearchRequest(prev => ({ ...prev, destinationLocationCode: airportCode }));
    }
    setShowAirportModal(false);
  };

  const swapAirports = () => {
    setSearchRequest(prev => ({
      ...prev,
      originLocationCode: prev.destinationLocationCode,
      destinationLocationCode: prev.originLocationCode,
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <TextInput
            style={styles.dateInput}
            value={searchRequest.departureDate}
            onChangeText={(text) => setSearchRequest(prev => ({ ...prev, departureDate: text }))}
            placeholder="YYYY-MM-DD"
          />
          
          {isRoundTrip && (
            <>
              <Text style={styles.sectionTitle}>Return Date</Text>
              <TextInput
                style={styles.dateInput}
                value={searchRequest.returnDate}
                onChangeText={(text) => setSearchRequest(prev => ({ ...prev, returnDate: text }))}
                placeholder="YYYY-MM-DD"
              />
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
                    children: Math.max(0, prev.children - 1)
                  }))}
                >
                  <Text style={styles.passengerButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.passengerCount}>{searchRequest.children}</Text>
                <TouchableOpacity
                  style={styles.passengerButton}
                  onPress={() => setSearchRequest(prev => ({
                    ...prev,
                    children: Math.min(9, prev.children + 1)
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
        <SafeAreaView style={styles.modalContainer}>
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
            {/* Popular airports for quick selection */}
            <View style={styles.popularAirportsSection}>
              <Text style={styles.popularAirportsTitle}>Popular Airports</Text>
              {['JFK', 'LAX', 'SFO', 'ORD', 'DFW', 'ATL', 'LHR', 'CDG', 'NRT', 'DXB'].map((code) => (
                <TouchableOpacity
                  key={code}
                  style={styles.popularAirportItem}
                  onPress={() => handleAirportSelect(code)}
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
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
  dateInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
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
});

export default FlightSearchScreen;
