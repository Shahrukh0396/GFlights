// Flight search and booking related types

export interface FlightSearchRequest {
  originLocationCode: string;
  destinationLocationCode: string;
  originEntityId?: string;
  destinationEntityId?: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  currencyCode?: string;
}

export interface FlightOffer {
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: Itinerary[];
  price: Price;
  pricingOptions: PricingOptions;
  validatingAirlineCodes: string[];
  travelerPricings: TravelerPricing[];
}

export interface Itinerary {
  duration: string;
  segments: Segment[];
}

export interface Segment {
  departure: Location;
  arrival: Location;
  carrierCode: string;
  number: string;
  aircraft: Aircraft;
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

export interface Location {
  iataCode: string;
  terminal?: string;
  at: string;
}

export interface Aircraft {
  code: string;
}

export interface Price {
  currency: string;
  total: string;
  base: string;
  fees?: Fee[];
  grandTotal?: string;
}

export interface Fee {
  amount: string;
  type: string;
}

export interface PricingOptions {
  fareType: string[];
  includedCheckedBagsOnly: boolean;
}

export interface TravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: Price;
  fareDetailsBySegment: FareDetailsBySegment[];
}

export interface FareDetailsBySegment {
  segmentId: string;
  cabin: string;
  fareBasis: string;
  class: string;
  includedCheckedBags: IncludedCheckedBags;
}

export interface IncludedCheckedBags {
  quantity: number;
}

export interface FlightSearchResponse {
  data: FlightOffer[];
  meta: {
    count: number;
    links: {
      self: string;
    };
  };
  dictionaries: {
    locations: Record<string, LocationInfo>;
    aircraft: Record<string, string>;
    currencies: Record<string, string>;
    carriers: Record<string, string>;
  };
}

export interface LocationInfo {
  cityCode: string;
  countryCode: string;
}

export interface Airport {
  type: string;
  subType: string;
  name: string;
  detailedName: string;
  id: string;
  skyId?: string; // Sky ID for flight search (e.g., "LOND", "NYCA")
  entityId?: string; // Entity ID for flight search (e.g., "27544008")
  self: {
    href: string;
    methods: string[];
  };
  timeZoneOffset: string;
  iataCode: string;
  geoCode: {
    latitude: number;
    longitude: number;
  };
  address: {
    cityName: string;
    cityCode: string;
    countryName: string;
    countryCode: string;
    regionCode: string;
  };
  analytics: {
    travelers: {
      score: number;
    };
  };
}

export interface AirportSearchResponse {
  data: Airport[];
  meta: {
    count: number;
    links: {
      self: string;
    };
  };
}

export interface FlightSearchError {
  status: number;
  code: number;
  title: string;
  detail: string;
  source: {
    parameter: string;
    example: string;
  };
}

// Recent search types for local storage
export interface RecentSearch {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  searchedAt: string;
  results?: FlightOffer[];
}

// Popular routes for suggestions
export interface PopularRoute {
  origin: string;
  destination: string;
  originName: string;
  destinationName: string;
  averagePrice?: string;
  popularity: number;
}
