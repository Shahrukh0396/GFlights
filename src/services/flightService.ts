import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FlightSearchRequest,
  FlightSearchResponse,
  FlightSearchError,
  AirportSearchResponse,
  RecentSearch,
  PopularRoute,
} from '../types/flight';

const RECENT_SEARCHES_KEY = '@gflights_recent_searches';
const POPULAR_ROUTES_KEY = '@gflights_popular_routes';

// For demo purposes, we'll use mock data since Amadeus API requires backend setup
// In production, you would make actual API calls to your backend
class FlightService {
  private baseUrl = 'http://localhost:3000'; // Your backend URL

  // Mock flight search data for demonstration
  private mockFlightOffers = [
    {
      id: '1',
      source: 'GDS',
      instantTicketingRequired: false,
      lastTicketingDate: '2024-12-31',
      numberOfBookableSeats: 9,
      itineraries: [
        {
          duration: 'PT5H30M',
          segments: [
            {
              departure: {
                iataCode: 'JFK',
                terminal: '4',
                at: '2024-01-15T08:30:00',
              },
              arrival: {
                iataCode: 'LAX',
                terminal: '1',
                at: '2024-01-15T11:00:00',
              },
              carrierCode: 'AA',
              number: '100',
              aircraft: { code: 'B737' },
              duration: 'PT5H30M',
              id: '1',
              numberOfStops: 0,
              blacklistedInEU: false,
            },
          ],
        },
      ],
      price: {
        currency: 'USD',
        total: '299.00',
        base: '250.00',
        grandTotal: '299.00',
      },
      pricingOptions: {
        fareType: ['PUBLISHED'],
        includedCheckedBagsOnly: true,
      },
      validatingAirlineCodes: ['AA'],
      travelerPricings: [
        {
          travelerId: '1',
          fareOption: 'STANDARD',
          travelerType: 'ADULT',
          price: {
            currency: 'USD',
            total: '299.00',
            base: '250.00',
            grandTotal: '299.00',
          },
          fareDetailsBySegment: [
            {
              segmentId: '1',
              cabin: 'ECONOMY',
              fareBasis: 'Y',
              class: 'Y',
              includedCheckedBags: {
                quantity: 1,
              },
            },
          ],
        },
      ],
    },
    {
      id: '2',
      source: 'GDS',
      instantTicketingRequired: false,
      lastTicketingDate: '2024-12-31',
      numberOfBookableSeats: 5,
      itineraries: [
        {
          duration: 'PT6H15M',
          segments: [
            {
              departure: {
                iataCode: 'JFK',
                terminal: '1',
                at: '2024-01-15T14:45:00',
              },
              arrival: {
                iataCode: 'LAX',
                terminal: '2',
                at: '2024-01-15T17:00:00',
              },
              carrierCode: 'DL',
              number: '200',
              aircraft: { code: 'A320' },
              duration: 'PT6H15M',
              id: '2',
              numberOfStops: 0,
              blacklistedInEU: false,
            },
          ],
        },
      ],
      price: {
        currency: 'USD',
        total: '349.00',
        base: '300.00',
        grandTotal: '349.00',
      },
      pricingOptions: {
        fareType: ['PUBLISHED'],
        includedCheckedBagsOnly: true,
      },
      validatingAirlineCodes: ['DL'],
      travelerPricings: [
        {
          travelerId: '1',
          fareOption: 'STANDARD',
          travelerType: 'ADULT',
          price: {
            currency: 'USD',
            total: '349.00',
            base: '300.00',
            grandTotal: '349.00',
          },
          fareDetailsBySegment: [
            {
              segmentId: '2',
              cabin: 'ECONOMY',
              fareBasis: 'Y',
              class: 'Y',
              includedCheckedBags: {
                quantity: 1,
              },
            },
          ],
        },
      ],
    },
    {
      id: '3',
      source: 'GDS',
      instantTicketingRequired: false,
      lastTicketingDate: '2024-12-31',
      numberOfBookableSeats: 7,
      itineraries: [
        {
          duration: 'PT7H45M',
          segments: [
            {
              departure: {
                iataCode: 'JFK',
                terminal: '7',
                at: '2024-01-15T20:15:00',
              },
              arrival: {
                iataCode: 'LAX',
                terminal: '3',
                at: '2024-01-16T00:00:00',
              },
              carrierCode: 'UA',
              number: '300',
              aircraft: { code: 'B787' },
              duration: 'PT7H45M',
              id: '3',
              numberOfStops: 0,
              blacklistedInEU: false,
            },
          ],
        },
      ],
      price: {
        currency: 'USD',
        total: '279.00',
        base: '230.00',
        grandTotal: '279.00',
      },
      pricingOptions: {
        fareType: ['PUBLISHED'],
        includedCheckedBagsOnly: true,
      },
      validatingAirlineCodes: ['UA'],
      travelerPricings: [
        {
          travelerId: '1',
          fareOption: 'STANDARD',
          travelerType: 'ADULT',
          price: {
            currency: 'USD',
            total: '279.00',
            base: '230.00',
            grandTotal: '279.00',
          },
          fareDetailsBySegment: [
            {
              segmentId: '3',
              cabin: 'ECONOMY',
              fareBasis: 'Y',
              class: 'Y',
              includedCheckedBags: {
                quantity: 1,
              },
            },
          ],
        },
      ],
    },
  ];

  // Mock popular routes
  private mockPopularRoutes: PopularRoute[] = [
    {
      origin: 'JFK',
      destination: 'LAX',
      originName: 'New York (JFK)',
      destinationName: 'Los Angeles (LAX)',
      averagePrice: '320',
      popularity: 95,
    },
    {
      origin: 'LAX',
      destination: 'SFO',
      originName: 'Los Angeles (LAX)',
      destinationName: 'San Francisco (SFO)',
      averagePrice: '180',
      popularity: 88,
    },
    {
      origin: 'ORD',
      destination: 'LAX',
      originName: 'Chicago (ORD)',
      destinationName: 'Los Angeles (LAX)',
      averagePrice: '290',
      popularity: 82,
    },
    {
      origin: 'JFK',
      destination: 'LHR',
      originName: 'New York (JFK)',
      destinationName: 'London (LHR)',
      averagePrice: '650',
      popularity: 78,
    },
    {
      origin: 'LAX',
      destination: 'NRT',
      originName: 'Los Angeles (LAX)',
      destinationName: 'Tokyo (NRT)',
      averagePrice: '890',
      popularity: 75,
    },
  ];

  // Search flights
  async searchFlights(searchRequest: FlightSearchRequest): Promise<FlightSearchResponse> {
    try {
      // In production, make actual API call to your backend
      // const response = await fetch(`${this.baseUrl}/flights/search`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(searchRequest),
      // });
      // return await response.json();

      // For demo purposes, return mock data
      await this.saveRecentSearch(searchRequest);
      
      return {
        data: this.mockFlightOffers,
        meta: {
          count: this.mockFlightOffers.length,
          links: {
            self: `${this.baseUrl}/flights/search`,
          },
        },
        dictionaries: {
          locations: {
            JFK: { cityCode: 'NYC', countryCode: 'US' },
            LAX: { cityCode: 'LAX', countryCode: 'US' },
          },
          aircraft: {
            B737: 'Boeing 737',
            A320: 'Airbus A320',
            B787: 'Boeing 787',
          },
          currencies: {
            USD: 'US Dollar',
          },
          carriers: {
            AA: 'American Airlines',
            DL: 'Delta Air Lines',
            UA: 'United Airlines',
          },
        },
      };
    } catch (error: any) {
      throw new Error(`Flight search failed: ${error.message}`);
    }
  }

  // Search airports
  async searchAirports(query: string): Promise<AirportSearchResponse> {
    try {
      // In production, make actual API call
      // const response = await fetch(`${this.baseUrl}/airports/search?q=${encodeURIComponent(query)}`);
      // return await response.json();

      // Mock airport data
      const mockAirports = [
        {
          type: 'airport',
          subType: 'airport',
          name: 'John F. Kennedy International Airport',
          detailedName: 'New York (NYC) - John F. Kennedy International',
          id: 'JFK',
          self: {
            href: 'https://api.amadeus.com/v1/reference-data/locations/JFK',
            methods: ['GET'],
          },
          timeZoneOffset: '-05:00',
          iataCode: 'JFK',
          geoCode: {
            latitude: 40.6413,
            longitude: -73.7781,
          },
          address: {
            cityName: 'New York',
            cityCode: 'NYC',
            countryName: 'United States',
            countryCode: 'US',
            regionCode: 'US-NY',
          },
          analytics: {
            travelers: {
              score: 95,
            },
          },
        },
        {
          type: 'airport',
          subType: 'airport',
          name: 'Los Angeles International Airport',
          detailedName: 'Los Angeles (LAX) - Los Angeles International',
          id: 'LAX',
          self: {
            href: 'https://api.amadeus.com/v1/reference-data/locations/LAX',
            methods: ['GET'],
          },
          timeZoneOffset: '-08:00',
          iataCode: 'LAX',
          geoCode: {
            latitude: 33.9416,
            longitude: -118.4085,
          },
          address: {
            cityName: 'Los Angeles',
            cityCode: 'LAX',
            countryName: 'United States',
            countryCode: 'US',
            regionCode: 'US-CA',
          },
          analytics: {
            travelers: {
              score: 92,
            },
          },
        },
      ];

      const filteredAirports = mockAirports.filter(airport =>
        airport.name.toLowerCase().includes(query.toLowerCase()) ||
        airport.iataCode.toLowerCase().includes(query.toLowerCase()) ||
        airport.address.cityName.toLowerCase().includes(query.toLowerCase())
      );

      return {
        data: filteredAirports,
        meta: {
          count: filteredAirports.length,
          links: {
            self: `${this.baseUrl}/airports/search`,
          },
        },
      };
    } catch (error: any) {
      throw new Error(`Airport search failed: ${error.message}`);
    }
  }

  // Get popular routes
  async getPopularRoutes(): Promise<PopularRoute[]> {
    try {
      const stored = await AsyncStorage.getItem(POPULAR_ROUTES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Store mock data for first time
      await AsyncStorage.setItem(POPULAR_ROUTES_KEY, JSON.stringify(this.mockPopularRoutes));
      return this.mockPopularRoutes;
    } catch (error: any) {
      console.error('Error getting popular routes:', error);
      return this.mockPopularRoutes;
    }
  }

  // Save recent search
  private async saveRecentSearch(searchRequest: FlightSearchRequest): Promise<void> {
    try {
      const recentSearch: RecentSearch = {
        id: Date.now().toString(),
        origin: searchRequest.originLocationCode,
        destination: searchRequest.destinationLocationCode,
        departureDate: searchRequest.departureDate,
        returnDate: searchRequest.returnDate,
        passengers: searchRequest.adults + (searchRequest.children || 0) + (searchRequest.infants || 0),
        searchedAt: new Date().toISOString(),
      };

      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      const recentSearches: RecentSearch[] = stored ? JSON.parse(stored) : [];
      
      // Add new search to beginning and limit to 10
      recentSearches.unshift(recentSearch);
      const limitedSearches = recentSearches.slice(0, 10);
      
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(limitedSearches));
    } catch (error: any) {
      console.error('Error saving recent search:', error);
    }
  }

  // Get recent searches
  async getRecentSearches(): Promise<RecentSearch[]> {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error: any) {
      console.error('Error getting recent searches:', error);
      return [];
    }
  }

  // Clear recent searches
  async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error: any) {
      console.error('Error clearing recent searches:', error);
    }
  }
}

// Export singleton instance
export default new FlightService();
