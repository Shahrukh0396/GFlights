/**
 * Example Backend API Structure for GFlights
 * This is a Node.js/Express example showing how to integrate with Amadeus API
 * 
 * To use this:
 * 1. Install dependencies: npm install express cors axios dotenv
 * 2. Set up environment variables (see .env.example)
 * 3. Run: node backend-example.js
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Amadeus API configuration
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com/v1';
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;

let accessToken = null;
let tokenExpiry = null;

// Get Amadeus access token
async function getAmadeusToken() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(`${AMADEUS_BASE_URL}/security/oauth2/token`, 
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_API_KEY,
        client_secret: AMADEUS_API_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

    return accessToken;
  } catch (error) {
    console.error('Error getting Amadeus token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Amadeus API');
  }
}

// Search flights endpoint
app.post('/flights/search', async (req, res) => {
  try {
    const token = await getAmadeusToken();
    const searchParams = req.body;

    // Validate required parameters
    if (!searchParams.originLocationCode || !searchParams.destinationLocationCode || !searchParams.departureDate) {
      return res.status(400).json({
        error: 'Missing required parameters: originLocationCode, destinationLocationCode, departureDate'
      });
    }

    // Build Amadeus API query parameters
    const amadeusParams = {
      originLocationCode: searchParams.originLocationCode,
      destinationLocationCode: searchParams.destinationLocationCode,
      departureDate: searchParams.departureDate,
      adults: searchParams.adults || 1,
      currencyCode: searchParams.currencyCode || 'USD',
      max: searchParams.max || 10,
    };

    if (searchParams.returnDate) {
      amadeusParams.returnDate = searchParams.returnDate;
    }

    if (searchParams.children) {
      amadeusParams.children = searchParams.children;
    }

    if (searchParams.infants) {
      amadeusParams.infants = searchParams.infants;
    }

    if (searchParams.travelClass) {
      amadeusParams.travelClass = searchParams.travelClass;
    }

    // Make request to Amadeus API
    const response = await axios.get(`${AMADEUS_BASE_URL}/shopping/flight-offers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params: amadeusParams,
    });

    // Log the request for debugging
    console.log('Amadeus API Response:', {
      status: response.status,
      dataCount: response.data.data?.length || 0,
    });

    // Return the flight offers
    res.json(response.data);

  } catch (error) {
    console.error('Flight search error:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      return res.status(400).json({
        error: 'Invalid search parameters',
        details: error.response.data
      });
    }

    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'API authentication failed'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search flights'
    });
  }
});

// Search airports endpoint
app.get('/airports/search', async (req, res) => {
  try {
    const token = await getAmadeusToken();
    const query = req.query.q;

    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Query parameter "q" is required and must be at least 2 characters'
      });
    }

    const response = await axios.get(`${AMADEUS_BASE_URL}/reference-data/locations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params: {
        subType: 'AIRPORT',
        keyword: query,
        'page[limit]': 20,
      },
    });

    res.json(response.data);

  } catch (error) {
    console.error('Airport search error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search airports'
    });
  }
});

// Get popular routes (mock data for demo)
app.get('/routes/popular', async (req, res) => {
  const popularRoutes = [
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

  res.json(popularRoutes);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'GFlights API'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GFlights Backend API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Flight search: POST http://localhost:${PORT}/flights/search`);
  console.log(`✈️  Airport search: GET http://localhost:${PORT}/airports/search?q=JFK`);
  console.log(`📊 Popular routes: GET http://localhost:${PORT}/routes/popular`);
});

module.exports = app;
