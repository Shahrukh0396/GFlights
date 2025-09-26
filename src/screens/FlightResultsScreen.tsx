import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useFlight } from '../context/FlightContext';
import { FlightOffer, FlightSearchRequest } from '../types/flight';

type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  FlightSearch: undefined;
  FlightResults: { searchRequest: FlightSearchRequest };
};

type FlightResultsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'FlightResults'
>;

type FlightResultsScreenRouteProp = RouteProp<
  RootStackParamList,
  'FlightResults'
>;

interface Props {
  navigation: FlightResultsScreenNavigationProp;
  route: FlightResultsScreenRouteProp;
}

const FlightResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { flightOffers, isLoading, searchError, clearSearchResults } = useFlight();
  const [selectedOffer, setSelectedOffer] = useState<FlightOffer | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Clear results when component unmounts
    return () => {
      clearSearchResults();
    };
  }, []);

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDuration = (duration: string) => {
    // Convert PT5H30M to 5h 30m format
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return duration;
    
    const hours = match[1] ? `${match[1]}h` : '';
    const minutes = match[2] ? ` ${match[2]}m` : '';
    return `${hours}${minutes}`.trim();
  };

  const getCarrierName = (carrierCode: string) => {
    const carriers: Record<string, string> = {
      AA: 'American Airlines',
      DL: 'Delta Air Lines',
      UA: 'United Airlines',
      BA: 'British Airways',
      LH: 'Lufthansa',
      AF: 'Air France',
      JL: 'Japan Airlines',
      EK: 'Emirates',
    };
    return carriers[carrierCode] || carrierCode;
  };

  const handleSelectFlight = (offer: FlightOffer) => {
    setSelectedOffer(offer);
    Alert.alert(
      'Flight Selected',
      `You selected ${getCarrierName(offer.itineraries[0].segments[0].carrierCode)} flight ${offer.itineraries[0].segments[0].number} for $${offer.price.total}`,
      [
        { text: 'Continue', onPress: () => console.log('Proceed to booking') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderFlightOffer = (offer: FlightOffer, index: number) => {
    const firstSegment = offer.itineraries[0].segments[0];
    const carrierName = getCarrierName(firstSegment.carrierCode);
    
    return (
      <TouchableOpacity
        key={offer.id}
        style={styles.flightCard}
        onPress={() => handleSelectFlight(offer)}
      >
        <View style={styles.flightHeader}>
          <View style={styles.carrierInfo}>
            <Text style={styles.carrierName}>{carrierName}</Text>
            <Text style={styles.flightNumber}>
              {firstSegment.carrierCode} {firstSegment.number}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${offer.price.total}</Text>
            <Text style={styles.priceCurrency}>{offer.price.currency}</Text>
          </View>
        </View>

        <View style={styles.flightRoute}>
          <View style={styles.departureInfo}>
            <Text style={styles.timeText}>
              {formatTime(firstSegment.departure.at)}
            </Text>
            <Text style={styles.airportText}>
              {firstSegment.departure.iataCode}
            </Text>
            <Text style={styles.terminalText}>
              {firstSegment.departure.terminal && `Terminal ${firstSegment.departure.terminal}`}
            </Text>
          </View>

          <View style={styles.flightPath}>
            <Text style={styles.durationText}>
              {formatDuration(offer.itineraries[0].duration)}
            </Text>
            <View style={styles.flightLine}>
              <View style={styles.flightDot} />
              <View style={styles.flightLinePath} />
              <View style={styles.flightDot} />
            </View>
            <Text style={styles.stopsText}>
              {firstSegment.numberOfStops === 0 ? 'Direct' : `${firstSegment.numberOfStops} stop${firstSegment.numberOfStops > 1 ? 's' : ''}`}
            </Text>
          </View>

          <View style={styles.arrivalInfo}>
            <Text style={styles.timeText}>
              {formatTime(firstSegment.arrival.at)}
            </Text>
            <Text style={styles.airportText}>
              {firstSegment.arrival.iataCode}
            </Text>
            <Text style={styles.terminalText}>
              {firstSegment.arrival.terminal && `Terminal ${firstSegment.arrival.terminal}`}
            </Text>
          </View>
        </View>

        <View style={styles.flightFooter}>
          <View style={styles.aircraftInfo}>
            <Text style={styles.aircraftText}>
              Aircraft: {firstSegment.aircraft.code}
            </Text>
          </View>
          <View style={styles.seatsInfo}>
            <Text style={styles.seatsText}>
              {offer.numberOfBookableSeats} seats available
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Results</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Searching for flights...</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Flight Results</Text>
        <TouchableOpacity
          style={styles.newSearchButton}
          onPress={() => navigation.navigate('FlightSearch')}
        >
          <Text style={styles.newSearchButtonText}>New Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Summary */}
        <View style={styles.searchSummary}>
          <Text style={styles.searchSummaryText}>
            {route.params.searchRequest.originLocationCode} → {route.params.searchRequest.destinationLocationCode}
          </Text>
          <Text style={styles.searchSummaryDate}>
            {new Date(route.params.searchRequest.departureDate).toLocaleDateString()}
          </Text>
          <Text style={styles.searchSummaryPassengers}>
            {route.params.searchRequest.adults} passenger{route.params.searchRequest.adults > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {flightOffers.length} flight{flightOffers.length !== 1 ? 's' : ''} found
          </Text>
          <Text style={styles.resultsSubtext}>
            Prices shown are per passenger
          </Text>
        </View>

        {/* Flight Results */}
        {searchError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{searchError}</Text>
          </View>
        ) : flightOffers.length > 0 ? (
          <View style={styles.flightsList}>
            {flightOffers.map((offer, index) => renderFlightOffer(offer, index))}
          </View>
        ) : (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No flights found</Text>
            <Text style={styles.noResultsSubtext}>
              Try adjusting your search criteria or dates
            </Text>
            <TouchableOpacity
              style={styles.newSearchButtonLarge}
              onPress={() => navigation.navigate('FlightSearch')}
            >
              <Text style={styles.newSearchButtonLargeText}>New Search</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  newSearchButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  newSearchButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  placeholder: {
    width: 80,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  searchSummary: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  searchSummaryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  searchSummaryDate: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  searchSummaryPassengers: {
    fontSize: 14,
    color: '#666666',
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  resultsSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  flightsList: {
    gap: 16,
  },
  flightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  carrierInfo: {
    flex: 1,
  },
  carrierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  flightNumber: {
    fontSize: 14,
    color: '#666666',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  priceCurrency: {
    fontSize: 12,
    color: '#666666',
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  departureInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  arrivalInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  airportText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  terminalText: {
    fontSize: 12,
    color: '#999999',
  },
  flightPath: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  durationText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  flightLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  flightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  flightLinePath: {
    flex: 1,
    height: 2,
    backgroundColor: '#007AFF',
    marginHorizontal: 4,
  },
  stopsText: {
    fontSize: 12,
    color: '#666666',
  },
  flightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
  },
  aircraftInfo: {
    flex: 1,
  },
  aircraftText: {
    fontSize: 12,
    color: '#666666',
  },
  seatsInfo: {
    alignItems: 'flex-end',
  },
  seatsText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
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
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  newSearchButtonLarge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  newSearchButtonLargeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FlightResultsScreen;
