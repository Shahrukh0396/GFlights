import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
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

class FlightService {

  // Mock popular routes (keeping this for now as it's not in the backend API)
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
      // Convert cabin class to backend format (lowercase with underscores)
      const convertCabinClass = (travelClass?: string): string => {
        switch (travelClass?.toUpperCase()) {
          case 'ECONOMY':
            return 'economy';
          case 'PREMIUM_ECONOMY':
            return 'premium_economy';
          case 'BUSINESS':
            return 'business';
          case 'FIRST':
            return 'first';
          default:
            return 'economy';
        }
      };

      // Validate departure date format
      const departureDate = new Date(searchRequest.departureDate);
      if (isNaN(departureDate.getTime())) {
        throw new Error('Invalid departure date format');
      }

      // Validate required fields - Updated to match backend expectations
      if (!searchRequest.originLocationCode || !searchRequest.destinationLocationCode) {
        throw new Error('Origin and destination airport codes are required');
      }
      
      if (!searchRequest.originEntityId || !searchRequest.destinationEntityId) {
        throw new Error('Origin and destination entity IDs are required. Please select airports from the search results.');
      }

      // Convert our frontend search request to backend format - Updated to match backend DTO
      const backendRequest: any = {
        originSkyId: searchRequest.originLocationCode,
        destinationSkyId: searchRequest.destinationLocationCode,
        originEntityId: searchRequest.originEntityId,
        destinationEntityId: searchRequest.destinationEntityId,
        departureDate: searchRequest.departureDate,
        cabinClass: convertCabinClass(searchRequest.travelClass),
        adults: searchRequest.adults?.toString() || '1',
        children: searchRequest.children?.toString() || '0',
        infants: searchRequest.infants?.toString() || '0',
        sortBy: 'best',
        currency: searchRequest.currencyCode || 'USD',
        market: 'en-US',
        countryCode: 'US'
      };

      // Only include returnDate if it's provided and not empty
      if (searchRequest.returnDate && searchRequest.returnDate.trim() !== '') {
        // Ensure the date is in proper ISO 8601 format (YYYY-MM-DD)
        const returnDate = new Date(searchRequest.returnDate);
        if (!isNaN(returnDate.getTime())) {
          backendRequest.returnDate = searchRequest.returnDate;
        } else {
          console.warn('Invalid return date format:', searchRequest.returnDate);
        }
      }

      // Debug logging
      console.log('Sending flight search request to backend:', JSON.stringify(backendRequest, null, 2));

      // Updated to use POST request to /flights/search endpoint
      const response = await api.post('/flights/search', backendRequest);
      
      // Save recent search
      await this.saveRecentSearch(searchRequest);
      
      // Transform backend response to match our frontend interface
      // Backend now returns { success: true, data: ... } structure
      const responseData = response.data.data || [];
      
      return {
        data: responseData,
        meta: {
          count: responseData.length || 0,
          links: {
            self: '/flights/search',
          },
        },
        dictionaries: response.data.dictionaries || {},
      };
    } catch (error: any) {
      console.error('Flight search error:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      
      // Handle backend error response format
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Flight search failed: ${errorMessage}`);
    }
  }

  // Search airports
  async searchAirports(query: string): Promise<AirportSearchResponse> {
    try {
      const response = await api.get('/flights/search-airports', {
        params: {
          query: query,
          locale: 'en-US'
        }
      });

      return {
        data: response.data.data || [],
        meta: {
          count: response.data.data?.length || 0,
          links: {
            self: '/flights/search-airports',
          },
        },
      };
    } catch (error: any) {
      console.error('Airport search error:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(`Airport search failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get nearby airports
  async getNearbyAirports(lat: number, lng: number, locale: string = 'en-US'): Promise<AirportSearchResponse> {
    try {
      const response = await api.get('/flights/nearby-airports', {
        params: {
          lat: lat.toString(),
          lng: lng.toString(),
          locale: locale
        }
      });

      return {
        data: response.data.data || [],
        meta: {
          count: response.data.data?.length || 0,
          links: {
            self: '/flights/nearby-airports',
          },
        },
      };
    } catch (error: any) {
      console.error('Nearby airports search error:', error, error.response);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(`Nearby airports search failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get price calendar
  async getPriceCalendar(originSkyId: string, destinationSkyId: string, fromDate: string, currency: string = 'USD'): Promise<any> {
    try {
      const response = await api.get('/flights/price-calendar', {
        params: {
          originSkyId,
          destinationSkyId,
          fromDate,
          currency
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Price calendar error:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(`Price calendar failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get popular routes (keeping mock data as this endpoint doesn't exist in backend)
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
