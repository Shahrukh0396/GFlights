import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  FlightOffer,
  FlightSearchRequest,
  FlightSearchResponse,
  PopularRoute,
  RecentSearch,
} from '../types/flight';
import flightService from '../services/flightService';

interface FlightContextType {
  // State
  flightOffers: FlightOffer[];
  popularRoutes: PopularRoute[];
  recentSearches: RecentSearch[];
  isLoading: boolean;
  searchError: string | null;

  // Actions
  searchFlights: (searchRequest: FlightSearchRequest) => Promise<void>;
  clearSearchResults: () => void;
  getPopularRoutes: () => Promise<void>;
  getRecentSearches: () => Promise<void>;
  clearRecentSearches: () => Promise<void>;
}

const FlightContext = createContext<FlightContextType | undefined>(undefined);

interface FlightProviderProps {
  children: ReactNode;
}

export const FlightProvider: React.FC<FlightProviderProps> = ({ children }) => {
  const [flightOffers, setFlightOffers] = useState<FlightOffer[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<PopularRoute[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Search flights
  const searchFlights = async (searchRequest: FlightSearchRequest) => {
    try {
      setIsLoading(true);
      setSearchError(null);
      
      const response: FlightSearchResponse = await flightService.searchFlights(searchRequest);
      setFlightOffers(response.data);
      
      // Refresh recent searches to show the new search
      await getRecentSearches();
    } catch (error: any) {
      setSearchError(error.message || 'Failed to search flights');
      setFlightOffers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear search results
  const clearSearchResults = () => {
    setFlightOffers([]);
    setSearchError(null);
  };

  // Get popular routes
  const getPopularRoutes = async () => {
    try {
      const routes = await flightService.getPopularRoutes();
      setPopularRoutes(routes);
    } catch (error: any) {
      console.error('Error loading popular routes:', error);
    }
  };

  // Get recent searches
  const getRecentSearches = async () => {
    try {
      const searches = await flightService.getRecentSearches();
      setRecentSearches(searches);
    } catch (error: any) {
      console.error('Error loading recent searches:', error);
    }
  };

  // Clear recent searches
  const clearRecentSearches = async () => {
    try {
      await flightService.clearRecentSearches();
      setRecentSearches([]);
    } catch (error: any) {
      console.error('Error clearing recent searches:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    getPopularRoutes();
    getRecentSearches();
  }, []);

  const value: FlightContextType = {
    // State
    flightOffers,
    popularRoutes,
    recentSearches,
    isLoading,
    searchError,

    // Actions
    searchFlights,
    clearSearchResults,
    getPopularRoutes,
    getRecentSearches,
    clearRecentSearches,
  };

  return (
    <FlightContext.Provider value={value}>
      {children}
    </FlightContext.Provider>
  );
};

// Custom hook to use flight context
export const useFlight = (): FlightContextType => {
  const context = useContext(FlightContext);
  if (context === undefined) {
    throw new Error('useFlight must be used within a FlightProvider');
  }
  return context;
};

export default FlightContext;
